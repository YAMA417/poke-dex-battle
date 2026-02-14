import type { DamageCalculationInput, DamageResult } from "../types/damage";
import { calculateDamageV2 } from "./damage-calc/index";
import { convertLegacyInput } from "./damage-calc/legacy-adapter";

/**
 * 旧API互換ラッパー：DamageCalculationInputを新エンジンで処理
 * 新ダメージ計算エンジン（calculateDamageV2）経由により実行
 *
 * Phase 1 の旧 calculateDamage API との互換性を保ちながら、
 * リファクタリングされた新エンジンを使用する
 *
 * @param input - 旧形式のダメージ計算入力
 * @returns ダメージ計算結果
 */
export function calculateDamage(input: DamageCalculationInput): DamageResult {
  // 旧形式を新形式に変換
  const { attacker, defender, move, context } = convertLegacyInput(input);

  // 新エンジンで計算
  return calculateDamageV2(attacker, defender, move, context);
}
