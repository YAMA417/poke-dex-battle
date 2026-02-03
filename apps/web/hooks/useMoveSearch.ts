import { useState, useEffect } from "react";
import { getMoveDetails } from "@poke-dex-battle/shared";
import type { MoveNameEntry } from "@poke-dex-battle/shared";

export function useMoveSearch(moveName: string) {
  const [data, setData] = useState<MoveNameEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moveName || moveName.trim().length === 0) {
      setData(null);
      setError(null);
      return;
    }

    const searchMove = () => {
      setLoading(true);
      setError(null);

      try {
        // Get move details from name resolver
        const moveDetails = getMoveDetails(moveName);

        if (!moveDetails) {
          throw new Error(`技「${moveName}」が見つかりませんでした`);
        }

        setData(moveDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch move data");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchMove, 500);
    return () => clearTimeout(timeoutId);
  }, [moveName]);

  return { data, loading, error };
}
