'use client';

import { Autocomplete } from '@/components/ui/autocomplete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllPokemon, useAllItems, useMoveByName } from '@/hooks/useApiData';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import type { PokemonType, StatStage } from '@poke-dex-battle/shared';
import { calcOtherStat, reverseCalcOtherEv, getMoveFlags } from '@poke-dex-battle/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MoveInput } from './MoveInput';
import { NatureModifierCompact, EvPreset, TypeBadges } from './SharedFormComponents';
import { generateIdPrefix } from '@/utils/id';

const STAT_STAGES: StatStage[] = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

// --- 型定義 ---

export interface AttackerData {
  pokemonName: string;
  pokemonTypes: PokemonType[];
  moveName: string;
  movePower: number;
  moveType: PokemonType;
  moveCategory: 'Physical' | 'Special';
  moveTarget: string;
  attackBaseStat: number;
  specialAttackBaseStat: number;
  defenseBaseStat: number;
  attackStat: number;
  specialAttackStat: number;
  defenseStat: number;
  attackModifier: 1.1 | 1.0 | 0.9;
  specialAttackModifier: 1.1 | 1.0 | 0.9;
  defenseModifier: 1.1 | 1.0 | 0.9;
  attackRank: StatStage;
  specialAttackRank: StatStage;
  defenseRank: StatStage;
  abilityName: string;
  itemName: string;
  isBurned: boolean;
}

interface AttackerInputProps {
  data: AttackerData;
  onDataChange: (data: AttackerData) => void;
  idKey: string;
  displayMode: 'compact' | 'full';
}

// --- メインコンポーネント ---

