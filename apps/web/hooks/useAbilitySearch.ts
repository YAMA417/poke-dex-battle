import { useState, useEffect } from "react";
import { getAbilityDetails } from "@poke-dex-battle/shared";
import type { AbilityNameEntry } from "@poke-dex-battle/shared";

export function useAbilitySearch(abilityName: string) {
  const [data, setData] = useState<AbilityNameEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abilityName || abilityName.trim().length === 0) {
      setData(null);
      setError(null);
      return;
    }

    const searchAbility = () => {
      setLoading(true);
      setError(null);

      try {
        // Get ability details from name resolver
        const abilityDetails = getAbilityDetails(abilityName);

        if (!abilityDetails) {
          throw new Error(`特性「${abilityName}」が見つかりませんでした`);
        }

        setData(abilityDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch ability data");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchAbility, 500);
    return () => clearTimeout(timeoutId);
  }, [abilityName]);

  return { data, loading, error };
}
