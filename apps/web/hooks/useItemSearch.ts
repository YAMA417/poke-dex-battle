import { useMemo } from 'react';
import { useItemByName } from './useApiData';
import { toItemData } from '@/lib/api-adapters';

export function useItemSearch(itemName: string) {
  const name = itemName?.trim() || null;
  const { data: raw, isLoading } = useItemByName(name);
  const data = useMemo(() => toItemData(raw), [raw]);

  return {
    data,
    loading: isLoading,
    error: !isLoading && name && !data ? `アイテム「${itemName}」が見つかりませんでした` : null,
  };
}
