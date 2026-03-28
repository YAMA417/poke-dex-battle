'use client';

import { Autocomplete } from '@/components/ui/autocomplete';
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
import { useAllMoves, useLearnset, usePokemonByName } from '@/hooks/useApiData';
import type { MoveRow } from '@/lib/api-adapters';
import type { PokemonType } from '@poke-dex-battle/shared';
import { POKEMON_TYPE_OPTIONS } from '@poke-dex-battle/shared';
import { useMemo } from 'react';

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
  // 技選択時の一括更新（rerender-move-effect-to-event）
  onMoveSelect: (data: MoveSelectData) => void;
  // 個別フィールドの手動変更（フルモードのみ）
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
}: MoveInputProps) {
  // API経由でデータを取得
  const { data: allMoves } = useAllMoves();
  const { data: pokemonData } = usePokemonByName(pokemonName || null);
  const pokemonId = pokemonData?.id ?? null;
  const { data: learnsetData } = useLearnset(pokemonId);

  // 全技データ（ポケモン選択時は learnset で絞り込み、レベル技/わざマシンで分類）
  const moveOptions = useMemo(() => {
    if (!allMoves) return [];
    const moveById = new Map(allMoves.map((m) => [m.id, m]));

    if (pokemonName && learnsetData) {
      const levelMoveIds: string[] = learnsetData.level ?? [];
      const machineMoveIds: string[] = learnsetData.machine ?? [];

      if (levelMoveIds.length > 0 || machineMoveIds.length > 0) {
        const levelOptions = levelMoveIds
          .map((id) => moveById.get(id))
          .filter((m) => m != null)
          .map((move) => ({
            label: move.nameJa,
            value: move.nameJa,
            id: `move-${move.id}`,
            group: 'レベル技・思い出し技',
          }));

        const levelMoveIdSet = new Set(levelMoveIds);
        // わざマシン技からレベル技と重複するものを除外
        const machineOptions = machineMoveIds
          .filter((id) => !levelMoveIdSet.has(id))
          .map((id) => moveById.get(id))
          .filter((m) => m != null)
          .map((move) => ({
            label: move.nameJa,
            value: move.nameJa,
            id: `move-${move.id}`,
            group: 'わざマシン',
          }));

        return [...levelOptions, ...machineOptions];
      }
    }

    // ポケモン未選択 or learnset 取得不可の場合は全技
    return allMoves.map((move) => ({
      label: move.nameJa,
      value: move.nameJa,
      id: `move-${move.id}`,
    }));
  }, [pokemonName, allMoves, learnsetData]);

  // 全技のMap（技選択時の検索用）
  const moveByNameJa = useMemo(() => {
    if (!allMoves) return new Map<string, MoveRow>();
    return new Map(allMoves.map((m) => [m.nameJa, m]));
  }, [allMoves]);

  // rerender-move-effect-to-event: 技選択時にデータを一括反映
  const handleMoveSelect = (selectedName: string) => {
    const moveData = moveByNameJa.get(selectedName);
    if (moveData) {
      onMoveSelect({
        name: selectedName,
        power: moveData.power ?? movePower,
        type: moveData.type as PokemonType,
        category:
          moveData.category === 'Physical' || moveData.category === 'Special'
            ? moveData.category
            : moveCategory,
        target: moveData.target ?? '',
      });
    } else {
      onMoveSelect({
        name: selectedName,
        power: movePower,
        type: moveType,
        category: moveCategory,
        target: '',
      });
    }
  };

  // compact モード: 技名 Autocomplete のみ
  if (compact) {
    return (
      <Autocomplete
        id="move-name"
        options={moveOptions}
        onSelect={handleMoveSelect}
        placeholder="技名"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="move-name">技名</Label>
        <Autocomplete
          id="move-name"
          options={moveOptions}
          onSelect={handleMoveSelect}
          placeholder="技名を入力"
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
