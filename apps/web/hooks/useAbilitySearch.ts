import { useMemo } from 'react';
import { useAbilityByName } from './useApiData';
import { toAbilityData } from '@/lib/api-adapters';

export function useAbilitySearch(abilityName: string) {
  const name = abilityName?.trim() || null;
  const { data: raw, isLoading } = useAbilityByName(name);
  const data = useMemo(() => toAbilityData(raw), [raw]);

  return {
    data,
    loading: isLoading,
    error: !isLoading && name && !data ? `特性「${abilityName}」が見つかりませんでした` : null,
  };
}
