import type { ItemData } from '@poke-dex-battle/shared';
import { getItemByName } from '@poke-dex-battle/shared';
import { useEffect, useState } from 'react';

export function useItemSearch(itemName: string) {
  const [data, setData] = useState<ItemData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemName || itemName.trim().length === 0) {
      setData(null);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const result = getItemByName(itemName);
      if (result) {
        setData(result);
        setError(null);
      } else {
        setData(null);
        setError(`アイテム「${itemName}」が見つかりませんでした`);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [itemName]);

  return { data, loading: false, error };
}
