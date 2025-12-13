"use client";

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
import type { MoveCategory, PokemonType } from "@poke-dex-battle/shared";
import { POKEMON_TYPE_OPTIONS } from "@poke-dex-battle/shared";

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
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="move-name">技名</Label>
        <Input
          id="move-name"
          type="text"
          value={moveName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onMoveNameChange(e.target.value)
          }
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
