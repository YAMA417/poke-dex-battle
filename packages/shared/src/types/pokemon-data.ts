import type { PokemonType, Stats } from './pokemon';

/**
 * アプリケーション内で使用されるポケモン種族データ（正規化）
 */
export interface PokemonSpeciesData {
  id: number;
  name: string;
  nameJa: string;
  types: PokemonType[];
  baseStats: Stats;
  abilities: Array<{
    name: string;
    nameJa: string;
    isHidden: boolean;
  }>;
  spriteUrl?: string;
  height: number;
  weight: number;
  category?: string;
  fixedItem?: string | null;
  fixedItemNameJa?: string | null;
  fixedTeraType?: string | null;
  genderRate?: number | null;
}

/**
 * アプリケーション内で使用される技データ（正規化）
 */
export interface MoveData {
  id: number;
  name: string;
  nameJa: string;
  type: PokemonType;
  category: 'Physical' | 'Special' | 'Status';
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  target: string;
  shortDesc?: string;
}

/**
 * アプリケーション内で使用される特性データ（正規化）
 */
export interface AbilityData {
  id: number;
  name: string;
  nameJa: string;
  shortDesc?: string;
}

/**
 * アプリケーション内で使用されるアイテムデータ（正規化）
 */
export interface ItemData {
  id: number;
  name: string;
  nameJa: string;
  shortDesc?: string;
  desc?: string;
}

/**
 * タイプ相性データ
 */
export interface TypeEffectiveness {
  type: PokemonType;
  doubleDamageTo: PokemonType[];
  halfDamageTo: PokemonType[];
  noDamageTo: PokemonType[];
  doubleDamageFrom: PokemonType[];
  halfDamageFrom: PokemonType[];
  noDamageFrom: PokemonType[];
}
