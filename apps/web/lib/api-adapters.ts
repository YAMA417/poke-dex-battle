import type { PokemonSpeciesData, MoveData, AbilityData, ItemData } from '@poke-dex-battle/shared';

/**
 * API（DB）のポケモン行を PokemonSpeciesData 型に変換
 */
export function toSpeciesData(row: any): PokemonSpeciesData | null {
  if (!row) return null;
  const abilities: PokemonSpeciesData['abilities'] = [];
  if (row.ability0) abilities.push({ name: row.ability0, nameJa: row.ability0, isHidden: false });
  if (row.ability1) abilities.push({ name: row.ability1, nameJa: row.ability1, isHidden: false });
  if (row.abilityH) abilities.push({ name: row.abilityH, nameJa: row.abilityH, isHidden: true });

  return {
    id: row.num,
    name: row.id,
    nameJa: row.nameJa,
    types: row.types,
    baseStats: {
      hp: row.hp,
      attack: row.atk,
      defense: row.def,
      specialAttack: row.spa,
      specialDefense: row.spd,
      speed: row.spe,
    },
    abilities,
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${row.num}.png`,
    height: row.heightm,
    weight: row.weightkg,
  };
}

/**
 * API（DB）の技行を MoveData 型に変換
 */
export function toMoveData(row: any): MoveData | null {
  if (!row) return null;
  return {
    id: row.num,
    name: row.name,
    nameJa: row.nameJa,
    type: row.type,
    category: row.category,
    power: row.basePower || null,
    accuracy: row.accuracy ?? null,
    pp: row.pp,
    priority: row.priority,
    target: row.target,
    shortDesc: row.shortDesc,
  };
}

/**
 * API（DB）の特性行を AbilityData 型に変換
 */
export function toAbilityData(row: any): AbilityData | null {
  if (!row) return null;
  return {
    id: row.num,
    name: row.name,
    nameJa: row.nameJa,
    shortDesc: row.shortDesc,
  };
}

/**
 * API（DB）のアイテム行を ItemData 型に変換
 */
export function toItemData(row: any): ItemData | null {
  if (!row) return null;
  return {
    id: row.num,
    name: row.name,
    nameJa: row.nameJa,
    shortDesc: row.shortDesc,
    desc: row.desc,
  };
}
