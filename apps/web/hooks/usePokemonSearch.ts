import type { PokemonSpeciesData } from "@poke-dex-battle/shared";
import { getPokemonByName } from "@poke-dex-battle/shared";
import { useEffect, useState } from "react";

export function usePokemonSearch(pokemonName: string) {
  const [data, setData] = useState<PokemonSpeciesData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pokemonName || pokemonName.trim().length === 0) {
      setData(null);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const result = getPokemonByName(pokemonName);
      if (result) {
        setData(result);
        setError(null);
      } else {
        setData(null);
        setError(`ポケモン「${pokemonName}」が見つかりませんでした`);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pokemonName]);

  return { data, loading: false, error };
}
