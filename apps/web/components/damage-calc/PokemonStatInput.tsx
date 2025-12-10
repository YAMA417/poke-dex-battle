"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcOtherStat } from "@poke-dex-battle/shared";
import { useState } from "react";

type StatType = "attack" | "defense" | "specialAttack" | "specialDefense";

interface PokemonStatInputProps {
  label: string;
  statType: StatType;
  level: number;
  natureModifier: number;
  baseStat: number;
  value: number;
  onChange: (value: number) => void;
}

export function PokemonStatInput({
  label,
  statType,
  level,
  natureModifier,
  baseStat,
  value,
  onChange,
}: PokemonStatInputProps) {
  const [mode, setMode] = useState<"manual" | "auto">("auto");
  const [iv, setIv] = useState(31);
  const [ev, setEv] = useState(252);

  const handleModeToggle = () => {
    if (mode === "manual") {
      // KÕ’êÕþ(n-šg—
      const calculated = calcOtherStat(baseStat, iv, ev, level, natureModifier);
      onChange(calculated);
      setMode("auto");
    } else {
      // êÕ’KÕþ(n$’­
      setMode("manual");
    }
  };

  // IV~_oEVL	ôUŒ_‰êÕ—
  const handleIvChange = (newIv: number) => {
    setIv(newIv);
    if (mode === "auto") {
      const calculated = calcOtherStat(
        baseStat,
        newIv,
        ev,
        level,
        natureModifier
      );
      onChange(calculated);
    }
  };

  const handleEvChange = (newEv: number) => {
    setEv(newEv);
    if (mode === "auto") {
      const calculated = calcOtherStat(
        baseStat,
        iv,
        newEv,
        level,
        natureModifier
      );
      onChange(calculated);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleModeToggle}
        >
          {mode === "manual" ? "êÕ—kÿ" : "KÕe›kÿ"}
        </Button>
      </div>

      {mode === "manual" ? (
        <div className="space-y-2">
          <Input
            type="number"
            min={1}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(parseInt(e.target.value) || 1)
            }
            placeholder="Ÿp$’e›"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${statType}-iv`} className="text-xs">
                S$ (IV)
              </Label>
              <Input
                id={`${statType}-iv`}
                type="number"
                min={0}
                max={31}
                value={iv}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleIvChange(
                    Math.max(0, Math.min(31, parseInt(e.target.value) || 0))
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${statType}-ev`} className="text-xs">
                ª›$ (EV)
              </Label>
              <Input
                id={`${statType}-ev`}
                type="number"
                min={0}
                max={252}
                step={4}
                value={ev}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleEvChange(
                    Math.max(0, Math.min(252, parseInt(e.target.value) || 0))
                  )
                }
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Ÿp$: <span className="font-bold text-foreground">{value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
