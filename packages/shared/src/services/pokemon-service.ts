import type { PokemonSpeciesData, ShowdownSpecies } from '../types';
import { getAbilityJapaneseName } from '../utils/ability-name-resolver';

const speciesById: Record<string, ShowdownSpecies> = require('../data/showdown/species.json');

// ルックアップ用 Map を構築
const speciesByName = new Map<string, ShowdownSpecies>();
const speciesByJaName = new Map<string, ShowdownSpecies>();

for (const species of Object.values(speciesById)) {
  speciesByName.set(species.name.toLowerCase(), species);
  speciesByJaName.set(species.nameJa, species);
}

/**
 * ShowdownSpecies → PokemonSpeciesData に変換
 */
function transformToPokemonSpeciesData(species: ShowdownSpecies): PokemonSpeciesData {
  const abilities = Object.entries(species.abilities).map(([key, name]) => {
    const jaName = getAbilityJapaneseName(name as string);
    return {
      name: name as string,
      nameJa: jaName ?? (name as string),
      isHidden: key === 'H',
    };
  });

  return {
    id: species.num,
    name: species.name,
    nameJa: species.nameJa,
    types: species.types,
    baseStats: {
      hp: species.baseStats.hp,
      attack: species.baseStats.atk,
      defense: species.baseStats.def,
      specialAttack: species.baseStats.spa,
      specialDefense: species.baseStats.spd,
      speed: species.baseStats.spe,
    },
    abilities,
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species.num}.png`,
    height: species.heightm,
    weight: species.weightkg,
  };
}

/**
 * ポケモン名またはIDからspeciesを検索
 */
function findSpecies(query: string): ShowdownSpecies | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // ID（Showdown形式）で検索
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byId = speciesById[normalized];
  if (byId) return byId;

  // 英語名で検索
  const byName = speciesByName.get(trimmed.toLowerCase());
  if (byName) return byName;

  // 日本語名で検索
  const byJa = speciesByJaName.get(trimmed);
  if (byJa) return byJa;

  return null;
}

/**
 * ポケモン名またはIDからポケモンデータを取得
 */
export function getPokemonByName(name: string): PokemonSpeciesData | null {
  const species = findSpecies(name);
  if (!species) return null;
  return transformToPokemonSpeciesData(species);
}

/**
 * ポケモン名を部分一致で検索
 */
export function searchPokemon(query: string): PokemonSpeciesData[] {
  const normalizedQuery = query.toLowerCase();

  return Object.values(speciesById)
    .filter((species) => {
      const nameMatch = species.name.toLowerCase().includes(normalizedQuery);
      const jaNameMatch = species.nameJa.includes(normalizedQuery);
      const idMatch = species.id.includes(normalizedQuery);
      return nameMatch || jaNameMatch || idMatch;
    })
    .map(transformToPokemonSpeciesData);
}

/**
 * 全ポケモンデータを取得
 */
export function getAllPokemon(): ReadonlyArray<ShowdownSpecies> {
  return Object.values(speciesById);
}

/**
 * 全ポケモンの名前一覧を取得
 */
export function getAllPokemonNames(): Array<{
  id: string;
  name: string;
  nameJa: string;
}> {
  return Object.values(speciesById).map((species) => ({
    id: species.id,
    name: species.name,
    nameJa: species.nameJa,
  }));
}
