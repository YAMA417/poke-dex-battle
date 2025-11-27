import type {
  AbilityData,
  ItemData,
  MoveData,
  PokeApiAbilityResponse,
  PokeApiItemResponse,
  PokeApiLanguage,
  PokeApiMoveResponse,
  PokeApiPokemonResponse,
  PokeApiSpeciesResponse,
  PokeApiTypeResponse,
  PokemonSpeciesData,
  TypeEffectiveness,
} from "../types/pokeapi";
import type { PokemonType, Stats } from "../types/pokemon";

// ================================================================================
// ヘルパー関数
// ================================================================================

/**
 * 多言語名配列から指定言語の名前を取得
 * @param names 名前配列
 * @param language 言語コード
 * @returns 指定言語の名前（見つからない場合は最初の名前）
 */
function getLocalizedName(
  names: Array<{ name: string; language: { name: string } }>,
  language: PokeApiLanguage = "ja"
): string {
  const localized = names.find((n) => n.language.name === language);
  return localized?.name || names[0]?.name || "";
}

/**
 * 多言語効果文配列から指定言語の効果文を取得
 * @param effects 効果文配列
 * @param language 言語コード
 * @returns 指定言語の効果文
 */
function getLocalizedEffect(
  effects: Array<{
    effect: string;
    short_effect: string;
    language: { name: string };
  }>,
  language: PokeApiLanguage = "ja"
): string | undefined {
  const localized = effects.find((e) => e.language.name === language);
  return localized?.short_effect || localized?.effect;
}

/**
 * PokéAPIのタイプ名をアプリのPokemonType型に変換
 * @param typeName PokéAPIのタイプ名
 * @returns PokemonType
 */
function mapTypeName(typeName: string): PokemonType {
  const typeMap: Record<string, PokemonType> = {
    normal: "Normal",
    fire: "Fire",
    water: "Water",
    electric: "Electric",
    grass: "Grass",
    ice: "Ice",
    fighting: "Fighting",
    poison: "Poison",
    ground: "Ground",
    flying: "Flying",
    psychic: "Psychic",
    bug: "Bug",
    rock: "Rock",
    ghost: "Ghost",
    dragon: "Dragon",
    dark: "Dark",
    steel: "Steel",
    fairy: "Fairy",
  };
  return typeMap[typeName.toLowerCase()] || "Normal";
}

// ================================================================================
// 変換関数
// ================================================================================

/**
 * PokéAPIのポケモンデータを正規化
 * @param pokemon ポケモンレスポンス
 * @param species 種族情報レスポンス
 * @returns 正規化されたポケモン種族データ
 */
export function transformPokemonData(
  pokemon: PokeApiPokemonResponse,
  species: PokeApiSpeciesResponse
): PokemonSpeciesData {
  // タイプを変換
  const types = pokemon.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => mapTypeName(t.type.name));

  // 種族値を変換
  const baseStats: Stats = {
    hp: pokemon.stats.find((s) => s.stat.name === "hp")?.base_stat || 0,
    attack: pokemon.stats.find((s) => s.stat.name === "attack")?.base_stat || 0,
    defense:
      pokemon.stats.find((s) => s.stat.name === "defense")?.base_stat || 0,
    specialAttack:
      pokemon.stats.find((s) => s.stat.name === "special-attack")?.base_stat ||
      0,
    specialDefense:
      pokemon.stats.find((s) => s.stat.name === "special-defense")?.base_stat ||
      0,
    speed: pokemon.stats.find((s) => s.stat.name === "speed")?.base_stat || 0,
  };

  // 特性を変換
  const abilities = pokemon.abilities.map((a) => ({
    name: a.ability.name,
    nameJa: "", // 後で特性データから取得
    isHidden: a.is_hidden,
  }));

  // 日本語名を取得
  const nameJa = getLocalizedName(species.names, "ja");
  const genus = species.genera.find((g) => g.language.name === "ja")?.genus;

  return {
    id: pokemon.id,
    name: pokemon.name,
    nameJa,
    genus,
    types,
    baseStats,
    abilities,
    spriteUrl: pokemon.sprites.front_default || undefined,
    officialArtworkUrl:
      pokemon.sprites.other?.["official-artwork"]?.front_default || undefined,
    height: pokemon.height,
    weight: pokemon.weight,
  };
}

/**
 * PokéAPIの技データを正規化
 * @param move 技レスポンス
 * @returns 正規化された技データ
 */
export function transformMoveData(move: PokeApiMoveResponse): MoveData {
  // カテゴリを変換
  const categoryMap: Record<string, "Physical" | "Special" | "Status"> = {
    physical: "Physical",
    special: "Special",
    status: "Status",
  };
  const category = categoryMap[move.damage_class.name] || "Status";

  return {
    id: move.id,
    name: move.name,
    nameJa: getLocalizedName(move.names, "ja"),
    type: mapTypeName(move.type.name),
    category,
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    priority: move.priority,
    target: move.target.name,
    effect: getLocalizedEffect(move.effect_entries, "en"),
    effectJa: getLocalizedEffect(move.effect_entries, "ja"),
  };
}

/**
 * PokéAPIの特性データを正規化
 * @param ability 特性レスポンス
 * @returns 正規化された特性データ
 */
export function transformAbilityData(
  ability: PokeApiAbilityResponse
): AbilityData {
  return {
    id: ability.id,
    name: ability.name,
    nameJa: getLocalizedName(ability.names, "ja"),
    effect: getLocalizedEffect(ability.effect_entries, "en"),
    effectJa: getLocalizedEffect(ability.effect_entries, "ja"),
  };
}

/**
 * PokéAPIのアイテムデータを正規化
 * @param item アイテムレスポンス
 * @returns 正規化されたアイテムデータ
 */
export function transformItemData(item: PokeApiItemResponse): ItemData {
  return {
    id: item.id,
    name: item.name,
    nameJa: getLocalizedName(item.names, "ja"),
    cost: item.cost,
    effect: getLocalizedEffect(item.effect_entries, "en"),
    effectJa: getLocalizedEffect(item.effect_entries, "ja"),
    spriteUrl: item.sprites.default || undefined,
  };
}

/**
 * PokéAPIのタイプ相性データを正規化
 * @param typeResponse タイプレスポンス
 * @returns 正規化されたタイプ相性データ
 */
export function transformTypeEffectiveness(
  typeResponse: PokeApiTypeResponse
): TypeEffectiveness {
  const { damage_relations } = typeResponse;

  return {
    type: mapTypeName(typeResponse.name),
    doubleDamageTo: damage_relations.double_damage_to.map((t) =>
      mapTypeName(t.name)
    ),
    halfDamageTo: damage_relations.half_damage_to.map((t) =>
      mapTypeName(t.name)
    ),
    noDamageTo: damage_relations.no_damage_to.map((t) => mapTypeName(t.name)),
    doubleDamageFrom: damage_relations.double_damage_from.map((t) =>
      mapTypeName(t.name)
    ),
    halfDamageFrom: damage_relations.half_damage_from.map((t) =>
      mapTypeName(t.name)
    ),
    noDamageFrom: damage_relations.no_damage_from.map((t) =>
      mapTypeName(t.name)
    ),
  };
}
