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
import { useAbilitySearch } from "@/hooks/useAbilitySearch";
import { useHydrationSafe } from "@/hooks/useHydrationSafe";
import { useItemSearch } from "@/hooks/useItemSearch";
import { usePokemonSearch } from "@/hooks/usePokemonSearch";
import type { PokemonType, StatStage } from "@poke-dex-battle/shared";
import { getAllPokemon } from "@poke-dex-battle/shared";
import { useEffect, useMemo, useState } from "react";
import { MoveInput } from "./MoveInput";
import { NatureModifierRadio } from "./NatureModifierRadio";
import { PokemonStatInput } from "./PokemonStatInput";

const STAT_STAGES: StatStage[] = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

/**
 * Generates a unique ID prefix from the title by converting to lowercase and replacing non-alphanumeric chars
 */
function generateIdPrefix(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
}

interface AttackerInputProps {
  onDataChange: (data: AttackerData) => void;
  title: string;
}

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

export function AttackerInput({ onDataChange, title }: AttackerInputProps) {
  const isMounted = useHydrationSafe();
  const idPrefix = useMemo(() => generateIdPrefix(title), [title]);
  const [pokemonName, setPokemonName] = useState("");
  const [pokemonTypes, setPokemonTypes] = useState<PokemonType[]>([]);
  const [moveName, setMoveName] = useState("");
  const [movePower, setMovePower] = useState(80);
  const [moveType, setMoveType] = useState<PokemonType>("Normal");
  const [moveCategory, setMoveCategory] = useState<"Physical" | "Special">(
    "Physical"
  );

  const [attackBaseStat, setAttackBaseStat] = useState(100);
  const [specialAttackBaseStat, setSpecialAttackBaseStat] = useState(100);

  const [attackModifier, setAttackModifier] = useState<1.1 | 1.0 | 0.9>(1.0);
  const [specialAttackModifier, setSpecialAttackModifier] = useState<
    1.1 | 1.0 | 0.9
  >(1.0);

  const [attackStat, setAttackStat] = useState(152);
  const [specialAttackStat, setSpecialAttackStat] = useState(152);

  const [attackRank, setAttackRank] = useState<StatStage>(0);
  const [specialAttackRank, setSpecialAttackRank] = useState<StatStage>(0);
  const [abilityName, setAbilityName] = useState("");
  const [itemName, setItemName] = useState("");

  const { data: pokemonData } = usePokemonSearch(pokemonName);
  const { data: abilityData } = useAbilitySearch(abilityName);
  const { data: itemData } = useItemSearch(itemName);

  // ポケモン名のオプションリストを生成
  const pokemonOptions = useMemo(() => {
    return getAllPokemon().map((pokemon) => ({
      label: pokemon.nameJa,
      value: pokemon.nameJa,
      id: `pokemon-${pokemon.id}`,
    }));
  }, []);

  // ポケモンデータを取得したら種族値・タイプ・第1特性を自動反映
  useEffect(() => {
    if (pokemonData?.baseStats) {
      setAttackBaseStat(pokemonData.baseStats.attack);
      setSpecialAttackBaseStat(pokemonData.baseStats.specialAttack);
      setPokemonTypes(pokemonData.types);

      // 第1特性を自動入力
      const firstAbility = pokemonData.abilities[0];
      if (firstAbility) {
        setAbilityName(firstAbility.nameJa);
      }

      notifyChange({
        attackBaseStat: pokemonData.baseStats.attack,
        specialAttackBaseStat: pokemonData.baseStats.specialAttack,
        pokemonTypes: pokemonData.types,
        abilityName: firstAbility?.nameJa ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonData]);

  // データが変更されたら親に通知
  const notifyChange = (updates: Partial<AttackerData>) => {
    const data: AttackerData = {
      pokemonName,
      pokemonTypes,
      moveName,
      movePower,
      moveType,
      moveCategory,
      attackBaseStat,
      specialAttackBaseStat,
      attackStat,
      specialAttackStat,
      attackModifier,
      specialAttackModifier,
      attackRank,
      specialAttackRank,
      abilityName,
      itemName,
      ...updates,
    };
    onDataChange(data);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ポケモン名 */}
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-pokemon-name`}>ポケモン名</Label>
          <Autocomplete
            id={`${idPrefix}-pokemon-name`}
            options={pokemonOptions}
            onSelect={(selectedValue) => {
              setPokemonName(selectedValue);
              notifyChange({ pokemonName: selectedValue });
            }}
            placeholder="ポケモン名を入力"
          />
        </div>

        {/* 技情報 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">技情報</h3>
          <MoveInput
            pokemonName={pokemonName}
            moveName={moveName}
            movePower={movePower}
            moveType={moveType}
            moveCategory={moveCategory}
            onMoveNameChange={(name) => {
              setMoveName(name);
              notifyChange({ moveName: name });
            }}
            onMovePowerChange={(power) => {
              setMovePower(power);
              notifyChange({ movePower: power });
            }}
            onMoveTypeChange={(type) => {
              setMoveType(type);
              notifyChange({ moveType: type });
            }}
            onMoveCategoryChange={(category) => {
              setMoveCategory(category);
              notifyChange({ moveCategory: category });
            }}
          />
        </div>

        {/* 種族値 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">種族値</h3>
          <div>
              {moveCategory === "Physical" ? (
                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-attack-base-stat`}>攻撃種族値</Label>
                  <Input
                    id={`${idPrefix}-attack-base-stat`}
                    type="number"
                    min={1}
                    max={255}
                    value={attackBaseStat}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = parseInt(e.target.value) || 1;
                      setAttackBaseStat(value);
                      notifyChange({ attackBaseStat: value });
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-special-attack-base-stat`}>特攻種族値</Label>
                  <Input
                    id={`${idPrefix}-special-attack-base-stat`}
                    type="number"
                    min={1}
                    max={255}
                    value={specialAttackBaseStat}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = parseInt(e.target.value) || 1;
                      setSpecialAttackBaseStat(value);
                      notifyChange({ specialAttackBaseStat: value });
                    }}
                  />
                </div>
              )}
          </div>
        </div>

        {/* ステータス実数値 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">ステータス実数値</h3>
          <div>
              {moveCategory === "Physical" ? (
                <div className="space-y-3 p-4 border rounded-lg">
                  <NatureModifierRadio
                    statName="攻撃"
                    value={attackModifier}
                    onChange={(modifier) => {
                      setAttackModifier(modifier);
                      notifyChange({ attackModifier: modifier });
                    }}
                  />
                  <PokemonStatInput
                    label="攻撃"
                    statType="attack"
                    level={50}
                    natureModifier={attackModifier}
                    baseStat={attackBaseStat}
                    value={attackStat}
                    onChange={(value) => {
                      setAttackStat(value);
                      notifyChange({ attackStat: value });
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-3 p-4 border rounded-lg">
                  <NatureModifierRadio
                    statName="特攻"
                    value={specialAttackModifier}
                    onChange={(modifier) => {
                      setSpecialAttackModifier(modifier);
                      notifyChange({ specialAttackModifier: modifier });
                    }}
                  />
                  <PokemonStatInput
                    label="特攻"
                    statType="specialAttack"
                    level={50}
                    natureModifier={specialAttackModifier}
                    baseStat={specialAttackBaseStat}
                    value={specialAttackStat}
                    onChange={(value) => {
                      setSpecialAttackStat(value);
                      notifyChange({ specialAttackStat: value });
                    }}
                  />
                </div>
              )}
          </div>
        </div>

        {/* 能力ランク */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">能力ランク</h3>
          <div>
              {moveCategory === "Physical" ? (
                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-attack-rank`}>攻撃ランク</Label>
                  <Select
                    value={attackRank.toString()}
                    onValueChange={(value: string) => {
                      const rank = parseInt(value) as StatStage;
                      setAttackRank(rank);
                      notifyChange({ attackRank: rank });
                    }}
                  >
                    <SelectTrigger id={`${idPrefix}-attack-rank`}>
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
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-special-attack-rank`}>特攻ランク</Label>
                  <Select
                    value={specialAttackRank.toString()}
                    onValueChange={(value: string) => {
                      const rank = parseInt(value) as StatStage;
                      setSpecialAttackRank(rank);
                      notifyChange({ specialAttackRank: rank });
                    }}
                  >
                    <SelectTrigger id={`${idPrefix}-special-attack-rank`}>
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
              )}
          </div>
        </div>

        {/* その他 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">その他</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-ability`}>特性</Label>
              <Input
                id={`${idPrefix}-ability`}
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
                  {abilityData.nameJa}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-item`}>持ち物</Label>
              <Input
                id={`${idPrefix}-item`}
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
                  {itemData.nameJa}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
