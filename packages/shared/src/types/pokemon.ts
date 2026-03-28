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
  ivs: Stats;
  evs: Stats;
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
