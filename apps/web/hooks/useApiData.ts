import useSWR from 'swr';
import type { PokemonRow, MoveRow, AbilityRow, ItemRow } from '@/lib/api-adapters';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
};

/** 全ポケモン一覧を取得（レギュレーション指定可） */
export function useAllPokemon(regulation?: string) {
  const url = regulation
    ? `/api/pokemon?regulation=${encodeURIComponent(regulation)}`
    : '/api/pokemon';
  return useSWR<PokemonRow[]>(url, fetcher<PokemonRow[]>);
}

/** 全技一覧を取得 */
export function useAllMoves() {
  return useSWR<MoveRow[]>('/api/moves', fetcher<MoveRow[]>);
}

/** 全特性一覧を取得 */
export function useAllAbilities() {
  return useSWR<AbilityRow[]>('/api/abilities', fetcher<AbilityRow[]>);
}

/** 全アイテム一覧を取得 */
export function useAllItems() {
  return useSWR<ItemRow[]>('/api/items', fetcher<ItemRow[]>);
}

/** ポケモン名で検索（完全一致: 日本語名/英語名/ID） */
export function usePokemonByName(name: string | null) {
  return useSWR<PokemonRow | null>(
    name ? `/api/pokemon?name=${encodeURIComponent(name)}` : null,
    fetcher<PokemonRow | null>
  );
}

/** 技名で検索（完全一致） */
export function useMoveByName(name: string | null) {
  return useSWR<MoveRow | null>(
    name ? `/api/moves?name=${encodeURIComponent(name)}` : null,
    fetcher<MoveRow | null>
  );
}

/** 特性名で検索（完全一致） */
export function useAbilityByName(name: string | null) {
  return useSWR<AbilityRow | null>(
    name ? `/api/abilities?name=${encodeURIComponent(name)}` : null,
    fetcher<AbilityRow | null>
  );
}

/** アイテム名で検索（完全一致） */
export function useItemByName(name: string | null) {
  return useSWR<ItemRow | null>(
    name ? `/api/items?name=${encodeURIComponent(name)}` : null,
    fetcher<ItemRow | null>
  );
}

/** メガフォーム一覧を取得（baseフォームのslug指定） */
export function useMegaForms(baseSlug: string | null) {
  return useSWR<PokemonRow[]>(
    baseSlug ? `/api/pokemon?megaForms=${encodeURIComponent(baseSlug)}` : null,
    fetcher<PokemonRow[]>
  );
}

/** レギュレーション型 */
export interface RegulationData {
  id: number;
  name: string;
  battleSystems: string[];
}

/** デフォルトレギュレーションを取得 */
export function useDefaultRegulation() {
  return useSWR<RegulationData | null>(
    '/api/regulations?default=true',
    fetcher<RegulationData | null>
  );
}

/** 全レギュレーション一覧を取得 */
export function useRegulations() {
  return useSWR<RegulationData[]>('/api/regulations', fetcher<RegulationData[]>);
}

/** 習得技を取得（フラットなmoveId数値リスト） */
export function useLearnset(pokemonId: string | null) {
  return useSWR<{ pokemonId: string; moves: number[] }>(
    pokemonId ? `/api/learnsets/${pokemonId}` : null,
    fetcher<{ pokemonId: string; moves: number[] }>
  );
}
