import type { BattleContext, CalcMove, CalcPokemon, DamageResult } from '../../types/damage';
import { isPokemonType } from '../../types/pokemon';
import { moveIs } from '../normalize-id';
import { calculateBaseDamage } from './calculate-base-damage';
import { calculateModifier } from './calculate-modifier';
import { calculateMultiHitDamage } from './calculate-multi-hit';
import { getDynamaxMovePower } from './dynamax-power';
import { resolveBasePower } from './resolve-base-power';
import { resolveEffectiveAttack, resolveEffectiveDefense } from './resolve-effective-stat';
import { resolveHitCountRange } from './resolve-hit-count';
import { getZMovePower } from './z-move-power';

/**
 * ダメージ計算エンジン（Phase 2）
 * 基本的なモジュール群をエクスポート
 */

// Phase 1 モジュール
export { applyOtherModifiers } from './apply-other-modifiers';
export { applyRandom } from './apply-random';
export { calculateBaseDamage } from './calculate-base-damage';
export { pokeRound } from './poke-round';

// Phase 2 モジュール
export { calculateModifier } from './calculate-modifier';
export { getDynamaxMovePower } from './dynamax-power';
export { resolveBasePower } from './resolve-base-power';
export { resolveEffectiveAttack, resolveEffectiveDefense } from './resolve-effective-stat';
export { getZMovePower } from './z-move-power';

// damageEffect ルール解釈
export {
  applyPowerModifierRule,
  evaluateAttackerModifier,
  evaluateDefenderModifier,
} from './apply-damage-effect';

// 既存のdamage-calc.tsから再エクスポート
export {
  calculateAttackerAbilityModifier,
  calculateAttackerItemModifier,
  calculateDefenderAbilityModifier,
  calculateDefenderItemModifier,
  calculateFieldModifier,
  calculateStab,
  calculateWeatherModifier,
  getStatStageMultiplier,
} from '../damage-calc';

// 連続技
export { resolveHitCountRange } from './resolve-hit-count';
export type { HitCountRange } from './resolve-hit-count';

// 型定義
export type { BattleContext, CalcMove, CalcPokemon } from '../../types/damage';

/**
 * 新ダメージ計算エンジン（V2）のメインエントリポイント
 * 新型（CalcPokemon, CalcMove, BattleContext）での直接計算
 */
