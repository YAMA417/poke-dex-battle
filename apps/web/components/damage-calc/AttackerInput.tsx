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
import type {
  PokemonType,
  PokemonSpeciesData,
  StatStage,
  TeraType,
  MultiHitInfo,
} from '@poke-dex-battle/shared';
import {
  calcOtherStat,
  reverseCalcOtherEv,
  getZMovePower,
  getDynamaxMovePower,
  isTeraType,
  resolveHitCountRange,
} from '@poke-dex-battle/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HitCountSelector } from './HitCountSelector';
import { MoveInput } from './MoveInput';
import {
  MegaEvolutionControl,
  NatureModifierCompact,
  EvPreset,
  TypeBadges,
  TerastalControl,
  ZMoveControl,
  DynamaxControl,
} from './SharedFormComponents';
import { useMegaEvolution } from '@/hooks/useMegaEvolution';
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
  isMegaEvolved: boolean;
  megaFormSlug: string | null;
  isTerastallized: boolean;
  teraType: TeraType | null;
  isStellarBoostUsed: boolean;
  isZMove: boolean;
  isDynamaxed: boolean;
  /** 連続技のヒット数（UI選択値） */
  hitCount?: number;
  /** 連続技情報（技選択時に設定） */
  moveMultiHit?: MultiHitInfo;
}

interface AttackerInputProps {
  data: AttackerData;
  onDataChange: (data: AttackerData) => void;
  idKey: string;
  displayMode: 'compact' | 'full';
  showMega?: boolean;
  showTerastal?: boolean;
  showZMove?: boolean;
  showDynamax?: boolean;
  regulationSlug?: string;
}

// --- メインコンポーネント ---

