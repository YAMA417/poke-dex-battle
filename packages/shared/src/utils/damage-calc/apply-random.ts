/**
 * 乱数幅を適用（0.85〜1.00）
 * seed を指定することで、テスト時に決定論的な乱数を注入できる
 *
 * @param baseDamage - ベースダメージ
 * @param seed - テスト用シード（0-15、乱数値を直接指定）
 * @returns 乱数を適用したダメージ
 */
export function applyRandom(baseDamage: number, seed?: number): number {
  let randomValue: number;

  if (seed !== undefined) {
    // テスト用: シード値を直接使用（0-15の範囲を期待）
    randomValue = seed;
  } else {
    // 本番: Math.random() で 0-15 の整数を生成
    randomValue = Math.floor(Math.random() * 16);
  }

  // 乱数因子: (85 + randomValue) / 100
  // randomValue が 0-15 の場合、85/100 〜 100/100 の幅
  const factor = (85 + randomValue) / 100;
  return Math.floor(baseDamage * factor);
}
