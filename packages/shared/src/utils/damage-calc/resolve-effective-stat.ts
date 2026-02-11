import type { CalcMove, CalcPokemon } from "../../types/damage";
import { getStatStageMultiplier } from "../damage-calc";

/**
 * 攻撃側の実効ステータスを計算
 * ランク補正・急所・やけど・持ち物を考慮
 *
 * @param attacker - 攻撃側ポケモン
 * @param move - 技情報
 * @returns 実効攻撃力
 */
export function resolveEffectiveAttack(
  attacker: CalcPokemon,
  move: CalcMove,
): number {
  // 物理か特殊かで使用するステータスを選択
  const isPhysical = move.category === "Physical";
  const baseStat = isPhysical ? attacker.stats.atk : attacker.stats.spa;
  const stage = isPhysical
    ? (attacker.boosts?.atk ?? 0)
    : (attacker.boosts?.spa ?? 0);

  // ランク補正を計算
  const multiplier = getStatStageMultiplier(stage);

  // 急所の場合は能力ダウンを無視（負のランクを適用しない）
  const effectiveAttack =
    move.isCritical && stage < 0 ? baseStat : Math.floor(baseStat * multiplier);

  let finalAttack = effectiveAttack;

  // こだわりハチマキ/メガネ: 攻撃を1.5倍
  if (
    (attacker.item === "Choice Band" && isPhysical) ||
    (attacker.item === "Choice Specs" && !isPhysical)
  ) {
    finalAttack = Math.floor(finalAttack * 1.5);
  }

  // ちからのハチマキ/ものしりメガネ: 攻撃を1.1倍
  if (
    (attacker.item === "Muscle Band" && isPhysical) ||
    (attacker.item === "Wise Glasses" && !isPhysical)
  ) {
    finalAttack = Math.floor(finalAttack * 1.1);
  }

  // やけど: 物理攻撃を0.5倍
  if (attacker.status === "burn" && isPhysical) {
    finalAttack = Math.floor(finalAttack * 0.5);
  }

  return finalAttack;
}

/**
 * 防御側の実効ステータスを計算
 * ランク補正・急所を考慮
 *
 * @param defender - 防御側ポケモン
 * @param move - 技情報
 * @returns 実効防御力
 */
export function resolveEffectiveDefense(
  defender: CalcPokemon,
  move: CalcMove,
): number {
  // 物理か特殊かで使用するステータスを選択
  const isPhysical = move.category === "Physical";
  const baseStat = isPhysical ? defender.stats.def : defender.stats.spd;
  const stage = isPhysical
    ? (defender.boosts?.def ?? 0)
    : (defender.boosts?.spd ?? 0);

  // ランク補正を計算
  const multiplier = getStatStageMultiplier(stage);

  // 急所の場合は能力アップを無視（正のランクを適用しない）
  const effectiveDefense =
    move.isCritical && stage > 0 ? baseStat : Math.floor(baseStat * multiplier);

  return effectiveDefense;
}
