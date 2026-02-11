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

// 既存のdamage-calc.tsから再エクスポート
export {
  calculateAttackerAbilityModifier,
  calculateAttackerItemModifier,
  calculateDamage,
  calculateDefenderAbilityModifier,
  calculateDefenderItemModifier,
  calculateStab,
  calculateWeatherModifier,
  getStatStageMultiplier,
} from "../damage-calc";

// 型定義
export type { BattleContext, CalcMove, CalcPokemon } from "../../types/damage";
