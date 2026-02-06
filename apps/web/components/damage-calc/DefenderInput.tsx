"use client";

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
import { Autocomplete } from "@/components/ui/autocomplete";
import { usePokemonSearch } from "@/hooks/usePokemonSearch";
import { useItemSearch } from "@/hooks/useItemSearch";
import { useAbilitySearch } from "@/hooks/useAbilitySearch";
import type { PokemonType, StatStage } from "@poke-dex-battle/shared";
import { calcHpStat, pokemonNameMap } from "@poke-dex-battle/shared";
import { useEffect, useState, useMemo } from "react";
import { NatureModifierRadio } from "./NatureModifierRadio";
import { PokemonStatInput } from "./PokemonStatInput";

const STAT_STAGES: StatStage[] = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

interface DefenderInputProps {
  onDataChange: (data: DefenderData) => void;
}

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

export function DefenderInput({ onDataChange }: DefenderInputProps) {
  const [pokemonName, setPokemonName] = useState("");
  const [pokemonTypes, setPokemonTypes] = useState<PokemonType[]>([]);

  const [hpBaseStat, setHpBaseStat] = useState(100);
  const [defenseBaseStat, setDefenseBaseStat] = useState(100);
  const [specialDefenseBaseStat, setSpecialDefenseBaseStat] = useState(100);

  const [hpStat, setHpStat] = useState(207);
  const [defenseStat, setDefenseStat] = useState(152);
  const [specialDefenseStat, setSpecialDefenseStat] = useState(152);

  const [defenseModifier, setDefenseModifier] = useState<1.1 | 1.0 | 0.9>(1.0);
  const [specialDefenseModifier, setSpecialDefenseModifier] = useState<
    1.1 | 1.0 | 0.9
  >(1.0);

  const [defenseRank, setDefenseRank] = useState<StatStage>(0);
  const [specialDefenseRank, setSpecialDefenseRank] = useState<StatStage>(0);
  const [abilityName, setAbilityName] = useState("");
  const [itemName, setItemName] = useState("");

  const [hpMode, setHpMode] = useState<"manual" | "auto">("auto");
  const [hpIv, setHpIv] = useState(31);
  const [hpEv, setHpEv] = useState(252);

  const { data: pokemonData, loading, error } = usePokemonSearch(pokemonName);
  const { data: abilityData } = useAbilitySearch(abilityName);
  const { data: itemData } = useItemSearch(itemName);

  // ポケモン名のオプションリストを生成（重複を避ける）
  const pokemonOptions = useMemo(() => {
    const seen = new Set<number>();
    return Object.values(pokemonNameMap)
      .filter((pokemon) => {
        if (seen.has(pokemon.id)) {
          return false;
        }
        seen.add(pokemon.id);
        return true;
      })
      .map((pokemon) => ({
        label: pokemon.japaneseName,
        value: pokemon.englishName,
        id: `pokemon-${pokemon.id}`,
      }));
  }, []);

  // PokéAPIからデータを取得したら種族値とタイプを自動反映
  useEffect(() => {
    if (pokemonData?.baseStats) {
      setHpBaseStat(pokemonData.baseStats.hp);
      setDefenseBaseStat(pokemonData.baseStats.defense);
      setSpecialDefenseBaseStat(pokemonData.baseStats.specialDefense);
      setPokemonTypes(pokemonData.types);
      notifyChange({
        hpBaseStat: pokemonData.baseStats.hp,
        defenseBaseStat: pokemonData.baseStats.defense,
        specialDefenseBaseStat: pokemonData.baseStats.specialDefense,
        pokemonTypes: pokemonData.types,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonData]);

  const notifyChange = (updates: Partial<DefenderData>) => {
    const data: DefenderData = {
      pokemonName,
      pokemonTypes,
      hpBaseStat,
      defenseBaseStat,
      specialDefenseBaseStat,
      hpStat,
      defenseStat,
      specialDefenseStat,
      defenseModifier,
      specialDefenseModifier,
      defenseRank,
      specialDefenseRank,
      abilityName,
      itemName,
      ...updates,
    };
    onDataChange(data);
  };

  const calculateHp = (base: number, iv: number, ev: number) => {
    return calcHpStat(base, iv, ev, 50);
  };

  // HP種族値が変更されたら自動で再計算
  useEffect(() => {
    if (hpMode === "auto") {
      const calculated = calculateHp(hpBaseStat, hpIv, hpEv);
      setHpStat(calculated);
      notifyChange({ hpStat: calculated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hpBaseStat, hpMode, hpIv, hpEv]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>防御側</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="defender-pokemon-name">ポケモン名</Label>
          <Autocomplete
            id="defender-pokemon-name"
            options={pokemonOptions}
            onSelect={(selectedValue) => {
              setPokemonName(selectedValue);
              notifyChange({ pokemonName: selectedValue });
            }}
            placeholder="ポケモン名を入力"
          />
        </div>

        {/* HP */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">HP</h3>
          <div className="space-y-2">
            <Label htmlFor="hp-base-stat">HP種族値</Label>
            <Input
              id="hp-base-stat"
              type="number"
              min={1}
              max={255}
              value={hpBaseStat}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = parseInt(e.target.value) || 1;
                setHpBaseStat(value);
                if (hpMode === "auto") {
                  const calculated = calculateHp(value, hpIv, hpEv);
                  setHpStat(calculated);
                  notifyChange({ hpBaseStat: value, hpStat: calculated });
                } else {
                  notifyChange({ hpBaseStat: value });
                }
              }}
            />
          </div>

          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label>HP</Label>
              <button
                type="button"
                className="text-xs px-2 py-1 border rounded hover:bg-accent"
                onClick={() => {
                  if (hpMode === "manual") {
                    const calculated = calculateHp(hpBaseStat, hpIv, hpEv);
                    setHpStat(calculated);
                    setHpMode("auto");
                    notifyChange({ hpStat: calculated });
                  } else {
                    setHpMode("manual");
                  }
                }}
              >
                {hpMode === "manual" ? "自動計算に切替" : "手動入力に切替"}
              </button>
            </div>

            {hpMode === "manual" ? (
              <Input
                type="number"
                min={1}
                value={hpStat}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value) || 1;
                  setHpStat(value);
                  notifyChange({ hpStat: value });
                }}
                placeholder="実数値を入力"
              />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="hp-iv" className="text-xs">
                      個体値 (IV)
                    </Label>
                    <Input
                      id="hp-iv"
                      type="number"
                      min={0}
                      max={31}
                      value={hpIv}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = Math.max(
                          0,
                          Math.min(31, parseInt(e.target.value) || 0)
                        );
                        setHpIv(value);
                        const calculated = calculateHp(hpBaseStat, value, hpEv);
                        setHpStat(calculated);
                        notifyChange({ hpStat: calculated });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hp-ev" className="text-xs">
                      努力値 (EV)
                    </Label>
                    <Input
                      id="hp-ev"
                      type="number"
                      min={0}
                      max={252}
                      step={4}
                      value={hpEv}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = Math.max(
                          0,
                          Math.min(252, parseInt(e.target.value) || 0)
                        );
                        setHpEv(value);
                        const calculated = calculateHp(hpBaseStat, hpIv, value);
                        setHpStat(calculated);
                        notifyChange({ hpStat: calculated });
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  実数値:{" "}
                  <span className="font-bold text-foreground">{hpStat}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 防御 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">防御</h3>
          <div className="space-y-2">
            <Label htmlFor="defense-base-stat">防御種族値</Label>
            <Input
              id="defense-base-stat"
              type="number"
              min={1}
              max={255}
              value={defenseBaseStat}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = parseInt(e.target.value) || 1;
                setDefenseBaseStat(value);
                notifyChange({ defenseBaseStat: value });
              }}
            />
          </div>

          <div className="space-y-3 p-4 border rounded-lg">
            <NatureModifierRadio
              statName="防御"
              value={defenseModifier}
              onChange={(modifier) => {
                setDefenseModifier(modifier);
                notifyChange({ defenseModifier: modifier });
              }}
            />
            <PokemonStatInput
              label="防御"
              statType="defense"
              level={50}
              natureModifier={defenseModifier}
              baseStat={defenseBaseStat}
              value={defenseStat}
              onChange={(value) => {
                setDefenseStat(value);
                notifyChange({ defenseStat: value });
              }}
            />
          </div>
        </div>

        {/* 特防 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">特防</h3>
          <div className="space-y-2">
            <Label htmlFor="special-defense-base-stat">特防種族値</Label>
            <Input
              id="special-defense-base-stat"
              type="number"
              min={1}
              max={255}
              value={specialDefenseBaseStat}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = parseInt(e.target.value) || 1;
                setSpecialDefenseBaseStat(value);
                notifyChange({ specialDefenseBaseStat: value });
              }}
            />
          </div>

          <div className="space-y-3 p-4 border rounded-lg">
            <NatureModifierRadio
              statName="特防"
              value={specialDefenseModifier}
              onChange={(modifier) => {
                setSpecialDefenseModifier(modifier);
                notifyChange({ specialDefenseModifier: modifier });
              }}
            />
            <PokemonStatInput
              label="特防"
              statType="specialDefense"
              level={50}
              natureModifier={specialDefenseModifier}
              baseStat={specialDefenseBaseStat}
              value={specialDefenseStat}
              onChange={(value) => {
                setSpecialDefenseStat(value);
                notifyChange({ specialDefenseStat: value });
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">能力ランク</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="defense-rank">防御ランク</Label>
              <Select
                value={defenseRank.toString()}
                onValueChange={(value: string) => {
                  const rank = parseInt(value) as StatStage;
                  setDefenseRank(rank);
                  notifyChange({ defenseRank: rank });
                }}
              >
                <SelectTrigger id="defense-rank">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAT_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage.toString()}>
                      {stage > 0 ? `+${stage}` : stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="special-defense-rank">特防ランク</Label>
              <Select
                value={specialDefenseRank.toString()}
                onValueChange={(value: string) => {
                  const rank = parseInt(value) as StatStage;
                  setSpecialDefenseRank(rank);
                  notifyChange({ specialDefenseRank: rank });
                }}
              >
                <SelectTrigger id="special-defense-rank">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAT_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage.toString()}>
                      {stage > 0 ? `+${stage}` : stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">その他</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="defender-ability">特性</Label>
              <Input
                id="defender-ability"
                type="text"
                value={abilityName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setAbilityName(e.target.value);
                  notifyChange({ abilityName: e.target.value });
                }}
                placeholder="特性名を入力"
              />
              {abilityData && (
                <p className="text-xs text-muted-foreground">
                  {abilityData.japaneseName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="defender-item">持ち物</Label>
              <Input
                id="defender-item"
                type="text"
                value={itemName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setItemName(e.target.value);
                  notifyChange({ itemName: e.target.value });
                }}
                placeholder="持ち物名を入力"
              />
              {itemData && (
                <p className="text-xs text-muted-foreground">
                  {itemData.japaneseName}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
