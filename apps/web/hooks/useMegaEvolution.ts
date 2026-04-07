import { useMemo } from 'react';
import type { PokemonSpeciesData } from '@poke-dex-battle/shared';

interface UseMegaEvolutionParams {
  isMegaEvolved: boolean;
  megaFormSlug: string | null;
  megaForms: PokemonSpeciesData[];
  baseSpriteUrl: string | undefined;
}

interface UseMegaEvolutionReturn {
  /** 現在選択中のメガフォームデータ */
  currentMegaForm: PokemonSpeciesData | null;
  /** 「メガシンカ」or「ゲンシカイキ」のラベル */
  megaLabel: string;
  /** メガ時はメガフォームのスプライト、それ以外はベースフォーム */
  spriteUrl: string | undefined;
}

/**
 * メガシンカ/ゲンシカイキの共通ロジック（攻撃側・防御側共用）
 */
export function useMegaEvolution({
  isMegaEvolved,
  megaFormSlug,
  megaForms,
  baseSpriteUrl,
}: UseMegaEvolutionParams): UseMegaEvolutionReturn {
  const currentMegaForm = useMemo<PokemonSpeciesData | null>(() => {
    if (!isMegaEvolved || !megaFormSlug) return null;
    return megaForms.find((f) => f.name === megaFormSlug) ?? null;
  }, [isMegaEvolved, megaFormSlug, megaForms]);

  const megaLabel = useMemo((): string => {
    if (megaForms.length === 0) return '';
    const hasPrimal = megaForms.some((f) => f.formType === 'primal');
    return hasPrimal ? 'ゲンシカイキ' : 'メガシンカ';
  }, [megaForms]);

  const spriteUrl = currentMegaForm?.spriteUrl ?? baseSpriteUrl;

  return { currentMegaForm, megaLabel, spriteUrl };
}
