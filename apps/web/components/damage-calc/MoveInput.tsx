"use client";

import { useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PokemonType } from "@poke-dex-battle/shared";
import { POKEMON_TYPE_OPTIONS, moveNameMap } from "@poke-dex-battle/shared";
import { useMoveSearch } from "@/hooks/useMoveSearch";

interface MoveInputProps {
  moveName: string;
  movePower: number;
  moveType: PokemonType;
  moveCategory: "Physical" | "Special";
  onMoveNameChange: (name: string) => void;
  onMovePowerChange: (power: number) => void;
  onMoveTypeChange: (type: PokemonType) => void;
  onMoveCategoryChange: (category: "Physical" | "Special") => void;
}

export function MoveInput({
  moveName,
  movePower,
  moveType,
  moveCategory,
  onMoveNameChange,
  onMovePowerChange,
  onMoveTypeChange,
  onMoveCategoryChange,
}: MoveInputProps) {
  // 技名から詳細情報を取得
  const { data: moveData, loading, error } = useMoveSearch(moveName);

  // 技名のオプションリストを生成（重複を避ける）
  const moveOptions = useMemo(() => {
    const seen = new Set<number>();
    return Object.values(moveNameMap)
      .filter((move: any) => {
        if (seen.has(move.id)) {
          return false;
        }
        seen.add(move.id);
        return true;
      })
      .map((move: any) => ({
        label: move.japaneseName,
        value: move.englishName,
        id: `move-${move.id}`,
      }));
  }, []);

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
  }, [moveData]);

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
