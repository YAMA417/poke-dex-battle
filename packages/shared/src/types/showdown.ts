import type { PokemonType } from "./pokemon";

/**
 * Showdown 形式の種族値（省略キー）
 */
export interface ShowdownBaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

/**
 * Pokemon Showdown Dex から抽出されたスペシーズデータ
 */
export interface ShowdownSpecies {
  id: string;
  num: number;
  name: string;
  nameJa: string;
  types: PokemonType[];
  baseStats: ShowdownBaseStats;
  abilities: {
    0: string;
    1?: string;
    H?: string;
    S?: string;
  };
  weightkg: number;
  heightm: number;
}

/**
 * Pokemon Showdown Dex から抽出された技データ
 */
export interface ShowdownMove {
  id: string;
  num: number;
  name: string;
  nameJa: string;
  type: PokemonType;
  category: "Physical" | "Special" | "Status";
  basePower: number;
  accuracy: number | true;
  pp: number;
  priority: number;
  target: string;
  shortDesc: string;
}

/**
 * Pokemon Showdown Dex から抽出された特性データ
 */
export interface ShowdownAbility {
  id: string;
  num: number;
  name: string;
  nameJa: string;
  shortDesc: string;
}

/**
 * Pokemon Showdown Dex から抽出されたアイテムデータ
 */
export interface ShowdownItem {
  id: string;
  num: number;
  name: string;
  nameJa: string;
  desc: string;
  shortDesc: string;
}

/**
 * Showdown から抽出された全データの集約型
 */
/**
 * ポケモン別の習得技データ（レベル技・わざマシンで分類）
 */
export interface ShowdownLearnsetEntry {
  level: string[];
  machine: string[];
}

/**
 * Showdown から抽出された全データの集約型
 */
export interface ShowdownData {
  species: Record<string, ShowdownSpecies>;
  moves: Record<string, ShowdownMove>;
  abilities: Record<string, ShowdownAbility>;
  items: Record<string, ShowdownItem>;
  learnsets: Record<string, ShowdownLearnsetEntry>;
}
