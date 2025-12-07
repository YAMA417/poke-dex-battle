import { calcTypeEffectiveness } from "../constants/types";
import type {
  DamageCalculationInput,
  DamageResult,
  StatStage,
} from "../types/damage";

import type { Weather } from "../types/damage";
import type { PokemonType } from "../types/pokemon";

/**
 * 能力ランクから補正倍率を取得
 * ランク補正: https://wiki.xn--rckteqa2e.com/wiki/%E8%83%BD%E5%8A%9B%E5%A4%89%E5%8C%96
 */
export function getStatStageMultiplier(stage: StatStage): number {
  const multipliers: Record<StatStage, number> = {
    "-6": 2 / 8,
    "-5": 2 / 7,
    "-4": 2 / 6,
    "-3": 2 / 5,
    "-2": 2 / 4,
    "-1": 2 / 3,
    "0": 2 / 2,
    "1": 3 / 2,
    "2": 4 / 2,
    "3": 5 / 2,
    "4": 6 / 2,
    "5": 7 / 2,
    "6": 8 / 2,
  };
  return multipliers[stage];
}

/**
 * タイプ一致補正 (STAB) を計算
 * 第9世代: テラスタル考慮
 */
export function calculateStab(
  moveType: PokemonType,
  attackerTypes: PokemonType[],
  attackerTeraType?: PokemonType,
  isTerastallized?: boolean
): number {
  // テラスタル使用時
  if (isTerastallized && attackerTeraType) {
    // テラスタイプと技タイプが一致
    if (attackerTeraType === moveType) {
      // 元のタイプにも含まれていた場合は2.0倍、そうでなければ1.5倍
      return attackerTypes.includes(moveType) ? 2.0 : 1.5;
    }
    // テラスタイプと不一致の場合は補正なし
    return 1.0;
  }

  // 通常時: 元のタイプと一致すれば1.5倍
  return attackerTypes.includes(moveType) ? 1.5 : 1.0;
}

/**
 * 天候補正を計算
 */
export function calculateWeatherModifier(
  moveType: PokemonType,
  weather: Weather
): number {
  if (weather === "sun") {
    if (moveType === "Fire") return 1.5;
    if (moveType === "Water") return 0.5;
  }
  if (weather === "rain") {
    if (moveType === "Water") return 1.5;
    if (moveType === "Fire") return 0.5;
  }
  return 1.0;
}

/**
 * 基本ダメージを計算（乱数・その他補正を除く）
 */
export function calculateBaseDamage(input: DamageCalculationInput): number {
  const {
    movePower,
    attackerLevel,
    attackerAttack,
    defenderDefense,
    moveCategory,
    condition,
  } = input;

  // 能力ランク補正を適用
  const attackStage =
    moveCategory === "Physical"
      ? condition.attackerStatStages.attack
      : condition.attackerStatStages.specialAttack;
  const defenseStage =
    moveCategory === "Physical"
      ? condition.defenderStatStages.defense
      : condition.defenderStatStages.specialDefense;

  const attackMultiplier = getStatStageMultiplier(attackStage);
  const defenseMultiplier = getStatStageMultiplier(defenseStage);

  const effectiveAttack = Math.floor(attackerAttack * attackMultiplier);
  const effectiveDefense = Math.floor(defenderDefense / defenseMultiplier);

  // 急所の場合は能力ダウンを無視（簡易実装）
  const finalAttack =
    condition.isCriticalHit && attackStage < 0
      ? attackerAttack
      : effectiveAttack;
  const finalDefense =
    condition.isCriticalHit && defenseStage > 0
      ? defenderDefense
      : effectiveDefense;

  // ダメージ計算式
  // ((レベル × 2 ÷ 5 + 2) × 技威力 × 攻撃 ÷ 防御) ÷ 50 + 2
  const levelFactor = Math.floor((attackerLevel * 2) / 5) + 2;
  const damage = Math.floor(
    Math.floor(
      Math.floor((levelFactor * movePower * finalAttack) / finalDefense) / 50
    ) + 2
  );

  return damage;
}

/**
 * 全補正を適用してダメージを計算
 */
export function calculateDamage(input: DamageCalculationInput): DamageResult {
  const baseDamage = calculateBaseDamage(input);

  // タイプ一致補正
  const stab = calculateStab(
    input.moveType,
    input.attackerTypes,
    input.attackerTeraType,
    input.condition.attackerTerastallized
  );

  // タイプ相性
  const typeEffectiveness = calcTypeEffectiveness(
    input.moveType,
    input.defenderTypes
  );

  // 天候補正
  const weatherModifier = calculateWeatherModifier(
    input.moveType,
    input.condition.weather
  );

  // 急所補正
  const criticalModifier = input.condition.isCriticalHit ? 1.5 : 1.0;

  // ダブルバトル補正（全体技は0.75倍）
  const spreadModifier =
    input.condition.isDoubleBattle && input.condition.isSpreadMove ? 0.75 : 1.0;

  // てだすけ補正（1.5倍）
  const helpingHandModifier = input.condition.isHelpingHand ? 1.5 : 1.0;

  // 乱数の範囲: 0.85〜1.00 (16段階: 85, 86, 87, ..., 100)
  const randomMin = 0.85;
  const randomMax = 1.0;

  // 最小ダメージを計算（乱数0.85）
  let minDamage = Math.floor(baseDamage * randomMin);
  minDamage = Math.floor(minDamage * stab);
  minDamage = Math.floor(minDamage * typeEffectiveness);
  minDamage = Math.floor(minDamage * weatherModifier);
  minDamage = Math.floor(minDamage * criticalModifier);
  minDamage = Math.floor(minDamage * spreadModifier);
  minDamage = Math.floor(minDamage * helpingHandModifier);

  // 最大ダメージを計算（乱数1.00）
  let maxDamage = Math.floor(baseDamage * randomMax);
  maxDamage = Math.floor(maxDamage * stab);
  maxDamage = Math.floor(maxDamage * typeEffectiveness);
  maxDamage = Math.floor(maxDamage * weatherModifier);
  maxDamage = Math.floor(maxDamage * criticalModifier);
  maxDamage = Math.floor(maxDamage * spreadModifier);
  maxDamage = Math.floor(maxDamage * helpingHandModifier);

  // 防御側のHPを仮定（後でUI側で上書き可能）
  const defenderHp = 100; // ダミー値

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
      criticalModifier,
      randomModifier: [randomMin, randomMax],
    },
  };
}
