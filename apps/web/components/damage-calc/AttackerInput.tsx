"use client";

import { Autocomplete } from "@/components/ui/autocomplete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePokemonSearch } from "@/hooks/usePokemonSearch";
import type { PokemonType, StatStage } from "@poke-dex-battle/shared";
import { calcOtherStat, getAllPokemon } from "@poke-dex-battle/shared";
import { useEffect, useMemo, useState } from "react";
import { MoveInput } from "./MoveInput";
import { NatureModifierRadio } from "./NatureModifierRadio";
import { generateIdPrefix } from "@/utils/id";

const STAT_STAGES: StatStage[] = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

// --- 共有サブコンポーネント ---

interface NatureModifierCompactProps {
  value: 1.1 | 1.0 | 0.9;
  onChange: (modifier: 1.1 | 1.0 | 0.9) => void;
}

const NATURE_OPTIONS = [
  { value: 1.1 as const, label: "↑" },
  { value: 1.0 as const, label: "—" },
  { value: 0.9 as const, label: "↓" },
];

export function NatureModifierCompact({ value, onChange }: NatureModifierCompactProps) {
  return (
    <div className="flex gap-1">
      {NATURE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs rounded border transition-colors ${
            value === opt.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-input hover:bg-accent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function EvPreset({ label, value, onChange }: {
  label: string; value: number; onChange: (ev: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label} 努力値</Label>
      <div className="flex gap-1">
        <button type="button" onClick={() => onChange(252)}
          className={`px-2 py-1 text-xs rounded border ${value === 252 ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
          252
        </button>
        <button type="button" onClick={() => onChange(0)}
          className={`px-2 py-1 text-xs rounded border ${value === 0 ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
          0
        </button>
        <Input type="number" min={0} max={252} step={4} value={value}
          onChange={(e) => onChange(Math.max(0, Math.min(252, parseInt(e.target.value) || 0)))}
          className="h-7 w-16 text-xs" />
      </div>
    </div>
  );
}

// --- 型定義 ---

export interface AttackerData {
  pokemonName: string;
  pokemonTypes: PokemonType[];
  moveName: string;
  movePower: number;
  moveType: PokemonType;
  moveCategory: "Physical" | "Special";
  attackBaseStat: number;
  specialAttackBaseStat: number;
  attackStat: number;
  specialAttackStat: number;
  attackModifier: 1.1 | 1.0 | 0.9;
  specialAttackModifier: 1.1 | 1.0 | 0.9;
  attackRank: StatStage;
  specialAttackRank: StatStage;
  abilityName: string;
  itemName: string;
}

interface AttackerInputProps {
  data: AttackerData;
  onDataChange: (data: AttackerData) => void;
  title: string;
  idKey: string;
  displayMode: "compact" | "full";
}

// --- メインコンポーネント ---

export function AttackerInput({ data, onDataChange, title, idKey, displayMode }: AttackerInputProps) {
  const idPrefix = useMemo(() => generateIdPrefix(title, idKey), [title, idKey]);

  // full モード用の内部 state
  const [attackEv, setAttackEv] = useState(252);
  const [attackIv, setAttackIv] = useState(31);
  const [spAtkEv, setSpAtkEv] = useState(252);
  const [spAtkIv, setSpAtkIv] = useState(31);

  const { data: pokemonData } = usePokemonSearch(data.pokemonName);

  const pokemonOptions = useMemo(() => {
    return getAllPokemon().map((pokemon) => ({
      label: pokemon.nameJa,
      value: pokemon.nameJa,
      id: `pokemon-${pokemon.id}`,
    }));
  }, []);

  // ポケモンデータ取得時に種族値・タイプ・第1特性を自動反映
  useEffect(() => {
    if (pokemonData?.baseStats) {
      const atkBase = pokemonData.baseStats.attack;
      const spAtkBase = pokemonData.baseStats.specialAttack;
      const firstAbility = pokemonData.abilities[0];

      onDataChange({
        ...data,
        attackBaseStat: atkBase,
        specialAttackBaseStat: spAtkBase,
        pokemonTypes: pokemonData.types,
        abilityName: firstAbility?.nameJa ?? "",
        attackStat: calcOtherStat(atkBase, attackIv, attackEv, 50, data.attackModifier),
        specialAttackStat: calcOtherStat(spAtkBase, spAtkIv, spAtkEv, 50, data.specialAttackModifier),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonData]);

  // EV/IV/modifier 変更時にステータス再計算
  useEffect(() => {
    const newAtk = calcOtherStat(data.attackBaseStat, attackIv, attackEv, 50, data.attackModifier);
    const newSpAtk = calcOtherStat(data.specialAttackBaseStat, spAtkIv, spAtkEv, 50, data.specialAttackModifier);
    if (newAtk !== data.attackStat || newSpAtk !== data.specialAttackStat) {
      onDataChange({ ...data, attackStat: newAtk, specialAttackStat: newSpAtk });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attackEv, attackIv, spAtkEv, spAtkIv, data.attackModifier, data.specialAttackModifier, data.attackBaseStat, data.specialAttackBaseStat]);

  if (displayMode === "compact") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Autocomplete
            id={`${idPrefix}-pokemon-name`}
            options={pokemonOptions}
            onSelect={(name) => onDataChange({ ...data, pokemonName: name })}
            placeholder="ポケモン名"
          />
          <MoveInput
            pokemonName={data.pokemonName}
            moveName={data.moveName}
            movePower={data.movePower}
            moveType={data.moveType}
            moveCategory={data.moveCategory}
            onMoveNameChange={(name) => onDataChange({ ...data, moveName: name })}
            onMovePowerChange={(power) => onDataChange({ ...data, movePower: power })}
            onMoveTypeChange={(type) => onDataChange({ ...data, moveType: type })}
            onMoveCategoryChange={(cat) => onDataChange({ ...data, moveCategory: cat })}
            compact
          />
          <div className="space-y-1">
            <Label className="text-xs">性格補正</Label>
            <NatureModifierCompact
              value={data.moveCategory === "Physical" ? data.attackModifier : data.specialAttackModifier}
              onChange={(mod) => {
                if (data.moveCategory === "Physical") {
                  onDataChange({ ...data, attackModifier: mod });
                } else {
                  onDataChange({ ...data, specialAttackModifier: mod });
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">持ち物</Label>
            <Input
              type="text"
              value={data.itemName}
              onChange={(e) => onDataChange({ ...data, itemName: e.target.value })}
              placeholder="持ち物名"
              className="h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // displayMode === "full"
  const isPhysical = data.moveCategory === "Physical";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPhysical ? (
          <>
            <EvPreset label="攻撃" value={attackEv} onChange={setAttackEv} />
            <div className="space-y-1">
              <Label className="text-xs">攻撃個体値</Label>
              <Input type="number" min={0} max={31} value={attackIv}
                onChange={(e) => setAttackIv(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
                className="h-7 text-xs" />
            </div>
            <NatureModifierRadio statName="攻撃" value={data.attackModifier}
              onChange={(mod) => onDataChange({ ...data, attackModifier: mod })} />
            <div className="text-sm text-muted-foreground">
              実数値: <span className="font-bold text-foreground">{data.attackStat}</span>
            </div>
          </>
        ) : (
          <>
            <EvPreset label="特攻" value={spAtkEv} onChange={setSpAtkEv} />
            <div className="space-y-1">
              <Label className="text-xs">特攻個体値</Label>
              <Input type="number" min={0} max={31} value={spAtkIv}
                onChange={(e) => setSpAtkIv(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
                className="h-7 text-xs" />
            </div>
            <NatureModifierRadio statName="特攻" value={data.specialAttackModifier}
              onChange={(mod) => onDataChange({ ...data, specialAttackModifier: mod })} />
            <div className="text-sm text-muted-foreground">
              実数値: <span className="font-bold text-foreground">{data.specialAttackStat}</span>
            </div>
          </>
        )}

        {/* 能力ランク */}
        <div className="space-y-1">
          <Label className="text-xs">{isPhysical ? "攻撃" : "特攻"}ランク</Label>
          <Select
            value={(isPhysical ? data.attackRank : data.specialAttackRank).toString()}
            onValueChange={(v: string) => {
              const rank = parseInt(v) as StatStage;
              if (isPhysical) {
                onDataChange({ ...data, attackRank: rank });
              } else {
                onDataChange({ ...data, specialAttackRank: rank });
              }
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAT_STAGES.map((s) => (
                <SelectItem key={s} value={s.toString()}>{s > 0 ? `+${s}` : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 特性 */}
        <div className="space-y-1">
          <Label className="text-xs">特性</Label>
          <Input type="text" value={data.abilityName}
            onChange={(e) => onDataChange({ ...data, abilityName: e.target.value })}
            placeholder="特性名" className="h-8 text-sm" />
        </div>
      </CardContent>
    </Card>
  );
}
