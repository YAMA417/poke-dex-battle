/**
 * 名前文字列を Showdown ID 形式（小文字英数字のみ）に正規化する
 * PokeAPIスラッグ / Title Case / Showdown ID のいずれからでも同じ結果を返す
 *
 * @example
 * normalizeId('hadron-engine')  // → 'hadronengine'
 * normalizeId('Hadron Engine')  // → 'hadronengine'
 * normalizeId('Power-Up Punch') // → 'poweruppunch'
 */
export function normalizeId(name: string | undefined | null): string {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** 特性名の正規化比較 */
export function abilityIs(actual: string | undefined, expected: string): boolean {
  return normalizeId(actual) === normalizeId(expected);
}

/** 持ち物名の正規化比較 */
export function itemIs(actual: string | undefined, expected: string): boolean {
  return normalizeId(actual) === normalizeId(expected);
}

/** 技名の正規化比較 */
export function moveIs(actual: string | undefined, expected: string): boolean {
  return normalizeId(actual) === normalizeId(expected);
}

/**
 * 正規化済みSetに対するルックアップ
 * move-flags.ts 等で使用
 */
export function normalizedSetHas(set: Set<string>, value: string | undefined): boolean {
  if (!value) return false;
  return set.has(normalizeId(value));
}