export function AttackerInput({ data, onDataChange, idKey, displayMode }: AttackerInputProps) {
  const idPrefix = useMemo(
    () => generateIdPrefix(data.pokemonName || 'attacker', idKey),
    [data.pokemonName, idKey]
  );

  // useRef で最新の data と onDataChange を保持（useEffect 内のステールクロージャ防止）
  const dataRef = useRef(data);
  dataRef.current = data;
  const onDataChangeRef = useRef(onDataChange);
  onDataChangeRef.current = onDataChange;

  // EV/IV の内部 state
  const [attackEv, setAttackEv] = useState(252);
  const [attackIv, setAttackIv] = useState(31);
  const [spAtkEv, setSpAtkEv] = useState(252);
  const [spAtkIv, setSpAtkIv] = useState(31);
  const [defEv, setDefEv] = useState(0);
  const [defIv, setDefIv] = useState(31);

  const { data: pokemonData } = usePokemonSearch(data.pokemonName);

  const { data: allPokemon } = useAllPokemon('sv-reg-i');
  const pokemonOptions = useMemo(() => {
    return (allPokemon ?? []).map((pokemon) => ({
      label: pokemon.nameJa,
      value: pokemon.nameJa,
      id: `pokemon-${pokemon.id}`,
    }));
  }, [allPokemon]);

  // 特性オプション（ポケモン選択時にそのポケモンの特性のみ）
  const abilityOptions = useMemo(() => {
    if (pokemonData?.abilities) {
      return pokemonData.abilities.map((a) => ({
        label: `${a.nameJa}${a.isHidden ? ' (夢)' : ''}`,
        value: a.nameJa,
        id: `ability-${a.name}`,
      }));
    }
    return [];
  }, [pokemonData]);

  // スプライトURL
  const spriteUrl = pokemonData?.spriteUrl;

  // 持ち物オプション（競技用のみ）
  const { data: allItems } = useAllItems();
  const itemOptions = useMemo(() => {
    return (allItems ?? []).map((item) => ({
      label: item.nameJa,
      value: item.nameJa,
      id: `item-${item.id}`,
    }));
  }, [allItems]);

  // ポケモンデータ取得時に種族値・タイプ・第1特性を自動反映
  useEffect(() => {
    if (pokemonData?.baseStats) {
      const d = dataRef.current;
      const atkBase = pokemonData.baseStats.attack;
      const spAtkBase = pokemonData.baseStats.specialAttack;
      const defBase = pokemonData.baseStats.defense;
      const firstAbility = pokemonData.abilities[0];

      onDataChangeRef.current({
        ...d,
        attackBaseStat: atkBase,
        specialAttackBaseStat: spAtkBase,
        defenseBaseStat: defBase,
        pokemonTypes: pokemonData.types,
        abilityName: firstAbility?.nameJa ?? '',
        attackStat: calcOtherStat(atkBase, attackIv, attackEv, 50, d.attackModifier),
        specialAttackStat: calcOtherStat(spAtkBase, spAtkIv, spAtkEv, 50, d.specialAttackModifier),
        defenseStat: calcOtherStat(defBase, defIv, defEv, 50, d.defenseModifier),
      });
    }
  }, [pokemonData, attackIv, attackEv, spAtkIv, spAtkEv, defIv, defEv]);

  // rerender-derived-state-no-effect: ステータスはイベントハンドラで直接計算
  const isPhysical = data.moveCategory === 'Physical';

  // 特殊技フラグの判定（ボディプレス等）
  const { data: moveData } = useMoveByName(data.moveName || null);
  const moveFlags = moveData ? getMoveFlags(moveData.name, moveData.shortDesc) : null;
  const usesDefenseAsAttack = moveFlags?.usesDefenseAsAttack ?? false;

  // ボディプレス時は防御ステータスを使用
  const currentModifier = usesDefenseAsAttack
    ? data.defenseModifier
    : isPhysical
      ? data.attackModifier
      : data.specialAttackModifier;
  const currentStat = usesDefenseAsAttack
    ? data.defenseStat
    : isPhysical
      ? data.attackStat
      : data.specialAttackStat;
  const statLabel = usesDefenseAsAttack ? '防御→攻撃' : isPhysical ? '攻撃' : '特攻';

  if (displayMode === 'compact') {
    return (
      <Card className="border-t-2 border-t-primary/60">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {spriteUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={spriteUrl} alt={data.pokemonName} width={40} height={40} className="shrink-0" />
            )}
            <div>
              <CardTitle className="text-base">{data.pokemonName || 'ポケモンを選択'}</CardTitle>
              <TypeBadges types={data.pokemonTypes} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* ポケモン名 */}
          <Autocomplete
            id={`${idPrefix}-pokemon-name`}
            options={pokemonOptions}
            onSelect={(name) => onDataChange({ ...data, pokemonName: name })}
            onClear={() =>
              onDataChange({ ...data, pokemonName: '', pokemonTypes: [], abilityName: '' })
            }
            placeholder="ポケモン名"
            value={data.pokemonName}
          />

          {/* 技名 */}
          <MoveInput
            pokemonName={data.pokemonName}
            moveName={data.moveName}
            movePower={data.movePower}
            moveType={data.moveType}
            moveCategory={data.moveCategory}
            onMoveSelect={(move) =>
              onDataChange({
                ...data,
                moveName: move.name,
                movePower: move.power,
                moveType: move.type,
                moveCategory: move.category,
                moveTarget: move.target,
              })
            }
            onMovePowerChange={(power) => onDataChange({ ...data, movePower: power })}
            onMoveTypeChange={(type) => onDataChange({ ...data, moveType: type })}
            onMoveCategoryChange={(cat) => onDataChange({ ...data, moveCategory: cat })}
            compact
          />

          {/* 性格補正 + EV + 実数値 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{statLabel}</Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">実数値:</span>
                <Input
                  type="number"
                  min={1}
                  value={currentStat}
                  onChange={(e) => {
                    const targetStat = Math.max(1, parseInt(e.target.value) || 1);
                    if (usesDefenseAsAttack) {
                      const newEv = reverseCalcOtherEv(
                        targetStat,
                        data.defenseBaseStat,
                        defIv,
                        50,
                        data.defenseModifier
                      );
                      const actualStat = calcOtherStat(
                        data.defenseBaseStat,
                        defIv,
                        newEv,
                        50,
                        data.defenseModifier
                      );
                      setDefEv(newEv);
                      onDataChange({ ...data, defenseStat: actualStat });
                    } else {
                      const baseStat = isPhysical
                        ? data.attackBaseStat
                        : data.specialAttackBaseStat;
                      const iv = isPhysical ? attackIv : spAtkIv;
                      const mod = isPhysical ? data.attackModifier : data.specialAttackModifier;
                      const newEv = reverseCalcOtherEv(targetStat, baseStat, iv, 50, mod);
                      const actualStat = calcOtherStat(baseStat, iv, newEv, 50, mod);
                      if (isPhysical) {
                        setAttackEv(newEv);
                        onDataChange({ ...data, attackStat: actualStat });
                      } else {
                        setSpAtkEv(newEv);
                        onDataChange({ ...data, specialAttackStat: actualStat });
                      }
                    }
                  }}
                  className="h-6 w-16 text-right text-xs font-bold tabular-nums"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NatureModifierCompact
                value={currentModifier}
                onChange={(mod) => {
                  if (usesDefenseAsAttack) {
                    onDataChange({
                      ...data,
                      defenseModifier: mod,
                      defenseStat: calcOtherStat(data.defenseBaseStat, defIv, defEv, 50, mod),
                    });
                  } else if (isPhysical) {
                    onDataChange({
                      ...data,
                      attackModifier: mod,
                      attackStat: calcOtherStat(data.attackBaseStat, attackIv, attackEv, 50, mod),
                    });
                  } else {
                    onDataChange({
                      ...data,
                      specialAttackModifier: mod,
                      specialAttackStat: calcOtherStat(
                        data.specialAttackBaseStat,
                        spAtkIv,
                        spAtkEv,
                        50,
                        mod
                      ),
                    });
                  }
                }}
              />
              <span className="text-xs text-muted-foreground">EV</span>
              <EvPreset
                value={usesDefenseAsAttack ? defEv : isPhysical ? attackEv : spAtkEv}
                onChange={(newEv) => {
                  if (usesDefenseAsAttack) {
                    setDefEv(newEv);
                    onDataChange({
                      ...data,
                      defenseStat: calcOtherStat(
                        data.defenseBaseStat,
                        defIv,
                        newEv,
                        50,
                        data.defenseModifier
                      ),
                    });
                  } else if (isPhysical) {
                    setAttackEv(newEv);
                    onDataChange({
                      ...data,
                      attackStat: calcOtherStat(
                        data.attackBaseStat,
                        attackIv,
                        newEv,
                        50,
                        data.attackModifier
                      ),
                    });
                  } else {
                    setSpAtkEv(newEv);
                    onDataChange({
                      ...data,
                      specialAttackStat: calcOtherStat(
                        data.specialAttackBaseStat,
                        spAtkIv,
                        newEv,
                        50,
                        data.specialAttackModifier
                      ),
                    });
                  }
                }}
                calcStatFn={(ev) => {
                  if (usesDefenseAsAttack) {
                    return calcOtherStat(data.defenseBaseStat, defIv, ev, 50, data.defenseModifier);
                  }
                  return calcOtherStat(
                    isPhysical ? data.attackBaseStat : data.specialAttackBaseStat,
                    isPhysical ? attackIv : spAtkIv,
                    ev,
                    50,
                    isPhysical ? data.attackModifier : data.specialAttackModifier
                  );
                }}
              />
            </div>
          </div>

          {/* 能力ランク */}
          <div className="space-y-1">
            <Label className="text-xs">{statLabel}ランク</Label>
            <Select
              value={(usesDefenseAsAttack
                ? data.defenseRank
                : isPhysical
                  ? data.attackRank
                  : data.specialAttackRank
              ).toString()}
              onValueChange={(v: string) => {
                const rank = parseInt(v) as StatStage;
                if (usesDefenseAsAttack) {
                  onDataChange({ ...data, defenseRank: rank });
                } else if (isPhysical) {
                  onDataChange({ ...data, attackRank: rank });
                } else {
                  onDataChange({ ...data, specialAttackRank: rank });
                }
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAT_STAGES.map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    {s > 0 ? `+${s}` : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* やけど */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${idPrefix}-burned`}
              checked={data.isBurned}
              onCheckedChange={(checked: boolean) =>
                onDataChange({ ...data, isBurned: checked === true })
              }
            />
            <Label htmlFor={`${idPrefix}-burned`} className="cursor-pointer text-xs font-normal">
              やけど（物理攻撃0.5倍）
            </Label>
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
        <CardTitle className="text-sm">{data.pokemonName || '攻撃側'} 詳細</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 個体値 */}
        <div className="space-y-1">
          <Label className="text-xs">{statLabel}個体値</Label>
          <Input
            type="number"
            min={0}
            max={31}
            value={usesDefenseAsAttack ? defIv : isPhysical ? attackIv : spAtkIv}
            onChange={(e) => {
              const iv = Math.max(0, Math.min(31, parseInt(e.target.value) || 0));
              if (usesDefenseAsAttack) {
                setDefIv(iv);
                onDataChange({
                  ...data,
                  defenseStat: calcOtherStat(
                    data.defenseBaseStat,
                    iv,
                    defEv,
                    50,
                    data.defenseModifier
                  ),
                });
              } else if (isPhysical) {
                setAttackIv(iv);
                onDataChange({
                  ...data,
                  attackStat: calcOtherStat(
                    data.attackBaseStat,
                    iv,
                    attackEv,
                    50,
                    data.attackModifier
                  ),
                });
              } else {
                setSpAtkIv(iv);
                onDataChange({
                  ...data,
                  specialAttackStat: calcOtherStat(
                    data.specialAttackBaseStat,
                    iv,
                    spAtkEv,
                    50,
                    data.specialAttackModifier
                  ),
                });
              }
            }}
            className="h-7 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
