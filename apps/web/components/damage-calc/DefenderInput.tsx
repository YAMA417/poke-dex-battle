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
import { calcHpStat, calcOtherStat, getAllPokemon } from "@poke-dex-battle/shared";
import { useEffect, useMemo, useState } from "react";
import { NatureModifierCompact, EvPreset } from "./AttackerInput";
import { NatureModifierRadio } from "./NatureModifierRadio";
import { generateIdPrefix } from "@/utils/id";

const STAT_STAGES: StatStage[] = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

export interface DefenderData {
  pokemonName: string;
  pokemonTypes: PokemonType[];
  hpBaseStat: number;
  defenseBaseStat: number;
  specialDefenseBaseStat: number;
  hpStat: number;
  defenseStat: number;
  specialDefenseStat: number;
  defenseModifier: 1.1 | 1.0 | 0.9;
  specialDefenseModifier: 1.1 | 1.0 | 0.9;
  defenseRank: StatStage;
  specialDefenseRank: StatStage;
  abilityName: string;
  itemName: string;
}

interface DefenderInputProps {
  data: DefenderData;
  onDataChange: (data: DefenderData) => void;
  title: string;
  idKey: string;
  displayMode: "compact" | "full";
}

export function DefenderInput({ data, onDataChange, title, idKey, displayMode }: DefenderInputProps) {
  const idPrefix = useMemo(() => generateIdPrefix(title, idKey), [title, idKey]);

  // full モード用の内部 state
  const [hpEv, setHpEv] = useState(252);
  const [hpIv, setHpIv] = useState(31);
  const [defEv, setDefEv] = useState(252);
  const [defIv, setDefIv] = useState(31);
  const [spDefEv, setSpDefEv] = useState(252);
  const [spDefIv, setSpDefIv] = useState(31);

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
      const hpBase = pokemonData.baseStats.hp;
      const defBase = pokemonData.baseStats.defense;
      const spDefBase = pokemonData.baseStats.specialDefense;
      const firstAbility = pokemonData.abilities[0];

      onDataChange({
        ...data,
        hpBaseStat: hpBase,
        defenseBaseStat: defBase,
        specialDefenseBaseStat: spDefBase,
        pokemonTypes: pokemonData.types,
        abilityName: firstAbility?.nameJa ?? "",
        hpStat: calcHpStat(hpBase, hpIv, hpEv, 50),
        defenseStat: calcOtherStat(defBase, defIv, defEv, 50, data.defenseModifier),
        specialDefenseStat: calcOtherStat(spDefBase, spDefIv, spDefEv, 50, data.specialDefenseModifier),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonData]);

  // EV/IV/modifier 変更時にステータス再計算
  useEffect(() => {
    const newHp = calcHpStat(data.hpBaseStat, hpIv, hpEv, 50);
    const newDef = calcOtherStat(data.defenseBaseStat, defIv, defEv, 50, data.defenseModifier);
    const newSpDef = calcOtherStat(data.specialDefenseBaseStat, spDefIv, spDefEv, 50, data.specialDefenseModifier);
    if (newHp !== data.hpStat || newDef !== data.defenseStat || newSpDef !== data.specialDefenseStat) {
      onDataChange({ ...data, hpStat: newHp, defenseStat: newDef, specialDefenseStat: newSpDef });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hpEv, hpIv, defEv, defIv, spDefEv, spDefIv, data.defenseModifier, data.specialDefenseModifier, data.hpBaseStat, data.defenseBaseStat, data.specialDefenseBaseStat]);

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
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">防御補正</Label>
              <NatureModifierCompact
                value={data.defenseModifier}
                onChange={(mod) => onDataChange({ ...data, defenseModifier: mod })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">特防補正</Label>
              <NatureModifierCompact
                value={data.specialDefenseModifier}
                onChange={(mod) => onDataChange({ ...data, specialDefenseModifier: mod })}
              />
            </div>
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
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* HP */}
        <EvPreset label="HP" value={hpEv} onChange={setHpEv} />
        <div className="space-y-1">
          <Label className="text-xs">HP個体値</Label>
          <Input type="number" min={0} max={31} value={hpIv}
            onChange={(e) => setHpIv(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
            className="h-7 text-xs" />
        </div>
        <div className="text-sm text-muted-foreground">
          HP実数値: <span className="font-bold text-foreground">{data.hpStat}</span>
        </div>

        {/* 防御 */}
        <EvPreset label="防御" value={defEv} onChange={setDefEv} />
        <div className="space-y-1">
          <Label className="text-xs">防御個体値</Label>
          <Input type="number" min={0} max={31} value={defIv}
            onChange={(e) => setDefIv(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
            className="h-7 text-xs" />
        </div>
        <NatureModifierRadio statName="防御" value={data.defenseModifier}
          onChange={(mod) => onDataChange({ ...data, defenseModifier: mod })} />
        <div className="text-sm text-muted-foreground">
          防御実数値: <span className="font-bold text-foreground">{data.defenseStat}</span>
        </div>

        {/* 特防 */}
        <EvPreset label="特防" value={spDefEv} onChange={setSpDefEv} />
        <div className="space-y-1">
          <Label className="text-xs">特防個体値</Label>
          <Input type="number" min={0} max={31} value={spDefIv}
            onChange={(e) => setSpDefIv(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
            className="h-7 text-xs" />
        </div>
        <NatureModifierRadio statName="特防" value={data.specialDefenseModifier}
          onChange={(mod) => onDataChange({ ...data, specialDefenseModifier: mod })} />
        <div className="text-sm text-muted-foreground">
          特防実数値: <span className="font-bold text-foreground">{data.specialDefenseStat}</span>
        </div>

        {/* 能力ランク */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">防御ランク</Label>
            <Select value={data.defenseRank.toString()}
              onValueChange={(v: string) => onDataChange({ ...data, defenseRank: parseInt(v) as StatStage })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAT_STAGES.map((s) => (
                  <SelectItem key={s} value={s.toString()}>{s > 0 ? `+${s}` : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">特防ランク</Label>
            <Select value={data.specialDefenseRank.toString()}
              onValueChange={(v: string) => onDataChange({ ...data, specialDefenseRank: parseInt(v) as StatStage })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAT_STAGES.map((s) => (
                  <SelectItem key={s} value={s.toString()}>{s > 0 ? `+${s}` : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
