import type { MoveData } from '@poke-dex-battle/shared';
import { getMoveByName } from '@poke-dex-battle/shared';
import { useEffect, useState } from 'react';

export function useMoveSearch(moveName: string) {
  const [data, setData] = useState<MoveData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moveName || moveName.trim().length === 0) {
      setData(null);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const result = getMoveByName(moveName);
      if (result) {
        setData(result);
        setError(null);
      } else {
        setData(null);
        setError(`技「${moveName}」が見つかりませんでした`);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [moveName]);

  return { data, loading: false, error };
}
