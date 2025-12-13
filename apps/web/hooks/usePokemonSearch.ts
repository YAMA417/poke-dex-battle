import { useState, useEffect } from "react";
import { fetchPokemon, fetchPokemonSpecies } from "@poke-dex-battle/shared";
import type { PokeApiPokemonResponse, PokeApiSpeciesResponse } from "@poke-dex-battle/shared";

interface PokemonData {
  japaneseName: string;
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
        // Convert to lowercase and remove spaces for API request
        const searchTerm = pokemonName.toLowerCase().replace(/\s+/g, "-");

        // Fetch pokemon data
        const pokemonData = await fetchPokemon(searchTerm);

        // Fetch species data for Japanese name
        const speciesData = await fetchPokemonSpecies(pokemonData.species.name);

        // Extract Japanese name
        const japaneseName =
          speciesData.names.find((name) => name.language.name === "ja")?.name ||
          pokemonData.name;

        // Extract base stats
        const baseStats = {
          hp: pokemonData.stats.find((s) => s.stat.name === "hp")?.base_stat || 0,
          attack: pokemonData.stats.find((s) => s.stat.name === "attack")?.base_stat || 0,
          defense: pokemonData.stats.find((s) => s.stat.name === "defense")?.base_stat || 0,
          specialAttack: pokemonData.stats.find((s) => s.stat.name === "special-attack")?.base_stat || 0,
          specialDefense: pokemonData.stats.find((s) => s.stat.name === "special-defense")?.base_stat || 0,
          speed: pokemonData.stats.find((s) => s.stat.name === "speed")?.base_stat || 0,
        };

        setData({ japaneseName, baseStats });
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
