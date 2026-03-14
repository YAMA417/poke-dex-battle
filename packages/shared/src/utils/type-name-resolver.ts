import { POKEMON_TYPE_OPTIONS } from '../constants/types';
import type { PokemonType } from '../types/pokemon';

const TYPE_JA_MAP = new Map<PokemonType, string>(
  POKEMON_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
);

/**
 * タイプの表示名を取得
 *
 * @param type - PokemonType（英語）
 * @param locale - 表示言語（デフォルト: "ja"）
 * @returns ローカライズされたタイプ名
 */
export function getTypeDisplayName(type: PokemonType, locale: 'ja' | 'en' = 'ja'): string {
  if (locale === 'en') return type;
  return TYPE_JA_MAP.get(type) ?? type;
}
