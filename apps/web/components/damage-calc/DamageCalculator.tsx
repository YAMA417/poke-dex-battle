'use client';

import { useHydrationSafe } from '@/hooks/useHydrationSafe';
import type {
  BattleContext,
  CalcMove,
  CalcPokemon,
  DamageResult as DamageResultType,
  Field,
  StatStage,
  Weather,
} from '@poke-dex-battle/shared';
import {
  calculateDamageV2,
  getAbilityConditionEffect,
  isSpreadMoveTarget,
  moveIs,
  resolveGroupItem,
  simulateKoTurns,
  resolveRecoveryItem,
} from '@poke-dex-battle/shared';
import {
  useAllMoves,
  useAllAbilities,
  useAllItems,
  useDefaultRegulation,
} from '@/hooks/useApiData';
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
  isMegaEvolved: false,
  megaFormSlug: null,
  isTerastallized: false,
  teraType: null,
  isStellarBoostUsed: false,
  isZMove: false,
  isDynamaxed: false,
  hitCount: undefined,
  moveMultiHit: undefined,
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
  isMegaEvolved: false,
  megaFormSlug: null,
  isTerastallized: false,
  teraType: null,
  isDynamaxed: false,
};

function combineDamage(
  damageA: DamageResultType,
  damageB: DamageResultType,
  defenderHp: number,
  defenderItem?: string,
  defenderTypes?: string[]
): DamageResultType {
  const minDamage = damageA.minDamage + damageB.minDamage;
  const maxDamage = damageA.maxDamage + damageB.maxDamage;
  const recovery = resolveRecoveryItem(defenderItem, defenderTypes ?? []);

  return {
    minDamage,
    maxDamage,
    minPercent: damageA.minPercent + damageB.minPercent,
    maxPercent: damageA.maxPercent + damageB.maxPercent,
    guaranteed: simulateKoTurns(defenderHp, maxDamage, recovery),
    possible: simulateKoTurns(defenderHp, minDamage, recovery),
  };
}

