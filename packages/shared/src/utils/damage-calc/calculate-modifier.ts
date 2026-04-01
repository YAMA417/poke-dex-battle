import { getTypeResistBerryType } from '../../constants/item-type-map';
import { calcTypeEffectiveness } from '../../constants/types';
import type { BattleContext, CalcMove, CalcPokemon } from '../../types/damage';
import { isPokemonType } from '../../types/pokemon';
import {
  calculateDefenderAbilityModifier,
  calculateDefenderItemModifier,
  calculateFieldModifier,
  calculateStab,
  calculateWeatherModifier,
} from '../damage-calc';
import { abilityIs, itemIs, moveIs } from '../normalize-id';
import { applyOtherModifiers } from './apply-other-modifiers';

interface ModifierResult {
  minDamage: number;
  maxDamage: number;
  stab: number;
  typeEffectiveness: number;
  weatherModifier: number;
  fieldModifier: number;
}

/**
 * baseDamage後の全補正を公式順序で適用し、min/maxダメージを返す
 *
 * @param baseDamage - ベースダメージ
 * @param attacker - 攻撃側ポケモン
 * @param defender - 防御側ポケモン
 * @param move - 技情報
 * @param context - バトルコンテキスト
 * @returns { minDamage, maxDamage } のオブジェクト
 */
