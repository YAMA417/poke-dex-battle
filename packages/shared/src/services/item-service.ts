import type { ItemData, ShowdownItem } from "../types";

const itemsById: Record<string, ShowdownItem> =
  require("../data/showdown/items.json");

// ルックアップ用 Map を構築
const itemsByName = new Map<string, ShowdownItem>();
const itemsByJaName = new Map<string, ShowdownItem>();

for (const item of Object.values(itemsById)) {
  itemsByName.set(item.name.toLowerCase(), item);
  itemsByJaName.set(item.nameJa, item);
}

/**
 * ShowdownItem → ItemData に変換
 */
function transformToItemData(item: ShowdownItem): ItemData {
  return {
    id: item.num,
    name: item.name,
    nameJa: item.nameJa,
    shortDesc: item.shortDesc || undefined,
    desc: item.desc || undefined,
  };
}

/**
 * アイテム名またはIDからアイテムを検索
 */
function findItem(query: string): ShowdownItem | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // ID（Showdown形式）で検索
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  const byId = itemsById[normalized];
  if (byId) return byId;

  // 英語名で検索
  const byName = itemsByName.get(trimmed.toLowerCase());
  if (byName) return byName;

  // 日本語名で検索
  const byJa = itemsByJaName.get(trimmed);
  if (byJa) return byJa;

  return null;
}

/**
 * アイテム名またはIDからアイテムデータを取得
 */
export function getItemByName(name: string): ItemData | null {
  const item = findItem(name);
  if (!item) return null;
  return transformToItemData(item);
}

/**
 * 全アイテムデータを取得
 */
export function getAllItems(): ReadonlyArray<ShowdownItem> {
  return Object.values(itemsById);
}

/**
 * 全アイテムの名前一覧を取得
 */
export function getAllItemNames(): Array<{
  id: string;
  name: string;
  nameJa: string;
}> {
  return Object.values(itemsById).map((item) => ({
    id: item.id,
    name: item.name,
    nameJa: item.nameJa,
  }));
}
