import { useMemo } from 'react';
import { useMoveByName } from './useApiData';
import { toMoveData } from '@/lib/api-adapters';

export function useMoveSearch(moveName: string) {
  const name = moveName?.trim() || null;
  const { data: raw, isLoading } = useMoveByName(name);
  const data = useMemo(() => toMoveData(raw), [raw]);

  return {
    data,
    loading: isLoading,
    error: !isLoading && name && !data ? `技「${moveName}」が見つかりませんでした` : null,
  };
}
