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
import { calcHpStat, calcOtherStat, getAllPokemon, getCompetitiveItemNames } from "@poke-dex-battle/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { NatureModifierCompact, EvPreset, TypeBadges } from "./SharedFormComponents";
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
  idKey: string;
  displayMode: "compact" | "full";
}

export function DefenderInput({ data, onDataChange, idKey, displayMode }: DefenderInputProps) {
  const idPrefix = useMemo(() => generateIdPrefix(data.pokemonName || "defender", idKey), [data.pokemonName, idKey]);

  // useRef で最新の data を保持（useEffect 内のステールクロージャ防止）
  const dataRef = useRef(data);
  dataRef.current = data;

  // EV/IV の内部 state
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

  // 特性オプション
  const abilityOptions = useMemo(() => {
    if (pokemonData?.abilities) {
      return pokemonData.abilities.map((a) => ({
        label: `${a.nameJa}${a.isHidden ? " (夢)" : ""}`,
        value: a.nameJa,
        id: `ability-${a.name}`,
      }));
    }
    return [];
  }, [pokemonData]);

  // 持ち物オプション（競技用のみ）
  const itemOptions = useMemo(() => {
    return getCompetitiveItemNames().map((item) => ({
      label: item.nameJa,
      value: item.nameJa,
      id: `item-${item.id}`,
    }));
  }, []);

  // ポケモンデータ取得時に種族値・タイプ・第1特性を自動反映
  useEffect(() => {
    if (pokemonData?.baseStats) {
      const d = dataRef.current;
      const hpBase = pokemonData.baseStats.hp;
      const defBase = pokemonData.baseStats.defense;
      const spDefBase = pokemonData.baseStats.specialDefense;
      const firstAbility = pokemonData.abilities[0];

      onDataChange({
        ...d,
        hpBaseStat: hpBase,
        defenseBaseStat: defBase,
        specialDefenseBaseStat: spDefBase,
        pokemonTypes: pokemonData.types,
        abilityName: firstAbility?.nameJa ?? "",
        hpStat: calcHpStat(hpBase, hpIv, hpEv, 50),
        defenseStat: calcOtherStat(defBase, defIv, defEv, 50, d.defenseModifier),
        specialDefenseStat: calcOtherStat(spDefBase, spDefIv, spDefEv, 50, d.specialDefenseModifier),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonData]);

  // rerender-derived-state-no-effect: ステータスはイベントハンドラで直接計算

  if (displayMode === "compact") {
    return (
      <Card className="border-t-2 border-t-primary/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {data.pokemonName || "ポケモンを選択"}
          </CardTitle>
          <TypeBadges types={data.pokemonTypes} />
        </CardHeader>
        <CardContent className="space-y-3">
          {/* ポケモン名 */}
          <Autocomplete
            id={`${idPrefix}-pokemon-name`}
            options={pokemonOptions}
            onSelect={(name) => onDataChange({ ...data, pokemonName: name })}
            placeholder="ポケモン名"
            value={data.pokemonName}
          />

          {/* HP */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">HP</Label>
              <span className="text-xs text-muted-foreground">
                実数値: <span className="font-bold text-foreground tabular-nums">{data.hpStat}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">EV</span>
              <EvPreset value={hpEv} onChange={(newEv) => {
                setHpEv(newEv);
                onDataChange({ ...data, hpStat: calcHpStat(data.hpBaseStat, hpIv, newEv, 50) });
              }} />
            </div>
          </div>

          {/* 防御 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">防御</Label>
              <span className="text-xs text-muted-foreground">
                実数値: <span className="font-bold text-foreground tabular-nums">{data.defenseStat}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NatureModifierCompact
                value={data.defenseModifier}
                onChange={(mod) => onDataChange({
                  ...data,
                  defenseModifier: mod,
                  defenseStat: calcOtherStat(data.defenseBaseStat, defIv, defEv, 50, mod),
                })}
              />
              <span className="text-xs text-muted-foreground">EV</span>
              <EvPreset value={defEv} onChange={(newEv) => {
                setDefEv(newEv);
                onDataChange({
                  ...data,
                  defenseStat: calcOtherStat(data.defenseBaseStat, defIv, newEv, 50, data.defenseModifier),
                });
              }} />
            </div>
          </div>

          {/* 特防 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">特防</Label>
              <span className="text-xs text-muted-foreground">
                実数値: <span className="font-bold text-foreground tabular-nums">{data.specialDefenseStat}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NatureModifierCompact
                value={data.specialDefenseModifier}
                onChange={(mod) => onDataChange({
                  ...data,
                  specialDefenseModifier: mod,
                  specialDefenseStat: calcOtherStat(data.specialDefenseBaseStat, spDefIv, spDefEv, 50, mod),
                })}
              />
              <span className="text-xs text-muted-foreground">EV</span>
              <EvPreset value={spDefEv} onChange={(newEv) => {
                setSpDefEv(newEv);
                onDataChange({
                  ...data,
                  specialDefenseStat: calcOtherStat(data.specialDefenseBaseStat, spDefIv, newEv, 50, data.specialDefenseModifier),
                });
              }} />
            </div>
          </div>

          {/* 能力ランク */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">防御ランク</Label>
              <Select value={data.defenseRank.toString()}
                onValueChange={(v: string) => onDataChange({ ...data, defenseRank: parseInt(v) as StatStage })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
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
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
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
            <Autocomplete
              id={`${idPrefix}-ability`}
              options={abilityOptions}
              onSelect={(name) => onDataChange({ ...data, abilityName: name })}
              placeholder="特性"
              value={data.abilityName}
            />
          </div>

          {/* 持ち物 */}
          <div className="space-y-1">
            <Label className="text-xs">持ち物</Label>
            <Autocomplete
              id={`${idPrefix}-item`}
              options={itemOptions}
              onSelect={(name) => onDataChange({ ...data, itemName: name })}
              placeholder="持ち物"
              value={data.itemName}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // displayMode === "full" — 詳細設定（IVのみ）
  return (
    <Card className="border-t-2 border-t-primary/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{data.pokemonName || "防御側"} 詳細</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* HP 個体値 */}
        <div className="space-y-1">
          <Label className="text-xs">HP個体値</Label>
          <Input type="number" min={0} max={31} value={hpIv}
            onChange={(e) => {
              const iv = Math.max(0, Math.min(31, parseInt(e.target.value) || 0));
              setHpIv(iv);
              onDataChange({ ...data, hpStat: calcHpStat(data.hpBaseStat, iv, hpEv, 50) });
            }}
            className="h-7 text-xs" />
        </div>

        {/* 防御個体値 */}
        <div className="space-y-1">
          <Label className="text-xs">防御個体値</Label>
          <Input type="number" min={0} max={31} value={defIv}
            onChange={(e) => {
              const iv = Math.max(0, Math.min(31, parseInt(e.target.value) || 0));
              setDefIv(iv);
              onDataChange({
                ...data,
                defenseStat: calcOtherStat(data.defenseBaseStat, iv, defEv, 50, data.defenseModifier),
              });
            }}
            className="h-7 text-xs" />
        </div>

        {/* 特防個体値 */}
        <div className="space-y-1">
          <Label className="text-xs">特防個体値</Label>
          <Input type="number" min={0} max={31} value={spDefIv}
            onChange={(e) => {
              const iv = Math.max(0, Math.min(31, parseInt(e.target.value) || 0));
              setSpDefIv(iv);
              onDataChange({
                ...data,
                specialDefenseStat: calcOtherStat(data.specialDefenseBaseStat, iv, spDefEv, 50, data.specialDefenseModifier),
              });
            }}
            className="h-7 text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}
