import type {
  BattleContext,
  CalcMove,
  CalcPokemon,
  DamageResult,
} from "../../types/damage";
import { calculateBaseDamage } from "./calculate-base-damage";
import { calculateModifier } from "./calculate-modifier";
import { resolveBasePower } from "./resolve-base-power";
import {
  resolveEffectiveAttack,
  resolveEffectiveDefense,
} from "./resolve-effective-stat";

/**
 * ダメージ計算エンジン（Phase 2）
 * 基本的なモジュール群をエクスポート
 */

// Phase 1 モジュール
export { applyOtherModifiers } from "./apply-other-modifiers";
export { applyRandom } from "./apply-random";
export { calculateBaseDamage } from "./calculate-base-damage";
export { pokeRound } from "./poke-round";

// Phase 2 モジュール
export { calculateModifier } from "./calculate-modifier";
export { resolveBasePower } from "./resolve-base-power";
export {
  resolveEffectiveAttack,
  resolveEffectiveDefense,
} from "./resolve-effective-stat";

// Adapter
export { convertLegacyInput } from "./legacy-adapter";

// 既存のdamage-calc.tsから再エクスポート
export {
  calculateAttackerAbilityModifier,
  calculateAttackerItemModifier,
  calculateDefenderAbilityModifier,
  calculateDefenderItemModifier,
  calculateStab,
  calculateWeatherModifier,
  getStatStageMultiplier,
} from "../damage-calc";

// 型定義
export type { BattleContext, CalcMove, CalcPokemon } from "../../types/damage";

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
  context: BattleContext,
): DamageResult {
  // 1. 技の最終威力を計算
  const finalPower = resolveBasePower(move, attacker, defender, context);

  // 2. 実効攻撃力を計算
  const finalAttack = resolveEffectiveAttack(attacker, move);

  // 3. 実効防御力を計算
  const finalDefense = resolveEffectiveDefense(defender, move);

  // 4. ベースダメージを計算
  const baseDamage = calculateBaseDamage(
    attacker.level,
    finalPower,
    finalAttack,
    finalDefense,
  );

  // 5. 補正を適用（min/maxダメージに分岐）
  const { minDamage, maxDamage, stab, typeEffectiveness, weatherModifier } =
    calculateModifier(baseDamage, attacker, defender, move, context);

  // 6. HPを決定
  const defenderHp = defender.maxHp ?? defender.stats.hp ?? 100;

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
