'use client';

import { Autocomplete } from '@/components/ui/autocomplete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllPokemon } from '@/hooks/useApiData';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import type { PokemonType, PokemonSpeciesData, StatStage, TeraType } from '@poke-dex-battle/shared';
import {
  calcHpStat,
  calcOtherStat,
  reverseCalcHpEv,
  reverseCalcOtherEv,
  isTeraType,
  DAMAGE_CALC_DEFENDER_ITEMS,
} from '@poke-dex-battle/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MegaEvolutionControl,
  NatureModifierCompact,
  EvPreset,
  TypeBadges,
  TerastalControl,
  DynamaxControl,
} from './SharedFormComponents';
import { useMegaEvolution } from '@/hooks/useMegaEvolution';
import { generateIdPrefix } from '@/utils/id';

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
  isMegaEvolved: boolean;
  megaFormSlug: string | null;
  isTerastallized: boolean;
  teraType: TeraType | null;
  isDynamaxed: boolean;
}

interface DefenderInputProps {
  data: DefenderData;
  onDataChange: (data: DefenderData) => void;
  idKey: string;
  displayMode: 'compact' | 'full';
  showMega?: boolean;
  showTerastal?: boolean;
  showDynamax?: boolean;
  regulationSlug?: string;
}

export function DefenderInput({
  data,
  onDataChange,
  idKey,
  displayMode,
  showMega,
  showTerastal,
  showDynamax,
  regulationSlug,
}: DefenderInputProps) {
  const idPrefix = useMemo(
    () => generateIdPrefix(data.pokemonName || 'defender', idKey),
    [data.pokemonName, idKey]
  );

  // useRef で最新の data と onDataChange を保持（useEffect 内のステールクロージャ防止）
  const dataRef = useRef(data);
  dataRef.current = data;
  const onDataChangeRef = useRef(onDataChange);
  onDataChangeRef.current = onDataChange;
  // 前のポケモン名を追跡（ポケモン変更時にアイテムをリセットするため）
  const prevPokemonNameRef = useRef<string>('');
  // 種族値のキャッシュ（useEffect BでpokemonData依存を外すため）
  const baseStatsRef = useRef({ hp: 0, def: 0, spd: 0 });

  // EV/IV の内部 state
  const [hpEv, setHpEv] = useState(0);
  const [hpIv, setHpIv] = useState(31);
  const [defEv, setDefEv] = useState(0);
  const [defIv, setDefIv] = useState(31);
  const [spDefEv, setSpDefEv] = useState(0);
  const [spDefIv, setSpDefIv] = useState(31);

  const { data: pokemonData, megaForms } = usePokemonSearch(data.pokemonName);

  // メガシンカ共通ロジック
  const { currentMegaForm, megaLabel, spriteUrl } = useMegaEvolution({
    isMegaEvolved: data.isMegaEvolved,
    megaFormSlug: data.megaFormSlug,
    megaForms,
    baseSpriteUrl: pokemonData?.spriteUrl,
  });

  const { data: allPokemon } = useAllPokemon(regulationSlug);
  const pokemonOptions = useMemo(() => {
    return (allPokemon ?? []).map((pokemon) => ({
      label: pokemon.nameJa,
      value: pokemon.nameJa,
      id: `pokemon-${pokemon.id}`,
    }));
  }, [allPokemon]);

  // 特性オプション
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

  // メガフォームのデータを適用したDefenderDataを構築する（単一のonDataChange呼び出しに統合）
  const buildMegaData = useCallback(
    (d: DefenderData, megaForm: PokemonSpeciesData): DefenderData => {
      const hpBase = megaForm.baseStats.hp;
      const defBase = megaForm.baseStats.defense;
      const spDefBase = megaForm.baseStats.specialDefense;
      const firstAbility = megaForm.abilities[0];
      const fixedItemName = megaForm.fixedItemNameJa ?? null;

      return {
        ...d,
        isMegaEvolved: true,
        megaFormSlug: megaForm.name,
        hpBaseStat: hpBase,
        defenseBaseStat: defBase,
        specialDefenseBaseStat: spDefBase,
        pokemonTypes: megaForm.types,
        abilityName: firstAbility?.nameJa ?? d.abilityName,
        hpStat: calcHpStat(hpBase, hpIv, hpEv, 50),
        defenseStat: calcOtherStat(defBase, defIv, defEv, 50, d.defenseModifier),
        specialDefenseStat: calcOtherStat(
          spDefBase,
          spDefIv,
          spDefEv,
          50,
          d.specialDefenseModifier
        ),
        ...(fixedItemName ? { itemName: fixedItemName } : {}),
      };
    },
    [hpIv, hpEv, defIv, defEv, spDefIv, spDefEv]
  );

  const handleMegaToggle = useCallback(
    (checked: boolean): void => {
      const d = dataRef.current;
      if (checked && megaForms.length > 0) {
        const firstMega = megaForms[0];
        onDataChangeRef.current(buildMegaData(d, firstMega));
      } else if (pokemonData) {
        // メガシンカ解除 → ベースフォームのデータを直接復元
        const hpBase = pokemonData.baseStats.hp;
        const defBase = pokemonData.baseStats.defense;
        const spDefBase = pokemonData.baseStats.specialDefense;
        const firstAbility = pokemonData.abilities[0];
        onDataChangeRef.current({
          ...d,
          isMegaEvolved: false,
          megaFormSlug: null,
          hpBaseStat: hpBase,
          defenseBaseStat: defBase,
          specialDefenseBaseStat: spDefBase,
          pokemonTypes: pokemonData.types,
          abilityName: firstAbility?.nameJa ?? '',
          hpStat: calcHpStat(hpBase, hpIv, hpEv, 50),
          defenseStat: calcOtherStat(defBase, defIv, defEv, 50, d.defenseModifier),
          specialDefenseStat: calcOtherStat(
            spDefBase,
            spDefIv,
            spDefEv,
            50,
            d.specialDefenseModifier
          ),
          itemName: '',
        });
      } else {
        onDataChangeRef.current({
          ...d,
          isMegaEvolved: false,
          megaFormSlug: null,
        });
      }
    },
    [megaForms, buildMegaData, pokemonData, hpIv, hpEv, defIv, defEv, spDefIv, spDefEv]
  );

  const handleMegaVariantChange = useCallback(
    (slug: string): void => {
      const d = dataRef.current;
      const selectedForm = megaForms.find((f) => f.name === slug);
      if (selectedForm) {
        onDataChangeRef.current(buildMegaData(d, selectedForm));
      }
    },
    [megaForms, buildMegaData]
  );

  // useEffect A: ポケモン変更時 — 種族値・タイプ・第1特性・fixedItemを反映
  // メガシンカ中はメガフォームのデータを使用するためスキップ
  useEffect(() => {
    if (!pokemonData?.baseStats) return;
    const d = dataRef.current;

    // メガシンカ中はベースフォームのデータ適用をスキップ
    if (d.isMegaEvolved && d.megaFormSlug) return;

    const hpBase = pokemonData.baseStats.hp;
    const defBase = pokemonData.baseStats.defense;
    const spDefBase = pokemonData.baseStats.specialDefense;
    const firstAbility = pokemonData.abilities[0];

    // 種族値をキャッシュ（useEffect BでpokemonData依存を外すため）
    baseStatsRef.current = { hp: hpBase, def: defBase, spd: spDefBase };

    // ポケモン変更検知
    const currentName = pokemonData.name ?? '';
    const pokemonChanged = currentName !== prevPokemonNameRef.current;
    prevPokemonNameRef.current = currentName;

    // fixedItem の処理
    const fixedItem = pokemonData.fixedItemNameJa ?? null;

    // アイテム決定: fixedItemがあればそれを設定、ポケモンが変わったらリセット、それ以外は現状維持
    const itemUpdate = fixedItem ? { itemName: fixedItem } : pokemonChanged ? { itemName: '' } : {};

    onDataChangeRef.current({
      ...d,
      hpBaseStat: hpBase,
      defenseBaseStat: defBase,
      specialDefenseBaseStat: spDefBase,
      pokemonTypes: pokemonData.types,
      abilityName: firstAbility?.nameJa ?? '',
      hpStat: calcHpStat(hpBase, hpIv, hpEv, 50),
      defenseStat: calcOtherStat(defBase, defIv, defEv, 50, d.defenseModifier),
      specialDefenseStat: calcOtherStat(spDefBase, spDefIv, spDefEv, 50, d.specialDefenseModifier),
      ...itemUpdate,
    });
    // 意図的にpokemonData/EV・IVのみに依存（ref経由で最新値を参照）
  }, [pokemonData]);

  // useEffect B: EV/IV・性格補正変更時 — ステータス実数値の再計算のみ
  // pokemonData を依存から外し、baseStatsRef 経由で種族値を参照
  // itemName は触らない（アイテム変更が上書きされるバグの修正）
  useEffect(() => {
    const { hp, def, spd } = baseStatsRef.current;
    if (!hp) return; // 種族値未設定（ポケモン未選択）
    const d = dataRef.current;

    // メガシンカ中はベースフォームのデータ適用をスキップ
    if (d.isMegaEvolved && d.megaFormSlug) return;

    onDataChangeRef.current({
      ...d,
      hpStat: calcHpStat(hp, hpIv, hpEv, 50),
      defenseStat: calcOtherStat(def, defIv, defEv, 50, d.defenseModifier),
      specialDefenseStat: calcOtherStat(spd, spDefIv, spDefEv, 50, d.specialDefenseModifier),
    });
    // 意図的にpokemonData/EV・IVのみに依存（ref経由で最新値を参照）
  }, [hpIv, hpEv, defIv, defEv, spDefIv, spDefEv]);

  // rerender-derived-state-no-effect: ステータスはイベントハンドラで直接計算

  // テラスタルのハンドラ
  const handleTerastalToggle = useCallback(
    (checked: boolean): void => {
      if (checked) {
        const fixed = pokemonData?.fixedTeraType;
        const defaultTeraType = fixed && isTeraType(fixed) ? fixed : null;
        onDataChange({ ...data, isTerastallized: true, teraType: defaultTeraType });
      } else {
        onDataChange({ ...data, isTerastallized: false, teraType: null });
      }
    },
    [data, onDataChange, pokemonData]
  );

  const handleTeraTypeChange = useCallback(
    (type: TeraType): void => {
      onDataChange({ ...data, teraType: type });
    },
    [data, onDataChange]
  );

  // ダイマックスハンドラ
  const handleDynamaxToggle = useCallback(
    (checked: boolean): void => {
      onDataChange({ ...data, isDynamaxed: checked });
    },
    [data, onDataChange]
  );

  if (displayMode === 'compact') {
    return (
      <Card className="border-t-2 border-t-primary/60">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {spriteUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={spriteUrl}
                alt={data.pokemonName}
                width={40}
                height={40}
                className="shrink-0"
              />
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
            onSelect={(name) =>
              onDataChange({
                ...data,
                pokemonName: name,
                isMegaEvolved: false,
                megaFormSlug: null,
              })
            }
            onClear={() =>
              onDataChange({
                ...data,
                pokemonName: '',
                pokemonTypes: [],
                abilityName: '',
                isMegaEvolved: false,
                megaFormSlug: null,
              })
            }
            placeholder="ポケモン名"
            value={data.pokemonName}
          />

          {/* メガシンカ / ゲンシカイキ */}
          {showMega && megaForms.length > 0 && (
            <MegaEvolutionControl
              idPrefix={idPrefix}
              isMegaEvolved={data.isMegaEvolved}
              megaFormSlug={data.megaFormSlug}
              megaForms={megaForms}
              megaLabel={megaLabel}
              onToggle={handleMegaToggle}
              onVariantChange={handleMegaVariantChange}
            />
          )}

          {/* テラスタル */}
          {showTerastal && (
            <TerastalControl
              idPrefix={idPrefix}
              isTerastallized={data.isTerastallized}
              teraType={data.teraType}
              fixedTeraType={pokemonData?.fixedTeraType ?? null}
              onToggle={handleTerastalToggle}
              onTeraTypeChange={handleTeraTypeChange}
            />
          )}

          {/* HP */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">HP</Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">実数値:</span>
                <Input
                  type="number"
                  min={1}
                  value={data.hpStat}
                  onChange={(e) => {
                    const targetStat = Math.max(1, parseInt(e.target.value) || 1);
                    const newEv = reverseCalcHpEv(targetStat, data.hpBaseStat, hpIv, 50);
                    const actualStat = calcHpStat(data.hpBaseStat, hpIv, newEv, 50);
                    setHpEv(newEv);
                    onDataChange({ ...data, hpStat: actualStat });
                  }}
                  className="h-6 w-16 text-right text-xs font-bold tabular-nums"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">EV</span>
              <EvPreset
                value={hpEv}
                onChange={(newEv) => {
                  setHpEv(newEv);
                  onDataChange({ ...data, hpStat: calcHpStat(data.hpBaseStat, hpIv, newEv, 50) });
                }}
                calcStatFn={(ev) => calcHpStat(data.hpBaseStat, hpIv, ev, 50)}
              />
            </div>
          </div>

          {/* 防御 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">防御</Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">実数値:</span>
                <Input
                  type="number"
                  min={1}
                  value={data.defenseStat}
                  onChange={(e) => {
                    const targetStat = Math.max(1, parseInt(e.target.value) || 1);
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
                  }}
                  className="h-6 w-16 text-right text-xs font-bold tabular-nums"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NatureModifierCompact
                value={data.defenseModifier}
                onChange={(mod) =>
                  onDataChange({
                    ...data,
                    defenseModifier: mod,
                    defenseStat: calcOtherStat(data.defenseBaseStat, defIv, defEv, 50, mod),
                  })
                }
              />
              <span className="text-xs text-muted-foreground">EV</span>
              <EvPreset
                value={defEv}
                onChange={(newEv) => {
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
                }}
                calcStatFn={(ev) =>
                  calcOtherStat(data.defenseBaseStat, defIv, ev, 50, data.defenseModifier)
                }
              />
            </div>
          </div>

          {/* 特防 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">特防</Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">実数値:</span>
                <Input
                  type="number"
                  min={1}
                  value={data.specialDefenseStat}
                  onChange={(e) => {
                    const targetStat = Math.max(1, parseInt(e.target.value) || 1);
                    const newEv = reverseCalcOtherEv(
                      targetStat,
                      data.specialDefenseBaseStat,
                      spDefIv,
                      50,
                      data.specialDefenseModifier
                    );
                    const actualStat = calcOtherStat(
                      data.specialDefenseBaseStat,
                      spDefIv,
                      newEv,
                      50,
                      data.specialDefenseModifier
                    );
                    setSpDefEv(newEv);
                    onDataChange({ ...data, specialDefenseStat: actualStat });
                  }}
                  className="h-6 w-16 text-right text-xs font-bold tabular-nums"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NatureModifierCompact
                value={data.specialDefenseModifier}
                onChange={(mod) =>
                  onDataChange({
                    ...data,
                    specialDefenseModifier: mod,
                    specialDefenseStat: calcOtherStat(
                      data.specialDefenseBaseStat,
                      spDefIv,
                      spDefEv,
                      50,
                      mod
                    ),
                  })
                }
              />
              <span className="text-xs text-muted-foreground">EV</span>
              <EvPreset
                value={spDefEv}
                onChange={(newEv) => {
                  setSpDefEv(newEv);
                  onDataChange({
                    ...data,
                    specialDefenseStat: calcOtherStat(
                      data.specialDefenseBaseStat,
                      spDefIv,
                      newEv,
                      50,
                      data.specialDefenseModifier
                    ),
                  });
                }}
                calcStatFn={(ev) =>
                  calcOtherStat(
                    data.specialDefenseBaseStat,
                    spDefIv,
                    ev,
                    50,
                    data.specialDefenseModifier
                  )
                }
              />
            </div>
          </div>

          {/* ダイマックス */}
          {showDynamax && (
            <DynamaxControl
              idPrefix={idPrefix}
              isDynamaxed={data.isDynamaxed}
              hpStat={data.hpStat}
              onToggle={handleDynamaxToggle}
            />
          )}

          {/* 能力ランク */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">防御ランク</Label>
              <Select
                value={data.defenseRank.toString()}
                onValueChange={(v: string) =>
                  onDataChange({ ...data, defenseRank: parseInt(v) as StatStage })
                }
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
            <div className="space-y-1">
              <Label className="text-xs">特防ランク</Label>
              <Select
                value={data.specialDefenseRank.toString()}
                onValueChange={(v: string) =>
                  onDataChange({ ...data, specialDefenseRank: parseInt(v) as StatStage })
                }
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
          </div>

          {/* 特性（メガシンカ中はロック） */}
          <div className="space-y-1">
            <Label className="text-xs">特性</Label>
            <div className={data.isMegaEvolved ? 'pointer-events-none opacity-50' : ''}>
              <Autocomplete
                id={`${idPrefix}-ability`}
                options={abilityOptions}
                onSelect={(name) => onDataChange({ ...data, abilityName: name })}
                placeholder="特性"
                value={data.abilityName}
              />
            </div>
          </div>

          {/* 持ち物（メガシンカ中かつfixedItemありの場合、またはポケモン自体がfixedItemの場合はロック） */}
          <div className="space-y-1">
            <Label className="text-xs">持ち物</Label>
            <div
              className={
                (data.isMegaEvolved && currentMegaForm?.fixedItemNameJa) ||
                pokemonData?.fixedItemNameJa
                  ? 'pointer-events-none opacity-50'
                  : ''
              }
            >
              <Select
                value={data.itemName || '__none__'}
                onValueChange={(v) =>
                  onDataChange({ ...data, itemName: v === '__none__' ? '' : v })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="持ち物" />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_CALC_DEFENDER_ITEMS.map((item) => (
                    <SelectItem key={item.name || '__none__'} value={item.name || '__none__'}>
                      <div className="flex flex-col">
                        <span>{item.nameJa}</span>
                        {item.label && (
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // displayMode === "full" — 詳細設定（IVのみ）
  return (
    <Card className="border-t-2 border-t-primary/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{data.pokemonName || '防御側'} 詳細</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* HP 個体値 */}
        <div className="space-y-1">
          <Label className="text-xs">HP個体値</Label>
          <Input
            type="number"
            min={0}
            max={31}
            value={hpIv}
            onChange={(e) => {
              const iv = Math.max(0, Math.min(31, parseInt(e.target.value) || 0));
              setHpIv(iv);
              onDataChange({ ...data, hpStat: calcHpStat(data.hpBaseStat, iv, hpEv, 50) });
            }}
            className="h-7 text-xs"
          />
        </div>

        {/* 防御個体値 */}
        <div className="space-y-1">
          <Label className="text-xs">防御個体値</Label>
          <Input
            type="number"
            min={0}
            max={31}
            value={defIv}
            onChange={(e) => {
              const iv = Math.max(0, Math.min(31, parseInt(e.target.value) || 0));
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
            }}
            className="h-7 text-xs"
          />
        </div>

        {/* 特防個体値 */}
        <div className="space-y-1">
          <Label className="text-xs">特防個体値</Label>
          <Input
            type="number"
            min={0}
            max={31}
            value={spDefIv}
            onChange={(e) => {
              const iv = Math.max(0, Math.min(31, parseInt(e.target.value) || 0));
              setSpDefIv(iv);
              onDataChange({
                ...data,
                specialDefenseStat: calcOtherStat(
                  data.specialDefenseBaseStat,
                  iv,
                  spDefEv,
                  50,
                  data.specialDefenseModifier
                ),
              });
            }}
            className="h-7 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
