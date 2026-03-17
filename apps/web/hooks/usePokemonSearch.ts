import { useMemo } from 'react';
import { usePokemonByName } from './useApiData';
import { toSpeciesData } from '@/lib/api-adapters';

export function usePokemonSearch(pokemonName: string) {
  const name = pokemonName?.trim() || null;
  const { data: raw, isLoading } = usePokemonByName(name);
  const data = useMemo(() => toSpeciesData(raw), [raw]);

  return {
    data,
    loading: isLoading,
    error: !isLoading && name && !data ? `ポケモン「${pokemonName}」が見つかりませんでした` : null,
  };
}
