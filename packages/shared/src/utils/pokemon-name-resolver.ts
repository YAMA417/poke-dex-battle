/**
 * ============================================================
 * ポケモン名前解決ユーティリティ
 * ============================================================
 *
 * 日本語名・英語名を問わず、適切な検索キーワードに変換します
 */

import pokemonNameMap from '../data/pokemon-name-map.json';

interface PokemonNameEntry {
  id: number;
  englishName: string;
  japaneseName: string;
}

/**
 * ポケモン名マップの型定義
 */
const nameMap = pokemonNameMap as Record<string, PokemonNameEntry>;

/**
 * 入力されたポケモン名（日本語または英語）を、
 * PokéAPIで検索可能な英語名（小文字）に変換します
 *
 * @param input ユーザー入力のポケモン名（日本語 or 英語）
 * @returns 検索用の英語名（小文字）、見つからない場合はnull
 *
 * @example
 * resolvePokemonName('ガブリアス') // => 'garchomp'
 * resolvePokemonName('Pikachu') // => 'pikachu'
 * resolvePokemonName('25') // => '25' (IDはそのまま返す)
 * resolvePokemonName('存在しないポケモン') // => null
 */
export function resolvePokemonName(input: string): string | null {
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
 * ポケモン名からIDを取得
 *
 * @param input ポケモン名（日本語 or 英語）
 * @returns ポケモンID、見つからない場合はnull
 *
 * @example
 * getPokemonId('ピカチュウ') // => 25
 * getPokemonId('garchomp') // => 445
 */
export function getPokemonId(input: string): number | null {
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
 * ポケモン名から日本語名を取得
 *
 * @param input ポケモン名（日本語 or 英語）またはID
 * @returns 日本語名、見つからない場合はnull
 *
 * @example
 * getJapaneseName('garchomp') // => 'ガブリアス'
 * getJapaneseName('445') // => 'ガブリアス'
 */
export function getJapaneseName(input: string | number): string | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry ? entry.japaneseName : null;
}

/**
 * ポケモン名から英語名を取得
 *
 * @param input ポケモン名（日本語 or 英語）またはID
 * @returns 英語名（小文字）、見つからない場合はnull
 *
 * @example
 * getEnglishName('ガブリアス') // => 'garchomp'
 * getEnglishName('445') // => 'garchomp'
 */
export function getEnglishName(input: string | number): string | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry ? entry.englishName : null;
}
