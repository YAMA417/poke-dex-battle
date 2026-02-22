"use client";

import { useHydrationSafe } from "@/hooks/useHydrationSafe";
import type {
  DamageCalculationInput,
  DamageResult as DamageResultType,
  Field,
  Weather,
} from "@poke-dex-battle/shared";
import {
  calculateDamage,
  getAbilityConditionEffect,
  getItemByName,
  isSpreadMoveTarget,
} from "@poke-dex-battle/shared";
import type { DoubleBattleResult } from "@/types/damage";
import { useState, useEffect, useMemo } from "react";
import type { AttackerData } from "./AttackerInput";
import { AttackerInput } from "./AttackerInput";
import { BattleConditionInput } from "./BattleConditionInput";
import { DoubleBattleDamageResult } from "./DoubleBattleDamageResult";
import type { DefenderData } from "./DefenderInput";
import { DefenderInput } from "./DefenderInput";

const DEFAULT_ATTACKER_DATA: AttackerData = {
  pokemonName: "",
  pokemonTypes: [],
  moveName: "",
  movePower: 80,
  moveType: "Normal",
  moveCategory: "Physical",
  moveTarget: "",
  attackBaseStat: 100,
  specialAttackBaseStat: 100,
  attackStat: 152,
  specialAttackStat: 152,
  attackModifier: 1.0,
  specialAttackModifier: 1.0,
  attackRank: 0,
  specialAttackRank: 0,
  abilityName: "",
  itemName: "",
  isBurned: false,
};

const DEFAULT_DEFENDER_DATA: DefenderData = {
  pokemonName: "",
  pokemonTypes: [],
  hpBaseStat: 100,
  defenseBaseStat: 100,
  specialDefenseBaseStat: 100,
  hpStat: 207,
  defenseStat: 152,
  specialDefenseStat: 152,
  defenseModifier: 1.0,
  specialDefenseModifier: 1.0,
  defenseRank: 0,
  specialDefenseRank: 0,
  abilityName: "",
  itemName: "",
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
    guaranteed: minDamage > 0 ? Math.ceil(defenderHp / minDamage) : Infinity,
    possible: maxDamage > 0 ? Math.ceil(defenderHp / maxDamage) : Infinity,
  };
}

