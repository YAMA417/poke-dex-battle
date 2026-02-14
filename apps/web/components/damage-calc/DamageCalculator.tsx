"use client";

import { Button } from "@/components/ui/button";
import type {
  DamageCalculationInput,
  DamageResult as DamageResultType,
  Field,
  Weather,
} from "@poke-dex-battle/shared";
import { calculateDamage } from "@poke-dex-battle/shared";
import { useState, useEffect } from "react";
import type { AttackerData } from "./AttackerInput";
import { AttackerInput } from "./AttackerInput";
import { BattleConditionInput } from "./BattleConditionInput";
import { DoubleBattleDamageResult } from "./DoubleBattleDamageResult";
import type { DefenderData } from "./DefenderInput";
import { DefenderInput } from "./DefenderInput";

interface DoubleBattleResult {
  target1: {
    attackerAOnly: DamageResultType;
    attackerBOnly: DamageResultType;
    combined: DamageResultType;
  };
  target2: {
    attackerAOnly: DamageResultType;
    attackerBOnly: DamageResultType;
    combined: DamageResultType;
  };
}

export function DamageCalculator() {
  const [isMounted, setIsMounted] = useState(false);
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

  // マウント検出（ハイドレーションミスマッチ対策）
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Section expansion states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    attackers: true,
    defenders: true,
    conditions: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper function to create damage calculation input
  const createInput = (
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
  };

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
    const target1Result: DoubleBattleResult["target1"] = {
      attackerAOnly: calculateDamage(
        createInput(attackerDataA, defenderData1, false)
      ),
      attackerBOnly: calculateDamage(
        createInput(attackerDataB, defenderData1, false)
      ),
      combined: calculateDamage(
        createInput(attackerDataA, defenderData1, true)
      ),
    };

    // Calculate for Target 2
    const target2Result: DoubleBattleResult["target2"] = {
      attackerAOnly: calculateDamage(
        createInput(attackerDataA, defenderData2, false)
      ),
      attackerBOnly: calculateDamage(
        createInput(attackerDataB, defenderData2, false)
      ),
      combined: calculateDamage(
        createInput(attackerDataA, defenderData2, true)
      ),
    };

    setResult({
      target1: target1Result,
      target2: target2Result,
    });
  }, [
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
      {/* Attacker Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSection("attackers")}
            className="text-lg font-semibold hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="inline-block transition-transform" style={{ transform: expandedSections.attackers ? "rotate(0deg)" : "rotate(-90deg)" }}>
              ▼
            </span>
            【攻撃側】
          </button>
        </div>
        {expandedSections.attackers && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttackerInput onDataChange={setAttackerDataA} title="ポケモンA" />
            <AttackerInput onDataChange={setAttackerDataB} title="ポケモンB" />
          </div>
        )}
      </div>

      {/* Defender Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSection("defenders")}
            className="text-lg font-semibold hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="inline-block transition-transform" style={{ transform: expandedSections.defenders ? "rotate(0deg)" : "rotate(-90deg)" }}>
              ▼
            </span>
            【防御側】
          </button>
        </div>
        {expandedSections.defenders && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DefenderInput onDataChange={setDefenderData1} title="対象①" />
            <DefenderInput onDataChange={setDefenderData2} title="対象②" />
          </div>
        )}
      </div>

      {/* Battle Conditions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSection("conditions")}
            className="text-lg font-semibold hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="inline-block transition-transform" style={{ transform: expandedSections.conditions ? "rotate(0deg)" : "rotate(-90deg)" }}>
              ▼
            </span>
            【バトル条件】
          </button>
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

      {/* Results */}
      <DoubleBattleDamageResult
        result={result}
        target1Hp={defenderData1?.hpStat}
        target2Hp={defenderData2?.hpStat}
        target1Name={defenderData1?.pokemonName}
        target2Name={defenderData2?.pokemonName}
      />
    </div>
  );
}
