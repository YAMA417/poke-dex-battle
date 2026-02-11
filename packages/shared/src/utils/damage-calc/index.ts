/**
 * ダメージ計算エンジン（Phase 1）
 * 基本的なモジュール群をエクスポート
 */

// 基本的なモジュール
export { applyOtherModifiers } from "./apply-other-modifiers";
export { applyRandom } from "./apply-random";
export { calculateBaseDamage } from "./calculate-base-damage";
export { pokeRound } from "./poke-round";

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