export function DamageCalculator() {
  const isMounted = useHydrationSafe();

  // レギュレーション取得 → バトルシステムフラグ算出
  const { data: regulation } = useDefaultRegulation();
  const battleSystems = regulation?.battleSystems ?? [];
  const showMega = battleSystems.includes('mega');
  const showTerastal = battleSystems.includes('terastal');
  const showZMove = battleSystems.includes('zmove');
  const showDynamax = battleSystems.includes('dynamax');
  const regulationSlug = regulation?.name;

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

  // 英語名→ItemData マップ
  const itemByName = useMemo(() => {
    if (!allItemsRaw) return new Map<string, ReturnType<typeof toItemData>>();
    const map = new Map<string, ReturnType<typeof toItemData>>();
    for (const row of allItemsRaw) {
      const id = toItemData(row);
      if (id) map.set(id.name, id);
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
      // 日本語名→英語名に変換してから渡す
      const abilityData = abilityByNameJa.get(name);
      const englishName = abilityData?.name ?? name;
      const effect = getAbilityConditionEffect(englishName);
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
    ): {
      attacker: CalcPokemon;
      defender: CalcPokemon;
      move: CalcMove;
      context: BattleContext;
    } | null => {
      const isPhysical = attacker.moveCategory === 'Physical';
      // 技の英語名とフラグを取得
      const moveData = attacker.moveName ? (moveByNameJa.get(attacker.moveName) ?? null) : null;
      const moveEnglishName = moveData?.name || '';
      // DB由来のフラグを使用（デフォルト値はフォールバック用）
      const defaultFlags = {
        isPunchMove: false,
        isRecoilMove: false,
        isBiteMove: false,
        isAuraMove: false,
        hasSecondaryEffect: false,
        usesDefenseAsAttack: false,
        targetsPhysicalDefense: false,
        usesTargetAttack: false,
      } as const;
      const moveFlags = moveData?.flags ?? defaultFlags;

      // ワイドフォース: サイコフィールド時は全体技化（防御側2体いる場合のみ）
      const isExpandingForcePsychic =
        moveIs(moveEnglishName, 'Expanding Force') && field === 'psychic' && bothDefendersPresent;
      const effectiveIsSpread = isSpread || isExpandingForcePsychic;

      // 攻撃側の特性・アイテムのダメージエフェクトを取得
      const attackerAbilityData = attacker.abilityName
        ? abilityByNameJa.get(attacker.abilityName)
        : null;
      // 攻撃側アイテム解決（グループプレースホルダー対応）
      let resolvedAttackerItemName = attacker.itemName || '';
      if (resolvedAttackerItemName === '__type_boost__') {
        resolvedAttackerItemName = resolveGroupItem('type_boost', attacker.moveType) ?? '';
      }
      const attackerItemData = resolvedAttackerItemName
        ? (itemByName.get(resolvedAttackerItemName) ?? itemByNameJa.get(resolvedAttackerItemName))
        : null;

      // 攻撃側ポケモン構築
      const attackerPokemon: CalcPokemon = {
        level: 50,
        types: attacker.pokemonTypes,
        stats: {
          hp: 0, // ダメージ計算に不要
          atk: moveFlags.usesDefenseAsAttack
            ? attacker.defenseStat // ボディプレス: 防御実数値を使う
            : isPhysical
              ? attacker.attackStat
              : 0,
          def: 0,
          spa: isPhysical ? 0 : attacker.specialAttackStat,
          spd: 0,
          spe: 0,
        },
        boosts: {
          atk: (moveFlags.usesDefenseAsAttack
            ? attacker.defenseRank
            : isPhysical
              ? attacker.attackRank
              : 0) as StatStage,
          spa: (isPhysical ? 0 : attacker.specialAttackRank) as StatStage,
        },
        ability: attackerAbilityData?.name || undefined,
        abilityDamageEffect: attackerAbilityData?.damageEffect ?? undefined,
        item: attackerItemData?.name || attacker.itemName || undefined,
        itemDamageEffect: attackerItemData?.damageEffect ?? undefined,
        status: attacker.isBurned ? 'burn' : 'none',
        teraType: attacker.isTerastallized ? (attacker.teraType ?? undefined) : undefined,
        isTerastallized: attacker.isTerastallized,
        isStellarBoostUsed: attacker.isStellarBoostUsed,
      };

      // 防御側の特性・アイテムのダメージエフェクトを取得
      const defenderAbilityData = defender.abilityName
        ? abilityByNameJa.get(defender.abilityName)
        : null;
      // 防御側アイテム解決（グループプレースホルダー対応）
      let resolvedDefenderItemName = defender.itemName || '';
      if (resolvedDefenderItemName === '__type_resist_berry__') {
        resolvedDefenderItemName = resolveGroupItem('type_resist_berry', attacker.moveType) ?? '';
      } else if (resolvedDefenderItemName === '__confusion_berry__') {
        resolvedDefenderItemName = resolveGroupItem('confusion_berry', '') ?? '';
      }
      const defenderItemData = resolvedDefenderItemName
        ? (itemByName.get(resolvedDefenderItemName) ?? itemByNameJa.get(resolvedDefenderItemName))
        : null;

      // 防御側ポケモン構築
      const defenderPokemon: CalcPokemon = {
        level: 50,
        types: defender.pokemonTypes,
        stats: {
          hp: defender.hpStat,
          atk: 0,
          def: defender.defenseStat,
          spa: 0,
          spd: defender.specialDefenseStat,
          spe: 0,
        },
        boosts: {
          def: defender.defenseRank as StatStage,
          spd: defender.specialDefenseRank as StatStage,
        },
        ability: defenderAbilityData?.name || undefined,
        abilityDamageEffect: defenderAbilityData?.damageEffect ?? undefined,
        item: defenderItemData?.name || defender.itemName || undefined,
        itemDamageEffect: defenderItemData?.damageEffect ?? undefined,
        maxHp: defender.hpStat,
        teraType: defender.isTerastallized ? (defender.teraType ?? undefined) : undefined,
        isTerastallized: defender.isTerastallized,
        isDynamaxed: defender.isDynamaxed,
      };

      // 技構築
      const calcMove: CalcMove = {
        id: moveData?.id,
        name: moveEnglishName,
        power: attacker.movePower,
        type: attacker.moveType,
        category: attacker.moveCategory,
        isCritical: isCriticalHit,
        isZMove: attacker.isZMove,
        isDynamaxMove: attacker.isDynamaxed,
        flags: moveFlags,
        damageEffect: moveData?.damageEffect ?? undefined,
        hitCount: attacker.hitCount,
      };

      // バトルコンテキスト構築
      const battleContext: BattleContext = {
        weather,
        field,
        isDoubleBattle: true,
        isSpreadMove: effectiveIsSpread,
        isHelpingHand,
        reflect: isReflect,
        lightScreen: isLightScreen,
        allAttackerSideAbilities,
        allDefenderSideAbilities,
      };

      return {
        attacker: attackerPokemon,
        defender: defenderPokemon,
        move: calcMove,
        context: battleContext,
      };
    };

    /** makeInput → calculateDamageV2 を呼ぶヘルパー */
    const calcDamage = (
      attackerData: AttackerData,
      defenderData: DefenderData,
      isSpread: boolean
    ): DamageResultType | null => {
      const result = makeInput(attackerData, defenderData, isSpread);
      if (!result) return null;
      const { attacker: a, defender: d, move: m, context: c } = result;
      return calculateDamageV2(a, d, m, c);
    };

    // 各ペアリングを個別に計算（準備ができているもののみ）
    const t1A =
      attackerAReady && defender1Ready
        ? calcDamage(attackerAData, defenderData1, autoSpreadA)
        : null;
    const t1B =
      attackerBReady && defender1Ready
        ? calcDamage(attackerBData, defenderData1, autoSpreadB)
        : null;
    const t2A =
      attackerAReady && defender2Ready
        ? calcDamage(attackerAData, defenderData2, autoSpreadA)
        : null;
    const t2B =
      attackerBReady && defender2Ready
        ? calcDamage(attackerBData, defenderData2, autoSpreadB)
        : null;

    const target1 =
      t1A || t1B
        ? {
            attackerAOnly: t1A,
            attackerBOnly: t1B,
            combined:
              t1A && t1B
                ? combineDamage(
                    t1A,
                    t1B,
                    defenderData1.hpStat,
                    defenderData1.itemName || undefined,
                    defenderData1.pokemonTypes
                  )
                : null,
          }
        : null;

    const target2 =
      t2A || t2B
        ? {
            attackerAOnly: t2A,
            attackerBOnly: t2B,
            combined:
              t2A && t2B
                ? combineDamage(
                    t2A,
                    t2B,
                    defenderData2.hpStat,
                    defenderData2.itemName || undefined,
                    defenderData2.pokemonTypes
                  )
                : null,
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
    itemByName,
  ]);

  // 攻撃側 ↔ 防御側 入れ替え
  const handleSwapSides = useCallback(() => {
    const oldAttackerA = attackerAData;
    const oldAttackerB = attackerBData;
    const oldDefender1 = defenderData1;
    const oldDefender2 = defenderData2;

    // 防御側 → 攻撃側（ポケモン名・特性を移し、技・持ち物はリセット）
    // 攻撃側/防御側でアイテムリストが異なるためitemNameはクリア
    setAttackerAData({
      ...DEFAULT_ATTACKER_DATA,
      pokemonName: oldDefender1.pokemonName,
      pokemonTypes: oldDefender1.pokemonTypes,
      abilityName: oldDefender1.abilityName,
      itemName: '',
    });
    setAttackerBData({
      ...DEFAULT_ATTACKER_DATA,
      pokemonName: oldDefender2.pokemonName,
      pokemonTypes: oldDefender2.pokemonTypes,
      abilityName: oldDefender2.abilityName,
      itemName: '',
    });

    // 攻撃側 → 防御側（ポケモン名・特性を移し、持ち物はクリア）
    setDefenderData1({
      ...DEFAULT_DEFENDER_DATA,
      pokemonName: oldAttackerA.pokemonName,
      pokemonTypes: oldAttackerA.pokemonTypes,
      abilityName: oldAttackerA.abilityName,
      itemName: '',
    });
    setDefenderData2({
      ...DEFAULT_DEFENDER_DATA,
      pokemonName: oldAttackerB.pokemonName,
      pokemonTypes: oldAttackerB.pokemonTypes,
      abilityName: oldAttackerB.abilityName,
      itemName: '',
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
            showMega={showMega}
            showTerastal={showTerastal}
            showZMove={showZMove}
            showDynamax={showDynamax}
            regulationSlug={regulationSlug}
          />
          <AttackerInput
            data={attackerBData}
            onDataChange={setAttackerBData}
            idKey="attacker-b"
            showMega={showMega}
            showTerastal={showTerastal}
            showZMove={showZMove}
            showDynamax={showDynamax}
            regulationSlug={regulationSlug}
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
            showMega={showMega}
            showTerastal={showTerastal}
            showDynamax={showDynamax}
            regulationSlug={regulationSlug}
          />
          <DefenderInput
            data={defenderData2}
            onDataChange={setDefenderData2}
            idKey="target-2"
            showMega={showMega}
            showTerastal={showTerastal}
            showDynamax={showDynamax}
            regulationSlug={regulationSlug}
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
    </div>
  );
}
