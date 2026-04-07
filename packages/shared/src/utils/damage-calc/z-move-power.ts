/**
 * Z技威力変換テーブル
 * 元技の威力からZ技の威力を算出
 */
export function getZMovePower(basePower: number): number {
  if (basePower <= 55) return 100;
  if (basePower <= 60) return 120;
  if (basePower <= 70) return 130;
  if (basePower <= 80) return 140;
  if (basePower <= 90) return 175;
  if (basePower <= 100) return 180;
  if (basePower <= 110) return 185;
  if (basePower <= 125) return 190;
  if (basePower <= 139) return 195;
  return 200; // 140+
}