export function calculateModifier(
  baseDamage: number,
  attacker: CalcPokemon,
  defender: CalcPokemon,
  move: CalcMove,
  context: BattleContext
): ModifierResult {
  let minDamage = baseDamage;
  let maxDamage = baseDamage;

  // 1. Targets (全体技補正) - BEFORE random
  if (context.isDoubleBattle && context.isSpreadMove) {
    minDamage = Math.floor(minDamage * 0.75);
    maxDamage = Math.floor(maxDamage * 0.75);
  }

  // 2. Weather (天候補正) - BEFORE random
  const weatherModifier = calculateWeatherModifier(move.type, context.weather || 'none');
  minDamage = Math.floor(minDamage * weatherModifier);
  maxDamage = Math.floor(maxDamage * weatherModifier);

  // 2.5. Field (フィールド補正) - Weather直後、Critical前
  const fieldModifier = calculateFieldModifier(move.type, context.field || 'none');
  minDamage = Math.floor(minDamage * fieldModifier);
  maxDamage = Math.floor(maxDamage * fieldModifier);

  // 3. Critical (急所補正) - BEFORE random
  // スナイパー (Sniper): 急所時 1.5倍 → 2.25倍
  const criticalModifier = move.isCritical
    ? abilityIs(attacker.ability, 'Sniper')
      ? 2.25
      : 1.5
    : 1.0;
  minDamage = Math.floor(minDamage * criticalModifier);
  maxDamage = Math.floor(maxDamage * criticalModifier);

  // 4. Random (乱数: 0.85〜1.00) - ここで最小/最大が分岐
  minDamage = Math.floor(minDamage * 0.85);
  maxDamage = Math.floor(maxDamage * 1.0);

  // 5. STAB (タイプ一致補正) - AFTER random
  // 適応力 (Adaptability) 対応: calculateStab に攻撃側特性を渡す
  const stab = calculateStab(
    move.type,
    attacker.types,
    attacker.teraType,
    attacker.isTerastallized,
    attacker.ability,
    attacker.isStellarBoostUsed
  );
  minDamage = Math.floor(minDamage * stab);
  maxDamage = Math.floor(maxDamage * stab);

  // 6. Type (タイプ相性) - AFTER random
  // 防御側テラスタル: テラタイプで単タイプ判定（ステラは元タイプ維持）
  const defenderEffectiveTypes =
    defender.isTerastallized && defender.teraType && isPokemonType(defender.teraType)
      ? [defender.teraType]
      : defender.types;
  let typeEffectiveness = calcTypeEffectiveness(move.type, defenderEffectiveTypes);

  // ステラテラバースト: 全タイプに等倍
  if (
    moveIs(move.name, 'Tera Blast') &&
    attacker.isTerastallized &&
    attacker.teraType === 'Stellar'
  ) {
    typeEffectiveness = 1.0;
  }

  // 色眼鏡 (Tinted Lens): 効果いまひとつの技が2倍
  const effectiveTypeMultiplier =
    abilityIs(attacker.ability, 'Tinted Lens') && typeEffectiveness < 1
      ? typeEffectiveness * 2
      : typeEffectiveness;

  minDamage = Math.floor(minDamage * effectiveTypeMultiplier);
  maxDamage = Math.floor(maxDamage * effectiveTypeMultiplier);

  // 6.5 イナズマドライブ / アクセルブレイク: 効果抜群時に 5461/4096倍
  if (
    (moveIs(move.name, 'Electro Drift') || moveIs(move.name, 'Collision Course')) &&
    typeEffectiveness > 1
  ) {
    minDamage = Math.floor((minDamage * 5461) / 4096);
    maxDamage = Math.floor((maxDamage * 5461) / 4096);
  }

  // 6.6 半減実: 効果抜群のダメージを0.5倍
  // チランのみ (Normal) はノーマル技が常に等倍以下なので typeEffectiveness > 1 が成立しない → 別途対応
  const resistBerryType = getTypeResistBerryType(defender.item);
  const berryActivates = typeEffectiveness > 1 || resistBerryType === 'Normal';
  if (resistBerryType && resistBerryType === move.type && berryActivates) {
    minDamage = Math.floor(minDamage * 0.5);
    maxDamage = Math.floor(maxDamage * 0.5);
  }

  // 7. "other" modifiers (ダメージ補正のみ) - AFTER Type
  const otherModifiers: number[] = [];

  // リフレクター/ひかりのかべ: ダブル 2732/4096 ≒ 0.667倍、シングル 0.5倍（急所時は無視）
  const screenModifier = context.isDoubleBattle ? 2732 / 4096 : 0.5;

  if (context.reflect && move.category === 'Physical' && !move.isCritical) {
    otherModifiers.push(screenModifier);
  }

  if (context.lightScreen && move.category === 'Special' && !move.isCritical) {
    otherModifiers.push(screenModifier);
  }

  // いのちのたま: ダメージ1.3倍
  if (itemIs(attacker.item, 'Life Orb')) {
    otherModifiers.push(1.3);
  }

  // かたやぶり系 (Mold Breaker / Turboblaze / Teravolt): 防御側特性を無視
  const isMoldBreaker =
    abilityIs(attacker.ability, 'Mold Breaker') ||
    abilityIs(attacker.ability, 'Turboblaze') ||
    abilityIs(attacker.ability, 'Teravolt');

  // 防御側特性によるダメージ補正（かたやぶり系は無視）
  const defenderAbilityModifier = isMoldBreaker
    ? 1.0
    : calculateDefenderAbilityModifier(
        defender.ability,
        typeEffectiveness,
        move.type,
        move.flags,
        defender.currentHp,
        defender.maxHp,
        move.category
      );
  if (defenderAbilityModifier !== 1.0) {
    otherModifiers.push(defenderAbilityModifier);
  }

  // 防御側持ち物によるダメージ補正
  const defenderItemModifier = calculateDefenderItemModifier(defender.item, move.category);
  if (defenderItemModifier !== 1.0) {
    otherModifiers.push(defenderItemModifier);
  }

  // 4096チェーンで補正を適用
  if (otherModifiers.length > 0) {
    minDamage = applyOtherModifiers(minDamage, otherModifiers);
    maxDamage = applyOtherModifiers(maxDamage, otherModifiers);
  }

  return {
    minDamage,
    maxDamage,
    stab,
    typeEffectiveness,
    weatherModifier,
    fieldModifier,
  };
}
