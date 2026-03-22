import type {
  PokemonSpeciesData,
  MoveData,
  AbilityData,
  ItemData,
  PokemonType,
} from '@poke-dex-battle/shared';

// ---------------------------------------------------------------------------
// API レスポンス行型（DBスキーマのJSON表現）
// ---------------------------------------------------------------------------

/** /api/pokemon が返す行 */
export interface PokemonRow {
  id: string;
  num: number;
  name: string;
  nameJa: string;
  types: string[];
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  ability0: string;
  ability1: string | null;
  abilityH: string | null;
  ability0Ja?: string | null;
  ability1Ja?: string | null;
  abilityHJa?: string | null;
  weightkg: number;
  heightm: number;
  category: string;
  spriteUrl: string | null;
  fixedItem: string | null;
  fixedTeraType: string | null;
  genderRate?: number | null;
}

/** /api/moves が返す行 */
export interface MoveRow {
  id: string;
  num: number;
  name: string;
  nameJa: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  target: string;
  shortDesc: string | null;
}

/** /api/abilities が返す行 */
export interface AbilityRow {
  id: string;
  num: number;
  name: string;
  nameJa: string;
  shortDesc: string | null;
}

/** /api/items が返す行 */
export interface ItemRow {
  id: string;
  num: number;
  name: string;
  nameJa: string;
  shortDesc: string | null;
  isCompetitive: boolean;
}

// ---------------------------------------------------------------------------
// 固定アイテムの日本語名マッピング（itemsテーブルに無い特殊アイテム含む）
// ---------------------------------------------------------------------------

const FIXED_ITEM_NAME_JA: Record<string, string> = {
  'wellspring-mask': 'いどのめん',
  'hearthflame-mask': 'かまどのめん',
  'cornerstone-mask': 'いしずえのめん',
  'rusted-sword': 'くちたけん',
  'rusted-shield': 'くちたたて',
  'griseous-orb': 'はっきんだま',
};

// ---------------------------------------------------------------------------
// 変換関数
// ---------------------------------------------------------------------------

/**
 * API（DB）のポケモン行を PokemonSpeciesData 型に変換
 */
export function toSpeciesData(row: PokemonRow | null | undefined): PokemonSpeciesData | null {
  if (!row) return null;
  const abilities: PokemonSpeciesData['abilities'] = [];
  if (row.ability0)
    abilities.push({ name: row.ability0, nameJa: row.ability0Ja ?? row.ability0, isHidden: false });
  if (row.ability1)
    abilities.push({ name: row.ability1, nameJa: row.ability1Ja ?? row.ability1, isHidden: false });
  if (row.abilityH)
    abilities.push({ name: row.abilityH, nameJa: row.abilityHJa ?? row.abilityH, isHidden: true });

  return {
    id: row.num,
    name: row.id,
    nameJa: row.nameJa,
    types: row.types as PokemonType[],
    baseStats: {
      hp: row.hp,
      attack: row.atk,
      defense: row.def,
      specialAttack: row.spa,
      specialDefense: row.spd,
      speed: row.spe,
    },
    abilities,
    spriteUrl: row.spriteUrl ?? undefined,
    height: row.heightm,
    weight: row.weightkg,
    category: row.category,
    fixedItem: row.fixedItem ?? null,
    fixedItemNameJa: row.fixedItem ? (FIXED_ITEM_NAME_JA[row.fixedItem] ?? row.fixedItem) : null,
    fixedTeraType: row.fixedTeraType ?? null,
    genderRate: row.genderRate ?? null,
  };
}

/**
 * API（DB）の技行を MoveData 型に変換
 */
export function toMoveData(row: MoveRow | null | undefined): MoveData | null {
  if (!row) return null;
  return {
    id: row.num,
    name: row.name,
    nameJa: row.nameJa,
    type: row.type as PokemonType,
    category: row.category as MoveData['category'],
    power: row.power ?? null,
    accuracy: row.accuracy ?? null,
    pp: row.pp,
    priority: row.priority,
    target: row.target,
    shortDesc: row.shortDesc ?? undefined,
  };
}

/**
 * API（DB）の特性行を AbilityData 型に変換
 */
export function toAbilityData(row: AbilityRow | null | undefined): AbilityData | null {
  if (!row) return null;
  return {
    id: row.num,
    name: row.name,
    nameJa: row.nameJa,
    shortDesc: row.shortDesc ?? undefined,
  };
}

/**
 * API（DB）のアイテム行を ItemData 型に変換
 */
export function toItemData(row: ItemRow | null | undefined): ItemData | null {
  if (!row) return null;
  return {
    id: row.num,
    name: row.name,
    nameJa: row.nameJa,
    shortDesc: row.shortDesc ?? undefined,
  };
}
