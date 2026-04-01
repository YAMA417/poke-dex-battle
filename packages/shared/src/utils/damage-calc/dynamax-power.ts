/**
 * ダイマックス技威力変換テーブル
 * 元技の威力からダイマックス技の威力を算出
 */
export function getDynamaxMovePower(basePower: number): number {
  if (basePower <= 40) return 90;
  if (basePower <= 50) return 100;
  if (basePower <= 60) return 110;
  if (basePower <= 70) return 120;
  if (basePower <= 100) return 130;
  if (basePower <= 140) return 140;
  return 150; // 150+
}
