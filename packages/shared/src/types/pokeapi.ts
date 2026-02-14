import type { PokemonType, Stats } from "./pokemon";

// ================================================================================
// PokéAPI レスポンス型（生データ）
// ================================================================================

/** PokéAPIのポケモンレスポンス */
export interface PokeApiPokemonResponse {
  id: number;
  name: string;
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
  abilities: Array<{
    is_hidden: boolean;
    slot: number;
    ability: {
      name: string;
      url: string;
    };
  }>;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
      };
    };
  };
  species: {
    name: string;
    url: string;
  };
  height: number;
  weight: number;
}

/** PokéAPIの技レスポンス */
export interface PokeApiMoveResponse {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number;
  priority: number;
  type: {
    name: string;
    url: string;
  };
  damage_class: {
    name: "physical" | "special" | "status";
    url: string;
  };
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: {
      name: string;
      url: string;
    };
  }>;
  names: Array<{
    name: string;
    language: {
      name: string;
      url: string;
    };
  }>;
  target: {
    name: string;
    url: string;
  };
}

/** PokéAPIの特性レスポンス */
export interface PokeApiAbilityResponse {
  id: number;
  name: string;
  is_main_series: boolean;
  names: Array<{
    name: string;
    language: {
      name: string;
      url: string;
    };
  }>;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: {
      name: string;
      url: string;
    };
  }>;
}

/** PokéAPIのアイテムレスポンス */
export interface PokeApiItemResponse {
  id: number;
  name: string;
  cost: number;
  category: {
    name: string;
    url: string;
  };
  names: Array<{
    name: string;
    language: {
      name: string;
      url: string;
    };
  }>;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: {
      name: string;
      url: string;
    };
  }>;
  sprites: {
    default: string | null;
  };
}

/** PokéAPIの種族情報レスポンス */
export interface PokeApiSpeciesResponse {
  id: number;
  name: string;
  names: Array<{
    name: string;
    language: {
      name: string;
      url: string;
    };
  }>;
  genera: Array<{
    genus: string;
    language: {
      name: string;
      url: string;
    };
  }>;
}

/** PokéAPIのタイプレスポンス */
export interface PokeApiTypeResponse {
  id: number;
  name: string;
  damage_relations: {
    double_damage_from: Array<{ name: string; url: string }>;
    double_damage_to: Array<{ name: string; url: string }>;
    half_damage_from: Array<{ name: string; url: string }>;
    half_damage_to: Array<{ name: string; url: string }>;
    no_damage_from: Array<{ name: string; url: string }>;
    no_damage_to: Array<{ name: string; url: string }>;
  };
}

// ================================================================================
// アプリ用の正規化された型
// ================================================================================

/** ポケモン種族データ（正規化） */
export interface PokemonSpeciesData {
  id: number;
  name: string;
  nameJa: string;
  genus?: string; // 分類（例: でんきねずみポケモン）
  types: PokemonType[];
  baseStats: Stats;
  abilities: Array<{
    name: string;
    nameJa: string;
    isHidden: boolean;
  }>;
  spriteUrl?: string;
  officialArtworkUrl?: string;
  height: number; // デシメートル
  weight: number; // ヘクトグラム
}

/** 技データ（正規化） */
export interface MoveData {
  id: number;
  name: string;
  nameJa: string;
  type: PokemonType;
  category: "Physical" | "Special" | "Status";
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  target: string;
  effect?: string;
  effectJa?: string;
}

/** 特性データ（正規化） */
export interface AbilityData {
  id: number;
  name: string;
  nameJa: string;
  effect?: string;
  effectJa?: string;
}

/** アイテムデータ（正規化） */
export interface ItemData {
  id: number;
  name: string;
  nameJa: string;
  cost: number;
  effect?: string;
  effectJa?: string;
  spriteUrl?: string;
}

/** タイプ相性データ */
export interface TypeEffectiveness {
  type: PokemonType;
  doubleDamageTo: PokemonType[];
  halfDamageTo: PokemonType[];
  noDamageTo: PokemonType[];
  doubleDamageFrom: PokemonType[];
  halfDamageFrom: PokemonType[];
  noDamageFrom: PokemonType[];
}

// ================================================================================
// キャッシュ用の型
// ================================================================================

/** キャッシュエントリ（共通） */
export interface CacheEntry<T> {
  data: T;
  cachedAt: number; // タイムスタンプ
  expiresAt: number; // 有効期限のタイムスタンプ
}

/** キャッシュされたポケモンデータ */
export interface CachedPokemon extends CacheEntry<PokemonSpeciesData> {
  id: number; // プライマリキー
}

/** キャッシュされた技データ */
export interface CachedMove extends CacheEntry<MoveData> {
  id: number; // プライマリキー
}

/** キャッシュされた特性データ */
export interface CachedAbility extends CacheEntry<AbilityData> {
  id: number; // プライマリキー
}

/** キャッシュされたアイテムデータ */
export interface CachedItem extends CacheEntry<ItemData> {
  id: number; // プライマリキー
}

/** キャッシュされたタイプ相性データ */
export interface CachedTypeEffectiveness extends CacheEntry<TypeEffectiveness> {
  type: PokemonType; // プライマリキー
}

// ================================================================================
// ユーティリティ型
// ================================================================================

/** PokéAPI言語コード */
export type PokeApiLanguage = "ja" | "en" | "ja-Hrkt";

/** キャッシュ設定 */
export interface CacheConfig {
  /** キャッシュ有効期限（ミリ秒） デフォルト: 7日間 */
  ttl?: number;
  /** キャッシュを強制的にリフレッシュするか */
  forceRefresh?: boolean;
}
