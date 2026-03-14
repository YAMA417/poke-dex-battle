'use client';

import { useHydrationSafe } from '@/hooks/useHydrationSafe';
import type {
  DamageCalculationInput,
  DamageResult as DamageResultType,
  Field,
  Weather,
} from '@poke-dex-battle/shared';
import {
  calculateDamage,
  getAbilityConditionEffect,
  getMoveFlags,
  isSpreadMoveTarget,
} from '@poke-dex-battle/shared';
import { useAllMoves, useAllAbilities, useAllItems } from '@/hooks/useApiData';
import { toMoveData, toAbilityData, toItemData } from '@/lib/api-adapters';
import type { DoubleBattleResult } from '@/types/damage';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { AttackerData } from './AttackerInput';
import { AttackerInput } from './AttackerInput';
import { BattleConditionInput } from './BattleConditionInput';
import { DoubleBattleDamageResult } from './DoubleBattleDamageResult';
import type { DefenderData } from './DefenderInput';
import { DefenderInput } from './DefenderInput';

const DEFAULT_ATTACKER_DATA: AttackerData = {
  pokemonName: '',
  pokemonTypes: [],
  moveName: '',
  movePower: 80,
  moveType: 'Normal',
  moveCategory: 'Physical',
  moveTarget: '',
  attackBaseStat: 100,
  specialAttackBaseStat: 100,
  defenseBaseStat: 100,
  attackStat: 152,
  specialAttackStat: 152,
  defenseStat: 120,
  attackModifier: 1.0,
  specialAttackModifier: 1.0,
  defenseModifier: 1.0,
  attackRank: 0,
  specialAttackRank: 0,
  defenseRank: 0,
  abilityName: '',
  itemName: '',
  isBurned: false,
};

const DEFAULT_DEFENDER_DATA: DefenderData = {
  pokemonName: '',
  pokemonTypes: [],
  hpBaseStat: 100,
  defenseBaseStat: 100,
  specialDefenseBaseStat: 100,
  hpStat: 175,
  defenseStat: 120,
  specialDefenseStat: 120,
  defenseModifier: 1.0,
  specialDefenseModifier: 1.0,
  defenseRank: 0,
  specialDefenseRank: 0,
  abilityName: '',
  itemName: '',
};

function combineDamage(
  damageA: DamageResultType,
  damageB: DamageResultType,
  defenderHp: number
): DamageResultType {
  const minDamage = damageA.minDamage + damageB.minDamage;
  const maxDamage = damageA.maxDamage + damageB.maxDamage;

  return {
    minDamage,
    maxDamage,
    minPercent: damageA.minPercent + damageB.minPercent,
    maxPercent: damageA.maxPercent + damageB.maxPercent,
    guaranteed: maxDamage > 0 ? Math.ceil(defenderHp / maxDamage) : Infinity,
    possible: minDamage > 0 ? Math.ceil(defenderHp / minDamage) : Infinity,
  };
}

