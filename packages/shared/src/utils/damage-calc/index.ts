import type { BattleContext, CalcMove, CalcPokemon, DamageResult } from '../../types/damage';
import { isPokemonType } from '../../types/pokemon';
import { moveIs } from '../normalize-id';
import { calculateBaseDamage } from './calculate-base-damage';
import { calculateModifier } from './calculate-modifier';
import { getDynamaxMovePower } from './dynamax-power';
import { resolveBasePower } from './resolve-base-power';
import { resolveEffectiveAttack, resolveEffectiveDefense } from './resolve-effective-stat';
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

// 型定義
export type { BattleContext, CalcMove, CalcPokemon } from '../../types/damage';

/**
 * 新ダメージ計算エンジン（V2）のメインエントリポイント
 * 新型（CalcPokemon, CalcMove, BattleContext）での直接計算
 *
 * @param attacker - 攻撃側ポケモン
 * @param defender - 防御側ポケモン
 * @param move - 技情報
 * @param context - バトルコンテキスト
 * @returns ダメージ計算結果
 */
export function calculateDamageV2(
  attacker: CalcPokemon,
  defender: CalcPokemon,
  move: CalcMove,
  context: BattleContext
): DamageResult {
  // テラバースト (Tera Blast): テラスタル時の処理
  let effectiveMove: CalcMove = move;
  if (moveIs(move.name, 'Tera Blast') && attacker.isTerastallized) {
    const isStellar = attacker.teraType === 'Stellar';
    const newPower = isStellar ? 100 : move.power;
    // ステラ時はノーマルタイプ維持（相性は別途オーバーライド）
    // 通常テラスタル時はテラタイプに変更
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

  // 6. HPを決定（ダイマックス時は2倍）
  const baseHp = defender.maxHp ?? defender.stats.hp ?? 100;
  const defenderHp = defender.isDynamaxed ? baseHp * 2 : baseHp;

  // 7. 結果を構築
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
