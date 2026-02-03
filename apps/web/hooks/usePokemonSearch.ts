import { useState, useEffect } from "react";
import { fetchPokemon, fetchPokemonSpecies, resolvePokemonName } from "@poke-dex-battle/shared";
import type { PokeApiPokemonResponse, PokeApiSpeciesResponse, PokemonType } from "@poke-dex-battle/shared";

interface PokemonData {
  japaneseName: string;
  types: PokemonType[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
}

export function usePokemonSearch(pokemonName: string) {
  const [data, setData] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pokemonName || pokemonName.trim().length === 0) {
      setData(null);
      setError(null);
      return;
    }

    const searchPokemon = async () => {
      setLoading(true);
      setError(null);

      try {
        // Convert Japanese name to English name if needed
        const resolvedName = resolvePokemonName(pokemonName);

        if (!resolvedName) {
          throw new Error(`ポケモン「${pokemonName}」が見つかりませんでした`);
        }

        // Fetch pokemon data using the resolved English name
        const pokemonData = await fetchPokemon(resolvedName);

        // Fetch species data for Japanese name
        const speciesData = await fetchPokemonSpecies(pokemonData.species.name);

        // Extract Japanese name
        const japaneseName =
          speciesData.names.find((name) => name.language.name === "ja")?.name ||
          pokemonData.name;

        // Extract types
        const types: PokemonType[] = pokemonData.types
          .sort((a, b) => a.slot - b.slot)
          .map((typeInfo) => {
            const typeName = typeInfo.type.name;
            // Convert to PokemonType format (capitalize first letter)
            return (typeName.charAt(0).toUpperCase() + typeName.slice(1)) as PokemonType;
          });

        // Extract base stats
        const baseStats = {
          hp: pokemonData.stats.find((s) => s.stat.name === "hp")?.base_stat || 0,
          attack: pokemonData.stats.find((s) => s.stat.name === "attack")?.base_stat || 0,
          defense: pokemonData.stats.find((s) => s.stat.name === "defense")?.base_stat || 0,
          specialAttack: pokemonData.stats.find((s) => s.stat.name === "special-attack")?.base_stat || 0,
          specialDefense: pokemonData.stats.find((s) => s.stat.name === "special-defense")?.base_stat || 0,
          speed: pokemonData.stats.find((s) => s.stat.name === "speed")?.base_stat || 0,
        };

        setData({ japaneseName, types, baseStats });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch Pokemon data");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls
    const timeoutId = setTimeout(searchPokemon, 500);
    return () => clearTimeout(timeoutId);
  }, [pokemonName]);

  return { data, loading, error };
}
