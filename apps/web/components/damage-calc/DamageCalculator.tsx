"use client";

import { Button } from "@/components/ui/button";
import type {
  DamageCalculationInput,
  DamageResult as DamageResultType,
  Field,
  Weather,
} from "@poke-dex-battle/shared";
import { calculateDamage } from "@poke-dex-battle/shared";
import { useState } from "react";
import type { AttackerData } from "./AttackerInput";
import { AttackerInput } from "./AttackerInput";
import { BattleConditionInput } from "./BattleConditionInput";
import { DamageResult } from "./DamageResult";
import type { DefenderData } from "./DefenderInput";
import { DefenderInput } from "./DefenderInput";

export function DamageCalculator() {
  const [attackerData, setAttackerData] = useState<AttackerData | null>(null);
  const [defenderData, setDefenderData] = useState<DefenderData | null>(null);

  const [weather, setWeather] = useState<Weather>("none");
  const [field, setField] = useState<Field>("none");
  const [isHelpingHand, setIsHelpingHand] = useState(false);
  const [isSpreadMove, setIsSpreadMove] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);

  const [result, setResult] = useState<DamageResultType | null>(null);

  const handleCalculate = () => {
    if (!attackerData || !defenderData) {
      return;
    }

    // Determine which stat to use based on move category
    const attackStat =
      attackerData.moveCategory === "Physical"
        ? attackerData.attackStat
        : attackerData.specialAttackStat;

    const defenseStat =
      attackerData.moveCategory === "Physical"
        ? defenderData.defenseStat
        : defenderData.specialDefenseStat;

    const attackRank =
      attackerData.moveCategory === "Physical"
        ? attackerData.attackRank
        : attackerData.specialAttackRank;

    const defenseRank =
      attackerData.moveCategory === "Physical"
        ? defenderData.defenseRank
        : defenderData.specialDefenseRank;

    // Create damage calculation input
    const input: DamageCalculationInput = {
      movePower: attackerData.movePower,
      moveType: attackerData.moveType,
      moveCategory: attackerData.moveCategory,
      attackerLevel: 50,
      attackerAttack: attackStat,
      attackerTypes: [], // Phase 1: no STAB
      defenderDefense: defenseStat,
      defenderTypes: [], // Phase 1: no type effectiveness
      defenderMaxHp: defenderData.hpStat,
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
        isSpreadMove,
        isCriticalHit,
      },
    };

    const calculatedResult = calculateDamage(input);
    setResult(calculatedResult);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttackerInput onDataChange={setAttackerData} />
        <DefenderInput onDataChange={setDefenderData} />
      </div>

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

      <div className="flex justify-center">
        <Button
          onClick={handleCalculate}
          size="lg"
          className="w-full max-w-md"
          disabled={!attackerData || !defenderData}
        >
          計算する
        </Button>
      </div>

      <DamageResult result={result} defenderMaxHp={defenderData?.hpStat} />
    </div>
  );
}
