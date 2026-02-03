/**
 * ============================================================
 * 特性名前解決ユーティリティ
 * ============================================================
 *
 * 日本語名・英語名を問わず、特性の詳細情報を取得します
 */

import abilityNameMap from '../data/ability-name-map.json';

export interface AbilityNameEntry {
  id: number;
  englishName: string;
  japaneseName: string;
}

/**
 * 特性名マップの型定義
 */
const nameMap = abilityNameMap as Record<string, AbilityNameEntry>;

/**
 * 入力された特性名（日本語または英語）を、
 * PokéAPIで検索可能な英語名（小文字）に変換します
 *
 * @param input ユーザー入力の特性名（日本語 or 英語）
 * @returns 検索用の英語名（小文字）、見つからない場合はnull
 *
 * @example
 * resolveAbilityName('いかく') // => 'intimidate'
 * resolveAbilityName('Levitate') // => 'levitate'
 * resolveAbilityName('26') // => '26' (IDはそのまま返す)
 * resolveAbilityName('存在しない特性') // => null
 */
export function resolveAbilityName(input: string): string | null {
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
 * 特性名からIDを取得
 *
 * @param input 特性名（日本語 or 英語）
 * @returns 特性ID、見つからない場合はnull
 *
 * @example
 * getAbilityId('いかく') // => 22
 * getAbilityId('levitate') // => 26
 */
export function getAbilityId(input: string): number | null {
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
 * 特性名から日本語名を取得
 *
 * @param input 特性名（日本語 or 英語）またはID
 * @returns 日本語名、見つからない場合はnull
 *
 * @example
 * getAbilityJapaneseName('intimidate') // => 'いかく'
 * getAbilityJapaneseName('22') // => 'いかく'
 */
export function getAbilityJapaneseName(input: string | number): string | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry ? entry.japaneseName : null;
}

/**
 * 特性名から英語名を取得
 *
 * @param input 特性名（日本語 or 英語）またはID
 * @returns 英語名（小文字）、見つからない場合はnull
 *
 * @example
 * getAbilityEnglishName('いかく') // => 'intimidate'
 * getAbilityEnglishName('22') // => 'intimidate'
 */
export function getAbilityEnglishName(input: string | number): string | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry ? entry.englishName : null;
}

/**
 * 特性名から完全な情報を取得
 *
 * @param input 特性名（日本語 or 英語）またはID
 * @returns 特性の詳細情報、見つからない場合はnull
 *
 * @example
 * getAbilityDetails('いかく')
 * // => { id: 22, englishName: 'intimidate', japaneseName: 'いかく' }
 */
export function getAbilityDetails(input: string | number): AbilityNameEntry | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry || null;
}
