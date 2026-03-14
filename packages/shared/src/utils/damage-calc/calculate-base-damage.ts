/**
 * 基本ダメージを計算する純粋な数学関数
 * ダメージ計算式: ((レベル × 2 ÷ 5 + 2) × 技威力 × 攻撃 ÷ 防御) ÷ 50 + 2
 *
 * @param level - ポケモンのレベル
 * @param power - 技の最終威力（威力補正済み）
 * @param attack - 攻撃側の実効ステータス
 * @param defense - 防御側の実効ステータス
 * @returns ダメージベース値
 */
export function calculateBaseDamage(
  level: number,
  power: number,
  attack: number,
  defense: number
): number {
  const levelFactor = Math.floor((level * 2) / 5) + 2;
  const damage = Math.floor(
    Math.floor(Math.floor((levelFactor * power * attack) / defense) / 50) + 2
  );
  return damage;
}
