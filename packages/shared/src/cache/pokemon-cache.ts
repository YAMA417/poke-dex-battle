import Dexie, { type Table } from "dexie";
import type {
  CachedAbility,
  CachedItem,
  CachedMove,
  CachedPokemon,
  CachedTypeEffectiveness,
} from "../types/pokeapi";

// ================================================================================
// Dexie データベースクラス
// ================================================================================

/**
 * PokéAPIデータキャッシュ用のIndexedDBデータベース
 */
class PokemonCacheDatabase extends Dexie {
  // テーブル定義
  pokemon!: Table<CachedPokemon, number>;
  moves!: Table<CachedMove, number>;
  abilities!: Table<CachedAbility, number>;
  items!: Table<CachedItem, number>;
  typeEffectiveness!: Table<CachedTypeEffectiveness, string>;

  constructor() {
    super("PokemonCacheDB");

    // スキーマバージョン1を定義
    this.version(1).stores({
      pokemon: "id, cachedAt, expiresAt",
      moves: "id, cachedAt, expiresAt",
      abilities: "id, cachedAt, expiresAt",
      items: "id, cachedAt, expiresAt",
      typeEffectiveness: "type, cachedAt, expiresAt",
    });
  }
}

// ================================================================================
// データベースインスタンス（シングルトン）
// ================================================================================

/**
 * グローバルデータベースインスタンス
 * アプリ全体で1つのインスタンスを共有する
 */
export const db = new PokemonCacheDatabase();

// ================================================================================
// キャッシュ設定
// ================================================================================

/**
 * デフォルトのキャッシュ有効期限（7日間）
 */
export const DEFAULT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // ミリ秒

// ================================================================================
// キャッシュヘルパー関数
// ================================================================================

/**
 * キャッシュが有効かどうかをチェック
 * @param entry キャッシュエントリ
 * @returns 有効な場合true、期限切れの場合false
 */
export function isCacheValid<T>(entry: { expiresAt: number } | null): boolean {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

/**
 * キャッシュエントリを作成
 * @param data 保存するデータ
 * @param ttl キャッシュ有効期限（ミリ秒）デフォルトは7日間
 * @returns キャッシュエントリ（データ + タイムスタンプ）
 */
export function createCacheEntry<T>(
  data: T,
  ttl: number = DEFAULT_CACHE_TTL
): Omit<{ data: T; cachedAt: number; expiresAt: number }, "id" | "type"> {
  const now = Date.now();
  return {
    data,
    cachedAt: now,
    expiresAt: now + ttl,
  };
}

/**
 * 期限切れのキャッシュを削除
 * @returns 削除された件数
 */
export async function clearExpiredCache(): Promise<number> {
  const now = Date.now();
  let totalDeleted = 0;

  // 各テーブルから期限切れのエントリを削除
  totalDeleted += await db.pokemon.where("expiresAt").below(now).delete();
  totalDeleted += await db.moves.where("expiresAt").below(now).delete();
  totalDeleted += await db.abilities.where("expiresAt").below(now).delete();
  totalDeleted += await db.items.where("expiresAt").below(now).delete();
  totalDeleted += await db.typeEffectiveness
    .where("expiresAt")
    .below(now)
    .delete();

  return totalDeleted;
}

/**
 * すべてのキャッシュを削除
 */
export async function clearAllCache(): Promise<void> {
  await db.pokemon.clear();
  await db.moves.clear();
  await db.abilities.clear();
  await db.items.clear();
  await db.typeEffectiveness.clear();
}
