'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoveFilteredSelect } from '@/components/move/MoveFilteredSelect';
import { useAllMoves, useLearnset, usePokemonByName } from '@/hooks/useApiData';
import type { MoveRow } from '@/lib/api-adapters';
import type { PokemonType } from '@poke-dex-battle/shared';
import { POKEMON_TYPE_OPTIONS } from '@poke-dex-battle/shared';
import { useMemo, useCallback } from 'react';

export interface MoveSelectData {
  name: string;
  power: number;
  type: PokemonType;
  category: 'Physical' | 'Special';
  target: string;
}

interface MoveInputProps {
  pokemonName: string;
  moveName: string;
  movePower: number;
  moveType: PokemonType;
  moveCategory: 'Physical' | 'Special';
  /** 技選択時の一括更新 */
  onMoveSelect: (data: MoveSelectData) => void;
  /** 個別フィールドの手動変更（フルモードのみ） */
  onMovePowerChange: (power: number) => void;
  onMoveTypeChange: (type: PokemonType) => void;
  onMoveCategoryChange: (category: 'Physical' | 'Special') => void;
  compact?: boolean;
}

export function MoveInput({
  pokemonName,
  moveName,
  movePower,
  moveType,
  moveCategory,
  onMoveSelect,
  onMovePowerChange,
  onMoveTypeChange,
  onMoveCategoryChange,
  compact,
}: MoveInputProps): React.ReactNode {
  // API経由でデータを取得
  const { data: allMoves } = useAllMoves();
  const { data: pokemonData } = usePokemonByName(pokemonName || null);
  const pokemonId = pokemonData?.id ?? null;
  const { data: learnsetData } = useLearnset(pokemonId);

  // 習得可能技の slug リスト
  const learnableMoves = learnsetData?.moves ?? null;

  // slug → MoveRow の高速マップ
  const moveBySlug = useMemo(() => {
    if (!allMoves) return new Map<string, MoveRow>();
    return new Map(allMoves.map((m) => [m.slug, m]));
  }, [allMoves]);

  // 技選択時に slug → MoveSelectData 変換して親に通知
  const handleMoveSelect = useCallback(
    (slug: string) => {
      const moveData = moveBySlug.get(slug);
      if (moveData) {
        onMoveSelect({
          name: moveData.nameJa,
          power: moveData.power ?? movePower,
          type: moveData.type as PokemonType,
          category:
            moveData.category === 'Physical' || moveData.category === 'Special'
              ? moveData.category
              : moveCategory,
          target: moveData.target ?? '',
        });
      }
    },
    [moveBySlug, movePower, moveCategory, onMoveSelect]
  );

  // compact モード: MoveFilteredSelect のみ
  if (compact) {
    return (
      <MoveFilteredSelect
        learnableMoves={learnableMoves}
        allMoves={allMoves ?? []}
        onSelect={handleMoveSelect}
        excludeCategories={['Status']}
        collapsible={true}
        defaultExpanded={false}
        placeholder="技名"
        aria-label="技を選択"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="move-name">技名</Label>
        <MoveFilteredSelect
          learnableMoves={learnableMoves}
          allMoves={allMoves ?? []}
          onSelect={handleMoveSelect}
          excludeCategories={['Status']}
          collapsible={false}
          placeholder="技名を入力"
          aria-label="技を選択"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="move-power">威力</Label>
        <Input
          id="move-power"
          type="text"
          inputMode="numeric"
          value={movePower}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const numericValue = e.target.value.replace(/\D/g, '');
            const parsed = parseInt(numericValue || '0', 10);
            onMovePowerChange(parsed);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="move-type">タイプ</Label>
        <Select
          value={moveType}
          onValueChange={(value: string) => onMoveTypeChange(value as PokemonType)}
        >
          <SelectTrigger id="move-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POKEMON_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>カテゴリ</Label>
        <RadioGroup
          value={moveCategory}
          onValueChange={(value: string) => onMoveCategoryChange(value as 'Physical' | 'Special')}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Physical" id="category-physical" />
            <Label htmlFor="category-physical" className="cursor-pointer text-sm font-normal">
              物理
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Special" id="category-special" />
            <Label htmlFor="category-special" className="cursor-pointer text-sm font-normal">
              特殊
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
