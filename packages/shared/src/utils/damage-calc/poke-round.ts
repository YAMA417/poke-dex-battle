/**
 * Pokemon-style rounding: round to nearest integer, rounding DOWN at 0.5
 * 第5世代以降のダメージ計算で使用される丸め処理
 * 例: 142.5 → 142, 142.6 → 143, 142.4 → 142
 */
export function pokeRound(value: number): number {
  const decimal = value - Math.floor(value);
  if (decimal < 0.5) {
    return Math.floor(value);
  } else if (decimal > 0.5) {
    return Math.ceil(value);
  } else {
    // Exactly 0.5: round down
    return Math.floor(value);
  }
}