export function AttackerInput({
  data,
  onDataChange,
  idKey,
  displayMode,
  showMega,
  showTerastal,
  showZMove,
  showDynamax,
  regulationSlug,
}: AttackerInputProps) {
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

  const { data: pokemonData, megaForms } = usePokemonSearch(data.pokemonName);

  const { data: allPokemon } = useAllPokemon(regulationSlug);
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

  // メガシンカ共通ロジック
  const { currentMegaForm, megaLabel, spriteUrl } = useMegaEvolution({
    isMegaEvolved: data.isMegaEvolved,
    megaFormSlug: data.megaFormSlug,
    megaForms,
    baseSpriteUrl: pokemonData?.spriteUrl,
  });

  // 持ち物オプション（競技用のみ）
  const { data: allItems } = useAllItems();
  const itemOptions = useMemo(() => {
    return (allItems ?? []).map((item) => ({
      label: item.nameJa,
      value: item.nameJa,
      id: `item-${item.id}`,
    }));
  }, [allItems]);

  // 日本語名 → 英語名の解決（resolveHitCountRange 用）
  const abilityEnglishName = useMemo(() => {
    if (!data.abilityName || !pokemonData?.abilities) return undefined;
    return pokemonData.abilities.find((a) => a.nameJa === data.abilityName)?.name;
  }, [data.abilityName, pokemonData?.abilities]);

  const itemEnglishName = useMemo(() => {
    if (!data.itemName || !allItems) return undefined;
    return allItems.find((item) => item.nameJa === data.itemName)?.name;
  }, [data.itemName, allItems]);

  // メガフォームのデータを適用したAttackerDataを構築する（単一のonDataChange呼び出しに統合）
  const buildMegaData = useCallback(
    (d: AttackerData, megaForm: PokemonSpeciesData): AttackerData => {
      const atkBase = megaForm.baseStats.attack;
      const spAtkBase = megaForm.baseStats.specialAttack;
      const defBase = megaForm.baseStats.defense;
      const firstAbility = megaForm.abilities[0];
      const fixedItemName = megaForm.fixedItemNameJa ?? null;

      return {
        ...d,
        isMegaEvolved: true,
        megaFormSlug: megaForm.name,
        attackBaseStat: atkBase,
        specialAttackBaseStat: spAtkBase,
        defenseBaseStat: defBase,
        pokemonTypes: megaForm.types,
        abilityName: firstAbility?.nameJa ?? d.abilityName,
        attackStat: calcOtherStat(atkBase, attackIv, attackEv, 50, d.attackModifier),
        specialAttackStat: calcOtherStat(spAtkBase, spAtkIv, spAtkEv, 50, d.specialAttackModifier),
        defenseStat: calcOtherStat(defBase, defIv, defEv, 50, d.defenseModifier),
        ...(fixedItemName ? { itemName: fixedItemName } : {}),
      };
    },
    [attackIv, attackEv, spAtkIv, spAtkEv, defIv, defEv]
  );

  const handleMegaToggle = useCallback(
    (checked: boolean): void => {
      const d = dataRef.current;
      if (checked && megaForms.length > 0) {
        const firstMega = megaForms[0];
        onDataChangeRef.current(buildMegaData(d, firstMega));
      } else if (pokemonData) {
        // メガシンカ解除 → ベースフォームのデータを直接復元
        const atkBase = pokemonData.baseStats.attack;
        const spAtkBase = pokemonData.baseStats.specialAttack;
        const defBase = pokemonData.baseStats.defense;
        const firstAbility = pokemonData.abilities[0];
        onDataChangeRef.current({
          ...d,
          isMegaEvolved: false,
          megaFormSlug: null,
          attackBaseStat: atkBase,
          specialAttackBaseStat: spAtkBase,
          defenseBaseStat: defBase,
          pokemonTypes: pokemonData.types,
          abilityName: firstAbility?.nameJa ?? '',
          attackStat: calcOtherStat(atkBase, attackIv, attackEv, 50, d.attackModifier),
          specialAttackStat: calcOtherStat(
            spAtkBase,
            spAtkIv,
            spAtkEv,
            50,
            d.specialAttackModifier
          ),
          defenseStat: calcOtherStat(defBase, defIv, defEv, 50, d.defenseModifier),
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
    [megaForms, buildMegaData, pokemonData, attackIv, attackEv, spAtkIv, spAtkEv, defIv, defEv]
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

  // ポケモンデータ取得時に種族値・タイプ・第1特性を自動反映
  // メガシンカ中はメガフォームのデータを使用するためスキップ
  useEffect(() => {
    if (!pokemonData?.baseStats) return;
    const d = dataRef.current;

    // メガシンカ中はベースフォームのデータ適用をスキップ
    if (d.isMegaEvolved && d.megaFormSlug) return;

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
  }, [pokemonData, attackIv, attackEv, spAtkIv, spAtkEv, defIv, defEv]);

  // rerender-derived-state-no-effect: ステータスはイベントハンドラで直接計算
  const isPhysical = data.moveCategory === 'Physical';

  // 特殊技フラグの判定（ボディプレス等）
  const { data: moveData } = useMoveByName(data.moveName || null);
  const usesDefenseAsAttack = moveData?.usesDefenseAsAttack ?? false;

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

  // テラスタルのハンドラ
  const handleTerastalToggle = useCallback(
    (checked: boolean): void => {
      if (checked) {
        const fixed = pokemonData?.fixedTeraType;
        const defaultTeraType = fixed && isTeraType(fixed) ? fixed : null;
        onDataChange({ ...data, isTerastallized: true, teraType: defaultTeraType });
      } else {
        onDataChange({
          ...data,
          isTerastallized: false,
          teraType: null,
          isStellarBoostUsed: false,
        });
      }
    },
    [data, onDataChange, pokemonData]
  );

  const handleTeraTypeChange = useCallback(
    (type: TeraType): void => {
      onDataChange({ ...data, teraType: type, isStellarBoostUsed: false });
    },
    [data, onDataChange]
  );

  const handleStellarBoostChange = useCallback(
    (used: boolean): void => {
      onDataChange({ ...data, isStellarBoostUsed: used });
    },
    [data, onDataChange]
  );

  // Z技ハンドラ
  const handleZMoveToggle = useCallback(
    (checked: boolean): void => {
      onDataChange({ ...data, isZMove: checked });
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

  // Z技/ダイマックス威力の算出
  const zMovePower = getZMovePower(data.movePower);
  const dynamaxMovePower = getDynamaxMovePower(data.movePower);

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
              isStellarBoostUsed={data.isStellarBoostUsed}
              showStellarBoost
              onToggle={handleTerastalToggle}
              onTeraTypeChange={handleTeraTypeChange}
              onStellarBoostChange={handleStellarBoostChange}
            />
          )}

          {/* 技名 */}
          <MoveInput
            pokemonName={data.pokemonName}
            moveName={data.moveName}
            movePower={data.movePower}
            moveType={data.moveType}
            moveCategory={data.moveCategory}
            onMoveSelect={(move) => {
              // 連続技情報を更新
              const multiHit = move.multiHit;
              let hitCount: number | undefined;
              if (multiHit) {
                const range = resolveHitCountRange(multiHit, abilityEnglishName, itemEnglishName);
                hitCount = range.defaultCount;
              }
              onDataChange({
                ...data,
                moveName: move.name,
                movePower: move.power,
                moveType: move.type,
                moveCategory: move.category,
                moveTarget: move.target,
                moveMultiHit: multiHit,
                hitCount,
              });
            }}
            onMovePowerChange={(power) => onDataChange({ ...data, movePower: power })}
            onMoveTypeChange={(type) => onDataChange({ ...data, moveType: type })}
            onMoveCategoryChange={(cat) => onDataChange({ ...data, moveCategory: cat })}
            compact
          />

          {/* ヒット数選択（連続技かつZ技/ダイマックスOFFの場合のみ） */}
          {data.moveMultiHit &&
            !data.isZMove &&
            !data.isDynamaxed &&
            (() => {
              const range = resolveHitCountRange(
                data.moveMultiHit,
                abilityEnglishName,
                itemEnglishName
              );
              return (
                <HitCountSelector
                  min={range.min}
                  max={range.max}
                  hitCount={data.hitCount ?? range.max}
                  onHitCountChange={(count) => onDataChange({ ...data, hitCount: count })}
                  disabled={range.min === range.max}
                  idPrefix={idPrefix}
                />
              );
            })()}

          {/* Z技 */}
          {showZMove && (
            <ZMoveControl
              idPrefix={idPrefix}
              isZMove={data.isZMove}
              zMovePower={zMovePower}
              onToggle={handleZMoveToggle}
            />
          )}

          {/* ダイマックス */}
          {showDynamax && (
            <DynamaxControl
              idPrefix={idPrefix}
              isDynamaxed={data.isDynamaxed}
              dynamaxMovePower={dynamaxMovePower}
              onToggle={handleDynamaxToggle}
            />
          )}

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

          {/* 持ち物（メガシンカ中かつfixedItemありの場合はロック） */}
          <div className="space-y-1">
            <Label className="text-xs">持ち物</Label>
            <div
              className={
                data.isMegaEvolved && currentMegaForm?.fixedItemNameJa
                  ? 'pointer-events-none opacity-50'
                  : ''
              }
            >
              <Autocomplete
                id={`${idPrefix}-item`}
                options={itemOptions}
                onSelect={(name) => onDataChange({ ...data, itemName: name })}
                placeholder="持ち物"
                value={data.itemName}
              />
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
