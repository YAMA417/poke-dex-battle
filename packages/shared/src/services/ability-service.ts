import type { AbilityData, ShowdownAbility } from "../types";

const abilitiesById: Record<string, ShowdownAbility> =
  require("../data/showdown/abilities.json");

// ルックアップ用 Map を構築
const abilitiesByName = new Map<string, ShowdownAbility>();
const abilitiesByJaName = new Map<string, ShowdownAbility>();

for (const ability of Object.values(abilitiesById)) {
  abilitiesByName.set(ability.name.toLowerCase(), ability);
  abilitiesByJaName.set(ability.nameJa, ability);
}

/**
 * ShowdownAbility → AbilityData に変換
 */
function transformToAbilityData(ability: ShowdownAbility): AbilityData {
  return {
    id: ability.num,
    name: ability.name,
    nameJa: ability.nameJa,
    shortDesc: ability.shortDesc || undefined,
  };
}

/**
 * 特性名またはIDから特性を検索
 */
function findAbility(query: string): ShowdownAbility | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // ID（Showdown形式）で検索
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  const byId = abilitiesById[normalized];
  if (byId) return byId;

  // 英語名で検索
  const byName = abilitiesByName.get(trimmed.toLowerCase());
  if (byName) return byName;

  // 日本語名で検索
  const byJa = abilitiesByJaName.get(trimmed);
  if (byJa) return byJa;

  return null;
}

/**
 * 特性名またはIDから特性データを取得
 */
export function getAbilityByName(name: string): AbilityData | null {
  const ability = findAbility(name);
  if (!ability) return null;
  return transformToAbilityData(ability);
}

/**
 * 全特性データを取得
 */
export function getAllAbilities(): ReadonlyArray<ShowdownAbility> {
  return Object.values(abilitiesById);
}

/**
 * 全特性の名前一覧を取得
 */
export function getAllAbilityNames(): Array<{
  id: string;
  name: string;
  nameJa: string;
}> {
  return Object.values(abilitiesById).map((ability) => ({
    id: ability.id,
    name: ability.name,
    nameJa: ability.nameJa,
  }));
}
