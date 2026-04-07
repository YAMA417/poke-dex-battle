import { useMemo } from 'react';
import { usePokemonByName, useMegaForms } from './useApiData';
import { toSpeciesData } from '@/lib/api-adapters';
import type { PokemonSpeciesData } from '@poke-dex-battle/shared';

export function usePokemonSearch(pokemonName: string): {
  data: PokemonSpeciesData | null;
  loading: boolean;
  error: string | null;
  megaForms: PokemonSpeciesData[];
} {
  const name = pokemonName?.trim() || null;
  const { data: raw, isLoading } = usePokemonByName(name);
  const data = useMemo(() => toSpeciesData(raw), [raw]);

  // baseフォームの場合のみメガフォームを検索
  const baseSlug = data?.formType === 'base' ? data.name : null;
  const { data: megaFormsRaw } = useMegaForms(baseSlug);

  const megaForms = useMemo<PokemonSpeciesData[]>(() => {
    if (!megaFormsRaw) return [];
    return megaFormsRaw
      .map((row) => toSpeciesData(row))
      .filter((d): d is PokemonSpeciesData => d !== null);
  }, [megaFormsRaw]);

  return {
    data,
    loading: isLoading,
    error: !isLoading && name && !data ? `ポケモン「${pokemonName}」が見つかりませんでした` : null,
    megaForms,
  };
}
