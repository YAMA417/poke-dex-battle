import type { AbilityData } from '@poke-dex-battle/shared';
import { getAbilityByName } from '@poke-dex-battle/shared';
import { useEffect, useState } from 'react';

export function useAbilitySearch(abilityName: string) {
  const [data, setData] = useState<AbilityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abilityName || abilityName.trim().length === 0) {
      setData(null);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const result = getAbilityByName(abilityName);
      if (result) {
        setData(result);
        setError(null);
      } else {
        setData(null);
        setError(`特性「${abilityName}」が見つかりませんでした`);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [abilityName]);

  return { data, loading: false, error };
}
