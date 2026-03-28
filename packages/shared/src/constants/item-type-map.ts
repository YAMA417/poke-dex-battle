import { normalizeId } from '../utils/normalize-id';
import type { PokemonType } from '../types/pokemon';

/**
 * タイプ強化アイテム: 対応タイプの技威力を1.2倍にする持ち物のマップ
 * key: normalizeId済みの持ち物名, value: 強化対象タイプ
 */
export const TYPE_BOOSTING_ITEMS: ReadonlyMap<string, PokemonType> = new Map([
  [normalizeId('Silk Scarf'), 'Normal'],
  [normalizeId('Charcoal'), 'Fire'],
  [normalizeId('Mystic Water'), 'Water'],
  [normalizeId('Magnet'), 'Electric'],
  [normalizeId('Miracle Seed'), 'Grass'],
  [normalizeId('Never-Melt Ice'), 'Ice'],
  [normalizeId('Black Belt'), 'Fighting'],
  [normalizeId('Poison Barb'), 'Poison'],
  [normalizeId('Soft Sand'), 'Ground'],
  [normalizeId('Sharp Beak'), 'Flying'],
  [normalizeId('Twisted Spoon'), 'Psychic'],
  [normalizeId('Silver Powder'), 'Bug'],
  [normalizeId('Hard Stone'), 'Rock'],
  [normalizeId('Spell Tag'), 'Ghost'],
  [normalizeId('Dragon Fang'), 'Dragon'],
  [normalizeId('Black Glasses'), 'Dark'],
  [normalizeId('Metal Coat'), 'Steel'],
  [normalizeId('Fairy Feather'), 'Fairy'],
]);

/**
 * 半減実: 効果抜群の該当タイプダメージを0.5倍にする持ち物のマップ
 * key: normalizeId済みの持ち物名, value: 軽減対象タイプ
 */
export const TYPE_RESIST_BERRIES: ReadonlyMap<string, PokemonType> = new Map([
  [normalizeId('Occa Berry'), 'Fire'],
  [normalizeId('Passho Berry'), 'Water'],
  [normalizeId('Wacan Berry'), 'Electric'],
  [normalizeId('Rindo Berry'), 'Grass'],
  [normalizeId('Yache Berry'), 'Ice'],
  [normalizeId('Chople Berry'), 'Fighting'],
  [normalizeId('Kebia Berry'), 'Poison'],
  [normalizeId('Shuca Berry'), 'Ground'],
  [normalizeId('Coba Berry'), 'Flying'],
  [normalizeId('Payapa Berry'), 'Psychic'],
  [normalizeId('Tanga Berry'), 'Bug'],
  [normalizeId('Charti Berry'), 'Rock'],
  [normalizeId('Kasib Berry'), 'Ghost'],
  [normalizeId('Haban Berry'), 'Dragon'],
  [normalizeId('Colbur Berry'), 'Dark'],
  [normalizeId('Roseli Berry'), 'Fairy'],
  [normalizeId('Chilan Berry'), 'Normal'],
]);

/**
 * 持ち物がタイプ強化アイテムかどうか判定し、対象タイプを返す
 */
export function getTypeBoostingItemType(item: string | undefined): PokemonType | null {
  if (!item) return null;
  return TYPE_BOOSTING_ITEMS.get(normalizeId(item)) ?? null;
}

/**
 * 持ち物が半減実かどうか判定し、軽減対象タイプを返す
 */
export function getTypeResistBerryType(item: string | undefined): PokemonType | null {
  if (!item) return null;
  return TYPE_RESIST_BERRIES.get(normalizeId(item)) ?? null;
}
