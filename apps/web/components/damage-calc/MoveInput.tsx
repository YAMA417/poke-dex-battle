"use client";

import { Autocomplete } from "@/components/ui/autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMoveSearch } from "@/hooks/useMoveSearch";
import type { PokemonType } from "@poke-dex-battle/shared";
import { POKEMON_TYPE_OPTIONS, getAllMoves, getLevelMoves, getMachineMoves } from "@poke-dex-battle/shared";
import { useEffect, useMemo } from "react";

interface MoveInputProps {
  pokemonName: string;
  moveName: string;
  movePower: number;
  moveType: PokemonType;
  moveCategory: "Physical" | "Special";
  onMoveNameChange: (name: string) => void;
  onMovePowerChange: (power: number) => void;
  onMoveTypeChange: (type: PokemonType) => void;
  onMoveCategoryChange: (category: "Physical" | "Special") => void;
  compact?: boolean;
}

export function MoveInput({
  pokemonName,
  moveName,
  movePower,
  moveType,
  moveCategory,
  onMoveNameChange,
  onMovePowerChange,
  onMoveTypeChange,
  onMoveCategoryChange,
  compact,
}: MoveInputProps) {
  // 技名から詳細情報を取得
  const { data: moveData } = useMoveSearch(moveName);

  // 全技データ（ポケモン選択時は learnset で絞り込み、レベル技/わざマシンで分類）
  const moveOptions = useMemo(() => {
    const allMoves = getAllMoves();
    const moveById = new Map(allMoves.map((m) => [m.id, m]));

    if (pokemonName) {
      const levelMoveIds = getLevelMoves(pokemonName);
      const machineMoveIds = getMachineMoves(pokemonName);

      if (levelMoveIds.length > 0 || machineMoveIds.length > 0) {
        const levelOptions = levelMoveIds
          .map((id) => moveById.get(id))
          .filter((m) => m != null)
          .map((move) => ({
            label: move.nameJa,
            value: move.nameJa,
            id: `move-${move.id}`,
            group: "レベル技・思い出し技",
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
            group: "わざマシン",
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
  }, [pokemonName]);

  // 技データが取得できたら、各項目を自動入力
  useEffect(() => {
    if (moveData) {
      // 威力を自動設定（nullの場合は変更しない）
      if (moveData.power !== null && moveData.power !== movePower) {
        onMovePowerChange(moveData.power);
      }

      // タイプを自動設定

      if (moveData.type !== moveType) {
        onMoveTypeChange(moveData.type as PokemonType);
      }

      // カテゴリを自動設定（PhysicalまたはSpecialのみ）
      if (
        (moveData.category === "Physical" || moveData.category === "Special") &&
        moveData.category !== moveCategory
      ) {
        onMoveCategoryChange(moveData.category);
      }
    }
  }, [
    moveData,
    movePower,
    moveType,
    moveCategory,
    onMovePowerChange,
    onMoveTypeChange,
    onMoveCategoryChange,
  ]);

  // compact モード: 技名 Autocomplete のみ
  if (compact) {
    return (
      <Autocomplete
        id="move-name"
        options={moveOptions}
        onSelect={(selectedValue) => onMoveNameChange(selectedValue)}
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
          onSelect={(selectedValue) => onMoveNameChange(selectedValue)}
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
          onValueChange={(value: string) =>
            onMoveCategoryChange(value as "Physical" | "Special")
          }
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Physical" id="category-physical" />
            <Label
              htmlFor="category-physical"
              className="text-sm font-normal cursor-pointer"
            >
              物理
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Special" id="category-special" />
            <Label
              htmlFor="category-special"
              className="text-sm font-normal cursor-pointer"
            >
              特殊
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