export function DamageCalculator() {
  const isMounted = useHydrationSafe();
  const [attackerAData, setAttackerAData] = useState<AttackerData>(DEFAULT_ATTACKER_DATA);
  const [attackerBData, setAttackerBData] = useState<AttackerData>(DEFAULT_ATTACKER_DATA);
  const [defenderData1, setDefenderData1] = useState<DefenderData>(DEFAULT_DEFENDER_DATA);
  const [defenderData2, setDefenderData2] = useState<DefenderData>(DEFAULT_DEFENDER_DATA);

  const [weather, setWeather] = useState<Weather>("none");
  const [field, setField] = useState<Field>("none");
  const [isHelpingHand, setIsHelpingHand] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);

  const [isDetailNumbersOpen, setIsDetailNumbersOpen] = useState(false);
  const [isDetailSettingsOpen, setIsDetailSettingsOpen] = useState(false);

  // 特性→天候/フィールドの自動連動
  useEffect(() => {
    const allAbilities = [
      attackerAData.abilityName,
      attackerBData.abilityName,
      defenderData1.abilityName,
      defenderData2.abilityName,
    ];

    let newWeather: Weather = "none";
    let newField: Field = "none";

    for (const name of allAbilities) {
      if (!name) continue;
      const effect = getAbilityConditionEffect(name);
      if (effect?.weather) newWeather = effect.weather;
      if (effect?.field) newField = effect.field;
    }

    setWeather(newWeather);
    setField(newField);
  }, [
    attackerAData.abilityName,
    attackerBData.abilityName,
    defenderData1.abilityName,
    defenderData2.abilityName,
  ]);

  // 全体技の自動検出（攻撃側ごとに個別）
  const bothDefendersPresent = defenderData1.pokemonName !== "" && defenderData2.pokemonName !== "";
  const autoSpreadA = useMemo(
    () => isSpreadMoveTarget(attackerAData.moveTarget) && bothDefendersPresent,
    [attackerAData.moveTarget, bothDefendersPresent]
  );
  const autoSpreadB = useMemo(
    () => isSpreadMoveTarget(attackerBData.moveTarget) && bothDefendersPresent,
    [attackerBData.moveTarget, bothDefendersPresent]
  );

  // rerender-derived-state-no-effect: ダメージ結果はレンダー中に導出
  const result = useMemo<DoubleBattleResult | null>(() => {
    const isReady =
      attackerAData.pokemonName && attackerAData.moveName &&
      attackerBData.pokemonName && attackerBData.moveName;

    if (!isReady) return null;

    const makeInput = (
      attacker: AttackerData,
      defender: DefenderData,
      isSpread: boolean
    ): DamageCalculationInput => {
      const isPhysical = attacker.moveCategory === "Physical";
      return {
        movePower: attacker.movePower,
        moveType: attacker.moveType,
        moveCategory: attacker.moveCategory,
        attackerLevel: 50,
        attackerAttack: isPhysical ? attacker.attackStat : attacker.specialAttackStat,
        attackerTypes: attacker.pokemonTypes,
        defenderDefense: isPhysical ? defender.defenseStat : defender.specialDefenseStat,
        defenderTypes: defender.pokemonTypes,
        defenderMaxHp: defender.hpStat,
        condition: {
          weather,
          field,
          attackerStatStages: {
            attack: isPhysical ? attacker.attackRank : 0,
            defense: 0,
            specialAttack: isPhysical ? 0 : attacker.specialAttackRank,
            specialDefense: 0,
            speed: 0,
          },
          defenderStatStages: {
            attack: 0,
            defense: isPhysical ? defender.defenseRank : 0,
            specialAttack: 0,
            specialDefense: isPhysical ? 0 : defender.specialDefenseRank,
            speed: 0,
          },
          isHelpingHand,
          isSpreadMove: isSpread,
          isCriticalHit,
          attackerItem: attacker.itemName ? (getItemByName(attacker.itemName)?.name || attacker.itemName) : undefined,
          defenderItem: defender.itemName ? (getItemByName(defender.itemName)?.name || defender.itemName) : undefined,
          attackerBurned: attacker.isBurned,
        },
      };
    };

    const t1A = calculateDamage(makeInput(attackerAData, defenderData1, autoSpreadA));
    const t1B = calculateDamage(makeInput(attackerBData, defenderData1, autoSpreadB));
    const t2A = calculateDamage(makeInput(attackerAData, defenderData2, autoSpreadA));
    const t2B = calculateDamage(makeInput(attackerBData, defenderData2, autoSpreadB));

    return {
      target1: {
        attackerAOnly: t1A,
        attackerBOnly: t1B,
        combined: combineDamage(t1A, t1B, defenderData1.hpStat),
      },
      target2: {
        attackerAOnly: t2A,
        attackerBOnly: t2B,
        combined: combineDamage(t2A, t2B, defenderData2.hpStat),
      },
    };
  }, [attackerAData, attackerBData, defenderData1, defenderData2, weather, field, isHelpingHand, isCriticalHit, autoSpreadA, autoSpreadB]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* メイン3カラム: 攻撃側 | 結果 | 防御側 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(300px,auto)_1fr] gap-4">
        {/* 左カラム: 攻撃側 */}
        <div className="space-y-4 order-1">
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

        {/* 中央カラム: 結果 */}
        <div className="order-2">
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
        <div className="space-y-4 order-3">
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
        onWeatherChange={setWeather}
        onFieldChange={setField}
        onHelpingHandChange={setIsHelpingHand}
        onCriticalHitChange={setIsCriticalHit}
      />

      {/* 詳細設定（折りたたみ）— IV、能力ランクのみ */}
      <div>
        <button
          type="button"
          onClick={() => setIsDetailSettingsOpen((prev) => !prev)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-lg"
        >
          {isDetailSettingsOpen ? "詳細設定を隠す" : "▼ 詳細設定（個体値・ランク）"}
        </button>

        {isDetailSettingsOpen && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <AttackerInput data={attackerAData} onDataChange={setAttackerAData}
                idKey="attacker-a-detail" displayMode="full" />
              <AttackerInput data={attackerBData} onDataChange={setAttackerBData}
                idKey="attacker-b-detail" displayMode="full" />
              <DefenderInput data={defenderData1} onDataChange={setDefenderData1}
                idKey="target-1-detail" displayMode="full" />
              <DefenderInput data={defenderData2} onDataChange={setDefenderData2}
                idKey="target-2-detail" displayMode="full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
