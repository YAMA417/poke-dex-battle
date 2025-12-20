/**
 * ============================================================
 * 技名前解決ユーティリティ
 * ============================================================
 *
 * 日本語名・英語名を問わず、技の詳細情報を取得します
 */

import moveNameMap from '../data/move-name-map.json';

export interface MoveNameEntry {
  id: number;
  englishName: string;
  japaneseName: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}

/**
 * 技名マップの型定義
 */
const nameMap = moveNameMap as Record<string, MoveNameEntry>;

/**
 * 入力された技名（日本語または英語）を、
 * PokéAPIで検索可能な英語名（小文字）に変換します
 *
 * @param input ユーザー入力の技名（日本語 or 英語）
 * @returns 検索用の英語名（小文字）、見つからない場合はnull
 *
 * @example
 * resolveMoveName('１０まんボルト') // => 'thunderbolt'
 * resolveMoveName('Flamethrower') // => 'flamethrower'
 * resolveMoveName('85') // => '85' (IDはそのまま返す)
 * resolveMoveName('存在しない技') // => null
 */
export function resolveMoveName(input: string): string | null {
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
 * 技名からIDを取得
 *
 * @param input 技名（日本語 or 英語）
 * @returns 技ID、見つからない場合はnull
 *
 * @example
 * getMoveId('１０まんボルト') // => 85
 * getMoveId('flamethrower') // => 53
 */
export function getMoveId(input: string): number | null {
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
 * 技名から日本語名を取得
 *
 * @param input 技名（日本語 or 英語）またはID
 * @returns 日本語名、見つからない場合はnull
 *
 * @example
 * getMoveJapaneseName('thunderbolt') // => '１０まんボルト'
 * getMoveJapaneseName('85') // => '１０まんボルト'
 */
export function getMoveJapaneseName(input: string | number): string | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry ? entry.japaneseName : null;
}

/**
 * 技名から英語名を取得
 *
 * @param input 技名（日本語 or 英語）またはID
 * @returns 英語名（小文字）、見つからない場合はnull
 *
 * @example
 * getMoveEnglishName('１０まんボルト') // => 'thunderbolt'
 * getMoveEnglishName('85') // => 'thunderbolt'
 */
export function getMoveEnglishName(input: string | number): string | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry ? entry.englishName : null;
}

/**
 * 技名から完全な情報を取得
 *
 * @param input 技名（日本語 or 英語）またはID
 * @returns 技の詳細情報、見つからない場合はnull
 *
 * @example
 * getMoveDetails('１０まんボルト')
 * // => { id: 85, englishName: 'thunderbolt', japaneseName: '１０まんボルト',
 * //      type: 'Electric', category: 'Special', power: 90, accuracy: 100, pp: 15 }
 */
export function getMoveDetails(input: string | number): MoveNameEntry | null {
  const searchKey = typeof input === 'number' ? String(input) : input.trim();

  if (!searchKey) {
    return null;
  }

  const entry = nameMap[searchKey] || nameMap[searchKey.toLowerCase()];
  return entry || null;
}

/**
 * 技の威力を取得
 *
 * @param input 技名（日本語 or 英語）またはID
 * @returns 技の威力、見つからない場合や威力がない技の場合はnull
 *
 * @example
 * getMovePower('１０まんボルト') // => 90
 * getMovePower('でんじは') // => null (変化技)
 */
export function getMovePower(input: string | number): number | null {
  const entry = getMoveDetails(input);
  return entry?.power ?? null;
}

/**
 * 技のタイプを取得
 *
 * @param input 技名（日本語 or 英語）またはID
 * @returns 技のタイプ、見つからない場合はnull
 *
 * @example
 * getMoveType('１０まんボルト') // => 'Electric'
 * getMoveType('かえんほうしゃ') // => 'Fire'
 */
export function getMoveType(input: string | number): string | null {
  const entry = getMoveDetails(input);
  return entry?.type ?? null;
}

/**
 * 技のカテゴリを取得
 *
 * @param input 技名（日本語 or 英語）またはID
 * @returns 技のカテゴリ（Physical/Special/Status）、見つからない場合はnull
 *
 * @example
 * getMoveCategory('１０まんボルト') // => 'Special'
 * getMoveCategory('じしん') // => 'Physical'
 */
export function getMoveCategory(input: string | number): string | null {
  const entry = getMoveDetails(input);
  return entry?.category ?? null;
}