export function calculateDamageV2(
  attacker: CalcPokemon,
  defender: CalcPokemon,
  move: CalcMove,
  context: BattleContext
): DamageResult {
  // テラバースト: damageEffect または文字列で判定
  let effectiveMove: CalcMove = move;
  const isTeraBlast =
    (move.damageEffect?.powerModifier &&
      (move.damageEffect.powerModifier as any).condition === 'tera_blast') ||
    moveIs(move.name, 'Tera Blast');

  if (isTeraBlast && attacker.isTerastallized) {
    const isStellar = attacker.teraType === 'Stellar';
    const newPower = isStellar ? 100 : move.power;
    const newType = isStellar
      ? move.type
      : attacker.teraType && isPokemonType(attacker.teraType)
        ? attacker.teraType
        : move.type;
    const newCategory = attacker.stats.atk > attacker.stats.spa ? 'Physical' : move.category;
    effectiveMove = { ...move, power: newPower, type: newType, category: newCategory };
  }

  // テラスタル威力底上げ: テラタイプ一致技で威力60未満 → 60
  if (
    attacker.isTerastallized &&
    attacker.teraType &&
    attacker.teraType !== 'Stellar' &&
    attacker.teraType === effectiveMove.type &&
    effectiveMove.power > 0 &&
    effectiveMove.power < 60 &&
    !effectiveMove.flags?.isPriorityMove &&
    !effectiveMove.flags?.isMultiHitMove &&
    !effectiveMove.flags?.isVariablePowerMove
  ) {
    effectiveMove = { ...effectiveMove, power: 60 };
  }

  // Z技: 威力を変換
  if (effectiveMove.isZMove) {
    effectiveMove = { ...effectiveMove, power: getZMovePower(effectiveMove.power) };
  }

  // ダイマックス技: 威力を変換
  if (effectiveMove.isDynamaxMove) {
    effectiveMove = { ...effectiveMove, power: getDynamaxMovePower(effectiveMove.power) };
  }

  // HPを決定（ダイマックス時は2倍）
  const baseHp = defender.maxHp ?? defender.stats.hp ?? 100;
  const defenderHp = defender.isDynamaxed ? baseHp * 2 : baseHp;

  // 連続技分岐: multiHit がある場合は複数回計算
  const multiHit = effectiveMove.damageEffect?.multiHit;
  if (multiHit) {
    const range = resolveHitCountRange(multiHit, attacker.ability, attacker.item);
    // hitCount を range 内にクランプ（スキルリンク等で強制される場合に対応）
    const rawHitCount = effectiveMove.hitCount ?? range.defaultCount;
    const hitCount = Math.max(range.min, Math.min(range.max, rawHitCount));

    // 1発計算用のコールバック（前処理済みの effectiveMove を受け取り、power だけ差し替えて計算）
    const singleHitCalc = (m: CalcMove): DamageResult => {
      const finalPower = resolveBasePower(m, attacker, defender, context);
      const finalAttack = resolveEffectiveAttack(attacker, m, context, defender.ability);
      const finalDefense = resolveEffectiveDefense(defender, m, attacker.ability, context);
      const baseDamage = calculateBaseDamage(attacker.level, finalPower, finalAttack, finalDefense);
      const { minDamage, maxDamage, stab, typeEffectiveness, weatherModifier } = calculateModifier(
        baseDamage,
        attacker,
        defender,
        m,
        context
      );

      return {
        minDamage,
        maxDamage,
        minPercent: Math.round((minDamage / defenderHp) * 100 * 10) / 10,
        maxPercent: Math.round((maxDamage / defenderHp) * 100 * 10) / 10,
        guaranteed: maxDamage > 0 ? Math.ceil(defenderHp / maxDamage) : Infinity,
        possible: minDamage > 0 ? Math.ceil(defenderHp / minDamage) : Infinity,
        details: {
          baseDamage,
          typeEffectiveness,
          stab,
          weatherModifier,
          criticalModifier: m.isCritical ? 1.5 : 1.0,
          randomModifier: [0.85, 1.0],
        },
      };
    };

    return calculateMultiHitDamage(singleHitCalc, effectiveMove, multiHit, hitCount, defenderHp);
  }

  // 通常1発計算
  // 1. 技の最終威力を計算
  const finalPower = resolveBasePower(effectiveMove, attacker, defender, context);

  // 2. 実効攻撃力を計算
  const finalAttack = resolveEffectiveAttack(attacker, effectiveMove, context, defender.ability);

  // 3. 実効防御力を計算
  const finalDefense = resolveEffectiveDefense(defender, effectiveMove, attacker.ability, context);

  // 4. ベースダメージを計算
  const baseDamage = calculateBaseDamage(attacker.level, finalPower, finalAttack, finalDefense);

  // 5. 補正を適用（min/maxダメージに分岐）
  const { minDamage, maxDamage, stab, typeEffectiveness, weatherModifier } = calculateModifier(
    baseDamage,
    attacker,
    defender,
    effectiveMove,
    context
  );

  // 6. 結果を構築
  return {
    minDamage,
    maxDamage,
    minPercent: Math.round((minDamage / defenderHp) * 100 * 10) / 10,
    maxPercent: Math.round((maxDamage / defenderHp) * 100 * 10) / 10,
    guaranteed: maxDamage > 0 ? Math.ceil(defenderHp / maxDamage) : Infinity,
    possible: minDamage > 0 ? Math.ceil(defenderHp / minDamage) : Infinity,
    details: {
      baseDamage,
      typeEffectiveness,
      stab,
      weatherModifier,
      criticalModifier: move.isCritical ? 1.5 : 1.0,
      randomModifier: [0.85, 1.0],
    },
  };
}
