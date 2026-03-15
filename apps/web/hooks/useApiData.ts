import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

/** 全ポケモン一覧を取得（レギュレーション指定可） */
export function useAllPokemon(regulation?: string) {
  const url = regulation ? `/api/pokemon?regulation=${encodeURIComponent(regulation)}` : '/api/pokemon';
  return useSWR<any[]>(url, fetcher);
}

/** 全技一覧を取得 */
export function useAllMoves() {
  return useSWR<any[]>('/api/moves', fetcher);
}

/** 全特性一覧を取得 */
export function useAllAbilities() {
  return useSWR<any[]>('/api/abilities', fetcher);
}

/** 全アイテム一覧を取得 */
export function useAllItems() {
  return useSWR<any[]>('/api/items', fetcher);
}

/** ポケモン名で検索（完全一致: 日本語名/英語名/ID） */
export function usePokemonByName(name: string | null) {
  return useSWR<any>(name ? `/api/pokemon?name=${encodeURIComponent(name)}` : null, fetcher);
}

/** 技名で検索（完全一致） */
export function useMoveByName(name: string | null) {
  return useSWR<any>(name ? `/api/moves?name=${encodeURIComponent(name)}` : null, fetcher);
}

/** 特性名で検索（完全一致） */
export function useAbilityByName(name: string | null) {
  return useSWR<any>(name ? `/api/abilities?name=${encodeURIComponent(name)}` : null, fetcher);
}

/** アイテム名で検索（完全一致） */
export function useItemByName(name: string | null) {
  return useSWR<any>(name ? `/api/items?name=${encodeURIComponent(name)}` : null, fetcher);
}

/** 習得技を取得 */
export function useLearnset(pokemonId: string | null) {
  return useSWR<{ pokemonId: string; level: string[]; machine: string[]; egg: string[] }>(
    pokemonId ? `/api/learnsets/${pokemonId}` : null,
    fetcher
  );
}
