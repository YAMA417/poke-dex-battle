"use client";

import { Button } from "@/components/ui/button";
import { useHydrationSafe } from "@/hooks/useHydrationSafe";
import type {
  DamageCalculationInput,
  DamageResult as DamageResultType,
  Field,
  Weather,
} from "@poke-dex-battle/shared";
import { calculateDamage } from "@poke-dex-battle/shared";
import type { DoubleBattleResult } from "@/types/damage";
import { useState, useEffect, useCallback } from "react";
import type { AttackerData } from "./AttackerInput";
import { AttackerInput } from "./AttackerInput";
import { BattleConditionInput } from "./BattleConditionInput";
import { DoubleBattleDamageResult } from "./DoubleBattleDamageResult";
import type { DefenderData } from "./DefenderInput";
import { DefenderInput } from "./DefenderInput";

type SectionKey = "attackers" | "defenders" | "conditions";



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
  const [attackerDataA, setAttackerDataA] = useState<AttackerData | null>(null);
  const [attackerDataB, setAttackerDataB] = useState<AttackerData | null>(null);
  const [defenderData1, setDefenderData1] = useState<DefenderData | null>(null);
  const [defenderData2, setDefenderData2] = useState<DefenderData | null>(null);

  const [weather, setWeather] = useState<Weather>("none");
  const [field, setField] = useState<Field>("none");
  const [isHelpingHand, setIsHelpingHand] = useState(false);
  const [isSpreadMove, setIsSpreadMove] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);

  const [result, setResult] = useState<DoubleBattleResult | null>(null);

  // Section expansion states
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    attackers: true,
    defenders: true,
    conditions: true,
  });

  // Attacker details toggle state (synchronized)
  const [isAttackerDetailsOpen, setIsAttackerDetailsOpen] = useState(false);

  const toggleAttackerDetails = () => {
    setIsAttackerDetailsOpen((prev) => !prev);
  };

  // Defender details toggle state (synchronized)
  const [isDefenderDetailsOpen, setIsDefenderDetailsOpen] = useState(false);

  const toggleDefenderDetails = () => {
    setIsDefenderDetailsOpen((prev) => !prev);
  };

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper function to create damage calculation input
  const createInput = useCallback((
    attacker: AttackerData,
    defender: DefenderData,
    isSpread: boolean
  ): DamageCalculationInput => {
    const attackStat =
      attacker.moveCategory === "Physical"
        ? attacker.attackStat
        : attacker.specialAttackStat;

    const defenseStat =
      attacker.moveCategory === "Physical"
        ? defender.defenseStat
        : defender.specialDefenseStat;

    const attackRank =
      attacker.moveCategory === "Physical"
        ? attacker.attackRank
        : attacker.specialAttackRank;

    const defenseRank =
      attacker.moveCategory === "Physical"
        ? defender.defenseRank
        : defender.specialDefenseRank;

    return {
      movePower: attacker.movePower,
      moveType: attacker.moveType,
      moveCategory: attacker.moveCategory,
      attackerLevel: 50,
      attackerAttack: attackStat,
      attackerTypes: attacker.pokemonTypes,
      defenderDefense: defenseStat,
      defenderTypes: defender.pokemonTypes,
      defenderMaxHp: defender.hpStat,
      condition: {
        weather,
        field,
        attackerStatStages: {
          attack: attackRank,
          defense: 0,
          specialAttack: attackRank,
          specialDefense: 0,
          speed: 0,
        },
        defenderStatStages: {
          attack: 0,
          defense: defenseRank,
          specialAttack: 0,
          specialDefense: defenseRank,
          speed: 0,
        },
        isHelpingHand,
        isSpreadMove: isSpread,
        isCriticalHit,
      },
    };
  }, [weather, field, isHelpingHand, isSpreadMove, isCriticalHit]);

  // Auto-calculate when required fields are filled
  useEffect(() => {
    // トリガーの条件：攻撃側のポケモンA「ポケモン名」「技名」、攻撃側のポケモンB「ポケモン名」「技名」
    const isReadyToCalculate =
      attackerDataA?.pokemonName &&
      attackerDataA?.moveName &&
      attackerDataB?.pokemonName &&
      attackerDataB?.moveName;

    if (!isReadyToCalculate) {
      setResult(null);
      return;
    }

    // 防御側が未設定の場合はnullを使用して計算をスキップ
    if (!defenderData1 || !defenderData2) {
      setResult(null);
      return;
    }

    // Calculate for Target 1
    // Calculate for Target 1
    const target1AttackerA = calculateDamage(
      createInput(attackerDataA, defenderData1, false)
    );
    const target1AttackerB = calculateDamage(
      createInput(attackerDataB, defenderData1, false)
    );

    const target1Result: DoubleBattleResult["target1"] = {
      attackerAOnly: target1AttackerA,
      attackerBOnly: target1AttackerB,
      combined: combineDamage(target1AttackerA, target1AttackerB, defenderData1.hpStat),
    };

    // Calculate for Target 2
    const target2AttackerA = calculateDamage(
      createInput(attackerDataA, defenderData2, false)
    );
    const target2AttackerB = calculateDamage(
      createInput(attackerDataB, defenderData2, false)
    );

    const target2Result: DoubleBattleResult["target2"] = {
      attackerAOnly: target2AttackerA,
      attackerBOnly: target2AttackerB,
      combined: combineDamage(target2AttackerA, target2AttackerB, defenderData2.hpStat),
    };

    setResult({
      target1: target1Result,
      target2: target2Result,
    });
  }, [
    createInput,
    attackerDataA,
    attackerDataB,
    defenderData1,
    defenderData2,
    weather,
    field,
    isHelpingHand,
    isSpreadMove,
    isCriticalHit,
  ]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Results */}
      <DoubleBattleDamageResult
        result={result}
        target1Hp={defenderData1?.hpStat}
        target2Hp={defenderData2?.hpStat}
        target1Name={defenderData1?.pokemonName}
        target2Name={defenderData2?.pokemonName}
      />

      {/* Attacker Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          【攻撃側】
        </div>
        {expandedSections.attackers && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttackerInput
              onDataChange={setAttackerDataA}
              title="ポケモンA"
              idKey="attacker-a"
              isDetailsOpen={isAttackerDetailsOpen}
              onToggleDetails={toggleAttackerDetails}
            />
            <AttackerInput
              onDataChange={setAttackerDataB}
              title="ポケモンB"
              idKey="attacker-b"
              isDetailsOpen={isAttackerDetailsOpen}
              onToggleDetails={toggleAttackerDetails}
            />
          </div>
        )}
      </div>

      {/* Defender Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          【防御側】
        </div>
        {expandedSections.defenders && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DefenderInput
              onDataChange={setDefenderData1}
              title="対象①"
              idKey="target-1"
              isDetailsOpen={isDefenderDetailsOpen}
              onToggleDetails={toggleDefenderDetails}
            />
            <DefenderInput
              onDataChange={setDefenderData2}
              title="対象②"
              idKey="target-2"
              isDetailsOpen={isDefenderDetailsOpen}
              onToggleDetails={toggleDefenderDetails}
            />
          </div>
        )}
      </div>

      {/* Battle Conditions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          【バトル条件】
        </div>
        {expandedSections.conditions && (
          <BattleConditionInput
            weather={weather}
            field={field}
            isHelpingHand={isHelpingHand}
            isSpreadMove={isSpreadMove}
            isCriticalHit={isCriticalHit}
            onWeatherChange={setWeather}
            onFieldChange={setField}
            onHelpingHandChange={setIsHelpingHand}
            onSpreadMoveChange={setIsSpreadMove}
            onCriticalHitChange={setIsCriticalHit}
          />
        )}
      </div>
    </div>
  );
}
