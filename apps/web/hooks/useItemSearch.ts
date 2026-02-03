import { useState, useEffect } from "react";
import { getItemDetails } from "@poke-dex-battle/shared";
import type { ItemNameEntry } from "@poke-dex-battle/shared";

export function useItemSearch(itemName: string) {
  const [data, setData] = useState<ItemNameEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemName || itemName.trim().length === 0) {
      setData(null);
      setError(null);
      return;
    }

    const searchItem = () => {
      setLoading(true);
      setError(null);

      try {
        // Get item details from name resolver
        const itemDetails = getItemDetails(itemName);

        if (!itemDetails) {
          throw new Error(`アイテム「${itemName}」が見つかりませんでした`);
        }

        setData(itemDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch item data");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchItem, 500);
    return () => clearTimeout(timeoutId);
  }, [itemName]);

  return { data, loading, error };
}
