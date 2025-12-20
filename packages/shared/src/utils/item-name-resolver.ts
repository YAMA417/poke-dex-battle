/**
 * ============================================================
 * アイテム名前解決ユーティリティ
 * ============================================================
 *
 * 日本語名・英語名を問わず、アイテムの詳細情報を取得します
 */

import itemNameMap from '../data/item-name-map.json';

export interface ItemNameEntry {
  id: number;
  englishName: string;
  japaneseName: string;
  category: string;
  effect: string | null;
  effectJa: string | null;
}

/**
 * アイテム名マップの型定義
 */
const nameMap = itemNameMap as Record<string, ItemNameEntry>;

/**
 * 入力されたアイテム名（日本語または英語）を、
 * PokéAPIで検索可能な英語名（小文字）に変換します
 *
 * @param input ユーザー入力のアイテム名（日本語 or 英語）
 * @returns 検索用の英語名（小文字）、見つからない場合はnull
 *
 * @example
 * resolveItemName('いのちのたま') // => 'life-orb'
 * resolveItemName('Focus Sash') // => 'focus-sash'
 * resolveItemName('247') // => '247' (IDはそのまま返す)
 * resolveItemName('存在しないアイテム') // => null
 */
export function resolveItemName(input: string): string | null {
  if (!input || input.trim().length === 0) {
    return null;
  }

  const trimmedInput = input.trim();

  // 数字のみの場合はIDとして扱い、そのまま返す
  if (/^\d+$/.test(trimmedInput)) {
    return trimmedInput;
  }

  // マッピングから検索（日本語名・英語名の両方に対応）
  const entry = nameMap[trimmedInput] || nameMap[trimmedInput.toLowerCase()];

  if (entry) {
    return entry.englishName;
  }

  // 見つからない場合はnull
  return null;
}

/**
 * アイテム名からIDを取得
 *
 * @param input アイテム名（日本語 or 英語）
 * @returns アイテムID、見つからない場合はnull
 *
 * @example
 * getItemId('いのちのたま') // => 247
 * getItemId('focus-sash') // => 252
 */
export function getItemId(input: string): number | null {
  if (!input || input.trim().length === 0) {
    return null;
  }

  const trimmedInput = input.trim();

  // 数字のみの場合はIDとして扱う
  if (/^\d+$/.test(trimmedInput)) {
    return Number.parseInt(trimmedInput, 10);
  }

  const entry = nameMap[trimmedInput] || nameMap[trimmedInput.toLowerCase()];
  return entry ? entry.id : null;
}

/**
 * アイテム名から日本語名を取得
 *
 * @param input アイテム名（日本語 or 英語）またはID
 * @returns 日本語名、見つからない場合はnull
 *
 * @example
 * getItemJapaneseName('life-orb') // => 'いのちのたま'
 * getItemJapaneseName('247') // => 'いのちのたま'
 */
export function getItemJapaneseName(input: string | number): string | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry ? entry.japaneseName : null;
}

/**
 * アイテム名から英語名を取得
 *
 * @param input アイテム名（日本語 or 英語）またはID
 * @returns 英語名（小文字）、見つからない場合はnull
 *
 * @example
 * getItemEnglishName('いのちのたま') // => 'life-orb'
 * getItemEnglishName('247') // => 'life-orb'
 */
export function getItemEnglishName(input: string | number): string | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry ? entry.englishName : null;
}

/**
 * アイテム名から完全な情報を取得
 *
 * @param input アイテム名（日本語 or 英語）またはID
 * @returns アイテムの詳細情報、見つからない場合はnull
 *
 * @example
 * getItemDetails('いのちのたま')
 * // => { id: 247, englishName: 'life-orb', japaneseName: 'いのちのたま',
 * //      category: 'held-items', effect: 'Held: Holder's moves inflict 30% extra damage...', effectJa: null }
 */
export function getItemDetails(input: string | number): ItemNameEntry | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry || null;
}

/**
 * アイテムのカテゴリを取得
 *
 * @param input アイテム名（日本語 or 英語）またはID
 * @returns アイテムのカテゴリ、見つからない場合はnull
 *
 * @example
 * getItemCategory('いのちのたま') // => 'held-items'
 * getItemCategory('オボンのみ') // => 'medicine'
 */
export function getItemCategory(input: string | number): string | null {
  const entry = getItemDetails(input);
  return entry?.category ?? null;
}

/**
 * アイテムの効果説明（英語）を取得
 *
 * @param input アイテム名（日本語 or 英語）またはID
 * @returns アイテムの効果説明（英語）、見つからない場合はnull
 *
 * @example
 * getItemEffect('いのちのたま')
 * // => 'Held: Holder's moves inflict 30% extra damage, but cost 10% max HP.'
 */
export function getItemEffect(input: string | number): string | null {
  const entry = getItemDetails(input);
  return entry?.effect ?? null;
}

/**
 * アイテムの効果説明（日本語）を取得
 *
 * @param input アイテム名（日本語 or 英語）またはID
 * @returns アイテムの効果説明（日本語）、見つからない場合はnull
 *
 * @example
 * getItemEffectJa('life-orb') // => null (現在は日本語説明が取得できていない)
 */
export function getItemEffectJa(input: string | number): string | null {
  const entry = getItemDetails(input);
  return entry?.effectJa ?? null;
}