export function DamageCalculator() {
  const isMounted = useHydrationSafe();

  // API経由で全データを取得し、名前→データのMapを構築
  const { data: allMovesRaw } = useAllMoves();
  const { data: allAbilitiesRaw } = useAllAbilities();
  const { data: allItemsRaw } = useAllItems();

  const moveByNameJa = useMemo(() => {
    if (!allMovesRaw) return new Map<string, ReturnType<typeof toMoveData>>();
    const map = new Map<string, ReturnType<typeof toMoveData>>();
    for (const row of allMovesRaw) {
      const md = toMoveData(row);
      if (md) map.set(md.nameJa, md);
    }
    return map;
  }, [allMovesRaw]);

  const abilityByNameJa = useMemo(() => {
    if (!allAbilitiesRaw) return new Map<string, ReturnType<typeof toAbilityData>>();
    const map = new Map<string, ReturnType<typeof toAbilityData>>();
    for (const row of allAbilitiesRaw) {
      const ad = toAbilityData(row);
      if (ad) map.set(ad.nameJa, ad);
    }
    return map;
  }, [allAbilitiesRaw]);

  const itemByNameJa = useMemo(() => {
    if (!allItemsRaw) return new Map<string, ReturnType<typeof toItemData>>();
    const map = new Map<string, ReturnType<typeof toItemData>>();
    for (const row of allItemsRaw) {
      const id = toItemData(row);
      if (id) map.set(id.nameJa, id);
    }
    return map;
  }, [allItemsRaw]);

  const [attackerAData, setAttackerAData] = useState<AttackerData>(DEFAULT_ATTACKER_DATA);
  const [attackerBData, setAttackerBData] = useState<AttackerData>(DEFAULT_ATTACKER_DATA);
  const [defenderData1, setDefenderData1] = useState<DefenderData>(DEFAULT_DEFENDER_DATA);
  const [defenderData2, setDefenderData2] = useState<DefenderData>(DEFAULT_DEFENDER_DATA);

  const [weather, setWeather] = useState<Weather>('none');
  const [field, setField] = useState<Field>('none');
  const [isHelpingHand, setIsHelpingHand] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const [isReflect, setIsReflect] = useState(false);
  const [isLightScreen, setIsLightScreen] = useState(false);

  const [isDetailNumbersOpen, setIsDetailNumbersOpen] = useState(false);
  const [isDetailSettingsOpen, setIsDetailSettingsOpen] = useState(false);

  // 特性→天候/フィールドの自動連動（手動変更は保持、特性由来の値が変わったときのみ自動更新）
  const prevAbilityWeatherRef = useRef<Weather>('none');
  const prevAbilityFieldRef = useRef<Field>('none');

  useEffect(() => {
    const allAbilities = [
      attackerAData.abilityName,
      attackerBData.abilityName,
      defenderData1.abilityName,
      defenderData2.abilityName,
    ];

    let abilityWeather: Weather = 'none';
    let abilityField: Field = 'none';

    for (const name of allAbilities) {
      if (!name) continue;
      const effect = getAbilityConditionEffect(name);
      if (effect?.weather) abilityWeather = effect.weather;
      if (effect?.field) abilityField = effect.field;
    }

    // 特性由来の天候が変わった場合のみ更新（手動変更を上書きしない）
    if (abilityWeather !== prevAbilityWeatherRef.current) {
      prevAbilityWeatherRef.current = abilityWeather;
      setWeather(abilityWeather);
    }
    if (abilityField !== prevAbilityFieldRef.current) {
      prevAbilityFieldRef.current = abilityField;
      setField(abilityField);
    }
  }, [
    attackerAData.abilityName,
    attackerBData.abilityName,
    defenderData1.abilityName,
    defenderData2.abilityName,
  ]);

  // 全体技の自動検出（攻撃側ごとに個別）
  const bothDefendersPresent = defenderData1.pokemonName !== '' && defenderData2.pokemonName !== '';
  const autoSpreadA = useMemo(
    () => isSpreadMoveTarget(attackerAData.moveTarget) && bothDefendersPresent,
    [attackerAData.moveTarget, bothDefendersPresent]
  );
  const autoSpreadB = useMemo(
    () => isSpreadMoveTarget(attackerBData.moveTarget) && bothDefendersPresent,
    [attackerBData.moveTarget, bothDefendersPresent]
  );

  // 各攻撃側・防御側の準備状態
  const attackerAReady = !!(attackerAData.pokemonName && attackerAData.moveName);
  const attackerBReady = !!(attackerBData.pokemonName && attackerBData.moveName);
  const defender1Ready = !!defenderData1.pokemonName;
  const defender2Ready = !!defenderData2.pokemonName;

  // rerender-derived-state-no-effect: ダメージ結果はレンダー中に導出（部分計算対応）
  const result = useMemo<DoubleBattleResult | null>(() => {
    // 攻撃側が1体以上 & 防御側が1体以上あれば計算開始
    const hasAnyAttacker = attackerAReady || attackerBReady;
    const hasAnyDefender = defender1Ready || defender2Ready;
    if (!hasAnyAttacker || !hasAnyDefender) return null;

    // 攻撃側サイドの全特性を収集（わざわいシリーズ等の場に影響する特性用）
    const resolveAbilityName = (jaName: string): string | undefined => {
      if (!jaName) return undefined;
      return abilityByNameJa.get(jaName)?.name || undefined;
    };
    const allAttackerSideAbilities = [
      resolveAbilityName(attackerAData.abilityName),
      resolveAbilityName(attackerBData.abilityName),
    ].filter((a): a is string => !!a);
    const allDefenderSideAbilities = [
      resolveAbilityName(defenderData1.abilityName),
      resolveAbilityName(defenderData2.abilityName),
    ].filter((a): a is string => !!a);

    const makeInput = (
      attacker: AttackerData,
      defender: DefenderData,
      isSpread: boolean
    ): DamageCalculationInput => {
      const isPhysical = attacker.moveCategory === 'Physical';
      // 技の英語名とフラグを取得
      const moveData = attacker.moveName ? (moveByNameJa.get(attacker.moveName) ?? null) : null;
      const moveEnglishName = moveData?.name || '';
      const moveFlags = getMoveFlags(moveEnglishName, moveData?.shortDesc);

      // 特殊技のステータス参照を解決
      let attackerAttack: number;
      let defenderDefense: number;
      if (moveFlags.usesDefenseAsAttack) {
        // ボディプレス: 攻撃側の防御実数値を使用
        attackerAttack = attacker.defenseStat;
      } else {
        attackerAttack = isPhysical ? attacker.attackStat : attacker.specialAttackStat;
      }
      if (moveFlags.targetsPhysicalDefense) {
        // サイコショック等: 特殊技だが防御側の物理防御を使用
        defenderDefense = defender.defenseStat;
      } else {
        defenderDefense = isPhysical ? defender.defenseStat : defender.specialDefenseStat;
      }

      return {
        moveName: moveEnglishName,
        movePower: attacker.movePower,
        moveType: attacker.moveType,
        moveCategory: attacker.moveCategory,
        moveFlags,
        attackerLevel: 50,
        attackerAttack,
        attackerTypes: attacker.pokemonTypes,
        defenderDefense,
        defenderTypes: defender.pokemonTypes,
        defenderMaxHp: defender.hpStat,
        condition: {
          weather,
          field,
          attackerStatStages: {
            attack: moveFlags.usesDefenseAsAttack
              ? attacker.defenseRank
              : isPhysical
                ? attacker.attackRank
                : 0,
            defense: 0,
            specialAttack: moveFlags.usesDefenseAsAttack
              ? 0
              : isPhysical
                ? 0
                : attacker.specialAttackRank,
            specialDefense: 0,
            speed: 0,
          },
          defenderStatStages: {
            attack: 0,
            defense: isPhysical || moveFlags.targetsPhysicalDefense ? defender.defenseRank : 0,
            specialAttack: 0,
            specialDefense:
              !isPhysical && !moveFlags.targetsPhysicalDefense ? defender.specialDefenseRank : 0,
            speed: 0,
          },
          isDoubleBattle: true,
          isHelpingHand,
          isSpreadMove: isSpread,
          isCriticalHit,
          attackerAbility: attacker.abilityName
            ? abilityByNameJa.get(attacker.abilityName)?.name || undefined
            : undefined,
          defenderAbility: defender.abilityName
            ? abilityByNameJa.get(defender.abilityName)?.name || undefined
            : undefined,
          attackerItem: attacker.itemName
            ? itemByNameJa.get(attacker.itemName)?.name || attacker.itemName
            : undefined,
          defenderItem: defender.itemName
            ? itemByNameJa.get(defender.itemName)?.name || defender.itemName
            : undefined,
          attackerBurned: attacker.isBurned,
          reflect: isReflect,
          lightScreen: isLightScreen,
          allAttackerSideAbilities,
          allDefenderSideAbilities,
        },
      };
    };

    // 各ペアリングを個別に計算（準備ができているもののみ）
    const t1A =
      attackerAReady && defender1Ready
        ? calculateDamage(makeInput(attackerAData, defenderData1, autoSpreadA))
        : null;
    const t1B =
      attackerBReady && defender1Ready
        ? calculateDamage(makeInput(attackerBData, defenderData1, autoSpreadB))
        : null;
    const t2A =
      attackerAReady && defender2Ready
        ? calculateDamage(makeInput(attackerAData, defenderData2, autoSpreadA))
        : null;
    const t2B =
      attackerBReady && defender2Ready
        ? calculateDamage(makeInput(attackerBData, defenderData2, autoSpreadB))
        : null;

    const target1 =
      t1A || t1B
        ? {
            attackerAOnly: t1A,
            attackerBOnly: t1B,
            combined: t1A && t1B ? combineDamage(t1A, t1B, defenderData1.hpStat) : null,
          }
        : null;

    const target2 =
      t2A || t2B
        ? {
            attackerAOnly: t2A,
            attackerBOnly: t2B,
            combined: t2A && t2B ? combineDamage(t2A, t2B, defenderData2.hpStat) : null,
          }
        : null;

    return { target1, target2 };
  }, [
    attackerAData,
    attackerBData,
    defenderData1,
    defenderData2,
    weather,
    field,
    isHelpingHand,
    isCriticalHit,
    isReflect,
    isLightScreen,
    autoSpreadA,
    autoSpreadB,
    attackerAReady,
    attackerBReady,
    defender1Ready,
    defender2Ready,
    moveByNameJa,
    abilityByNameJa,
    itemByNameJa,
  ]);

  // 攻撃側 ↔ 防御側 入れ替え
  const handleSwapSides = useCallback(() => {
    const oldAttackerA = attackerAData;
    const oldAttackerB = attackerBData;
    const oldDefender1 = defenderData1;
    const oldDefender2 = defenderData2;

    // 防御側 → 攻撃側（ポケモン名・特性・持ち物を移し、技はリセット）
    setAttackerAData({
      ...DEFAULT_ATTACKER_DATA,
      pokemonName: oldDefender1.pokemonName,
      pokemonTypes: oldDefender1.pokemonTypes,
      abilityName: oldDefender1.abilityName,
      itemName: oldDefender1.itemName,
    });
    setAttackerBData({
      ...DEFAULT_ATTACKER_DATA,
      pokemonName: oldDefender2.pokemonName,
      pokemonTypes: oldDefender2.pokemonTypes,
      abilityName: oldDefender2.abilityName,
      itemName: oldDefender2.itemName,
    });

    // 攻撃側 → 防御側（ポケモン名・特性・持ち物を移す）
    setDefenderData1({
      ...DEFAULT_DEFENDER_DATA,
      pokemonName: oldAttackerA.pokemonName,
      pokemonTypes: oldAttackerA.pokemonTypes,
      abilityName: oldAttackerA.abilityName,
      itemName: oldAttackerA.itemName,
    });
    setDefenderData2({
      ...DEFAULT_DEFENDER_DATA,
      pokemonName: oldAttackerB.pokemonName,
      pokemonTypes: oldAttackerB.pokemonTypes,
      abilityName: oldAttackerB.abilityName,
      itemName: oldAttackerB.itemName,
    });
  }, [attackerAData, attackerBData, defenderData1, defenderData2]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* メイン3カラム: 攻撃側 | 結果 | 防御側 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_minmax(300px,auto)_1fr]">
        {/* 左カラム: 攻撃側 */}
        <div className="order-1 space-y-4">
          <AttackerInput
            data={attackerAData}
            onDataChange={setAttackerAData}
            idKey="attacker-a"
            displayMode="compact"
          />
          <AttackerInput
            data={attackerBData}
            onDataChange={setAttackerBData}
            idKey="attacker-b"
            displayMode="compact"
          />
        </div>

        {/* 中央カラム: 入れ替えボタン + 結果 */}
        <div className="order-2 space-y-2">
          <button
            type="button"
            onClick={handleSwapSides}
            className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="攻撃側と防御側を入れ替える"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>入れ替え</span>
          </button>
          <DoubleBattleDamageResult
            result={result}
            target1Hp={defenderData1.hpStat}
            target2Hp={defenderData2.hpStat}
            target1Name={defenderData1.pokemonName}
            target2Name={defenderData2.pokemonName}
            attacker1Name={attackerAData.pokemonName}
            attacker2Name={attackerBData.pokemonName}
            isDetailNumbersOpen={isDetailNumbersOpen}
            onToggleDetailNumbers={() => setIsDetailNumbersOpen((prev) => !prev)}
          />
        </div>

        {/* 右カラム: 防御側 */}
        <div className="order-3 space-y-4">
          <DefenderInput
            data={defenderData1}
            onDataChange={setDefenderData1}
            idKey="target-1"
            displayMode="compact"
          />
          <DefenderInput
            data={defenderData2}
            onDataChange={setDefenderData2}
            idKey="target-2"
            displayMode="compact"
          />
        </div>
      </div>

      {/* バトル条件 — 常時表示 */}
      <BattleConditionInput
        weather={weather}
        field={field}
        isHelpingHand={isHelpingHand}
        isCriticalHit={isCriticalHit}
        isReflect={isReflect}
        isLightScreen={isLightScreen}
        onWeatherChange={setWeather}
        onFieldChange={setField}
        onHelpingHandChange={setIsHelpingHand}
        onCriticalHitChange={setIsCriticalHit}
        onReflectChange={setIsReflect}
        onLightScreenChange={setIsLightScreen}
      />

      {/* 詳細設定（折りたたみ）— IV、能力ランクのみ */}
      <div>
        <button
          type="button"
          onClick={() => setIsDetailSettingsOpen((prev) => !prev)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {isDetailSettingsOpen ? '詳細設定を隠す' : '▼ 詳細設定（個体値・ランク）'}
        </button>

        {isDetailSettingsOpen && (
          <div className="mt-4 space-y-4 duration-200 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AttackerInput
                data={attackerAData}
                onDataChange={setAttackerAData}
                idKey="attacker-a-detail"
                displayMode="full"
              />
              <AttackerInput
                data={attackerBData}
                onDataChange={setAttackerBData}
                idKey="attacker-b-detail"
                displayMode="full"
              />
              <DefenderInput
                data={defenderData1}
                onDataChange={setDefenderData1}
                idKey="target-1-detail"
                displayMode="full"
              />
              <DefenderInput
                data={defenderData2}
                onDataChange={setDefenderData2}
                idKey="target-2-detail"
                displayMode="full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
