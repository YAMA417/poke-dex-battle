import type { PokemonType } from '../types/pokemon';

/** 全タイプのリスト */
export const POKEMON_TYPES: PokemonType[] = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
];

/** タイプのラベル付きオプション（UI用） */
export const POKEMON_TYPE_OPTIONS: { value: PokemonType; label: string }[] = [
  { value: "Normal", label: "ノーマル" },
  { value: "Fire", label: "ほのお" },
  { value: "Water", label: "みず" },
  { value: "Electric", label: "でんき" },
  { value: "Grass", label: "くさ" },
  { value: "Ice", label: "こおり" },
  { value: "Fighting", label: "かくとう" },
  { value: "Poison", label: "どく" },
  { value: "Ground", label: "じめん" },
  { value: "Flying", label: "ひこう" },
  { value: "Psychic", label: "エスパー" },
  { value: "Bug", label: "むし" },
  { value: "Rock", label: "いわ" },
  { value: "Ghost", label: "ゴースト" },
  { value: "Dragon", label: "ドラゴン" },
  { value: "Dark", label: "あく" },
  { value: "Steel", label: "はがね" },
  { value: "Fairy", label: "フェアリー" },
];

/** タイプ相性表（攻撃側 → 防御側 → 倍率） */
export const TYPE_EFFECTIVENESS: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

/**
 * タイプ相性の倍率を取得
 */
export function getTypeEffectiveness(attackType: PokemonType, defenseType: PokemonType): number {
  return TYPE_EFFECTIVENESS[attackType][defenseType] ?? 1;
}

/**
 * 複合タイプに対する相性倍率を計算
 */
export function calcTypeEffectiveness(attackType: PokemonType, defenseTypes: PokemonType[]): number {
  return defenseTypes.reduce((acc, defType) => acc * getTypeEffectiveness(attackType, defType), 1);
}
