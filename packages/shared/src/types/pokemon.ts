/** ポケモンのタイプ */
export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Electric'
  | 'Grass'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy';

/** テラスタイプ（ステラを含む） */
export type TeraType = PokemonType | 'Stellar';

/** PokemonType の全値セット（型ガード用） */
const POKEMON_TYPE_SET: ReadonlySet<string> = new Set<string>([
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
]);

/** 文字列が PokemonType か判定する型ガード */
export function isPokemonType(value: string): value is PokemonType {
  return POKEMON_TYPE_SET.has(value);
}

/** 文字列が TeraType か判定する型ガード */
export function isTeraType(value: string): value is TeraType {
  return value === 'Stellar' || POKEMON_TYPE_SET.has(value);
}

/** 性格 */
export type Nature =
  | 'Hardy'
  | 'Lonely'
  | 'Brave'
  | 'Adamant'
  | 'Naughty'
  | 'Bold'
  | 'Docile'
  | 'Relaxed'
  | 'Impish'
  | 'Lax'
  | 'Timid'
  | 'Hasty'
  | 'Serious'
  | 'Jolly'
  | 'Naive'
  | 'Modest'
  | 'Mild'
  | 'Quiet'
  | 'Bashful'
  | 'Rash'
  | 'Calm'
  | 'Gentle'
  | 'Sassy'
  | 'Careful'
  | 'Quirky';

/** ステータス */
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

/** 技のカテゴリ */
export type MoveCategory = 'Physical' | 'Special' | 'Status';

/** 技 */
export interface Move {
  id: number;
  name: string;
  nameJa?: string;
  type: PokemonType;
  category: MoveCategory;
  power?: number;
  accuracy?: number;
  pp: number;
}

/** ポケモン */
export interface Pokemon {
  id: string;
  speciesId: number;
  speciesName: string;
  nickname?: string;
  level: number;
  gender?: 'male' | 'female' | 'unknown';
  nature: Nature;
  ability: string;
  teraType: PokemonType;
  item?: string;
  abilityPoints: Stats;
  moves: Move[];
  memo?: string;
  actualStats?: Stats;
  spriteUrl?: string;
}

/** 種族値（PokéAPIから取得） */
export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}
