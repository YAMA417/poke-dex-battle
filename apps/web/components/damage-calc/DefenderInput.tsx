"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StatStage } from "@poke-dex-battle/shared";
import { calcHpStat } from "@poke-dex-battle/shared";
import { useState } from "react";
import { NatureModifierRadio } from "./NatureModifierRadio";
import { PokemonStatInput } from "./PokemonStatInput";

const STAT_STAGES: StatStage[] = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

interface DefenderInputProps {
  onDataChange: (data: DefenderData) => void;
}

export interface DefenderData {
  pokemonName: string;
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
}

export function DefenderInput({ onDataChange }: DefenderInputProps) {
  const [pokemonName, setPokemonName] = useState("");

  const [hpBaseStat, setHpBaseStat] = useState(100);
  const [defenseBaseStat, setDefenseBaseStat] = useState(100);
  const [specialDefenseBaseStat, setSpecialDefenseBaseStat] = useState(100);

  const [hpStat, setHpStat] = useState(165);
  const [defenseStat, setDefenseStat] = useState(152);
  const [specialDefenseStat, setSpecialDefenseStat] = useState(152);

  const [defenseModifier, setDefenseModifier] = useState<1.1 | 1.0 | 0.9>(1.0);
  const [specialDefenseModifier, setSpecialDefenseModifier] = useState<1.1 | 1.0 | 0.9>(1.0);

  const [defenseRank, setDefenseRank] = useState<StatStage>(0);
  const [specialDefenseRank, setSpecialDefenseRank] = useState<StatStage>(0);

  const [hpMode, setHpMode] = useState<"manual" | "auto">("auto");
  const [hpIv, setHpIv] = useState(31);
  const [hpEv, setHpEv] = useState(252);

  const notifyChange = (updates: Partial<DefenderData>) => {
    const data: DefenderData = {
      pokemonName,
      hpBaseStat,
      defenseBaseStat,
      specialDefenseBaseStat,
      hpStat,
      defenseStat,
      specialDefenseStat,
      defenseModifier,
      specialDefenseModifier,
      defenseRank,
      specialDefenseRank,
      ...updates,
    };
    onDataChange(data);
  };

  const calculateHp = (base: number, iv: number, ev: number) => {
    return calcHpStat(base, iv, ev, 50);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defender</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="defender-pokemon-name">Pokemon Name</Label>
          <Input
            id="defender-pokemon-name"
            type="text"
            value={pokemonName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPokemonName(e.target.value);
              notifyChange({ pokemonName: e.target.value });
            }}
            placeholder="Enter Pokemon name"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Base Stats</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hp-base-stat">HP</Label>
              <Input
                id="hp-base-stat"
                type="number"
                min={1}
                max={255}
                value={hpBaseStat}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value) || 1;
                  setHpBaseStat(value);
                  if (hpMode === "auto") {
                    const calculated = calculateHp(value, hpIv, hpEv);
                    setHpStat(calculated);
                    notifyChange({ hpBaseStat: value, hpStat: calculated });
                  } else {
                    notifyChange({ hpBaseStat: value });
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defense-base-stat">Defense</Label>
              <Input
                id="defense-base-stat"
                type="number"
                min={1}
                max={255}
                value={defenseBaseStat}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value) || 1;
                  setDefenseBaseStat(value);
                  notifyChange({ defenseBaseStat: value });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="special-defense-base-stat">Sp.Def</Label>
              <Input
                id="special-defense-base-stat"
                type="number"
                min={1}
                max={255}
                value={specialDefenseBaseStat}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value) || 1;
                  setSpecialDefenseBaseStat(value);
                  notifyChange({ specialDefenseBaseStat: value });
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Stats</h3>

          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label>HP</Label>
              <button
                type="button"
                className="text-xs px-2 py-1 border rounded hover:bg-accent"
                onClick={() => {
                  if (hpMode === "manual") {
                    const calculated = calculateHp(hpBaseStat, hpIv, hpEv);
                    setHpStat(calculated);
                    setHpMode("auto");
                    notifyChange({ hpStat: calculated });
                  } else {
                    setHpMode("manual");
                  }
                }}
              >
                {hpMode === "manual" ? "Auto" : "Manual"}
              </button>
            </div>

            {hpMode === "manual" ? (
              <Input
                type="number"
                min={1}
                value={hpStat}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value) || 1;
                  setHpStat(value);
                  notifyChange({ hpStat: value });
                }}
                placeholder="Enter stat value"
              />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="hp-iv" className="text-xs">
                      IV
                    </Label>
                    <Input
                      id="hp-iv"
                      type="number"
                      min={0}
                      max={31}
                      value={hpIv}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = Math.max(0, Math.min(31, parseInt(e.target.value) || 0));
                        setHpIv(value);
                        const calculated = calculateHp(hpBaseStat, value, hpEv);
                        setHpStat(calculated);
                        notifyChange({ hpStat: calculated });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hp-ev" className="text-xs">
                      EV
                    </Label>
                    <Input
                      id="hp-ev"
                      type="number"
                      min={0}
                      max={252}
                      step={4}
                      value={hpEv}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = Math.max(0, Math.min(252, parseInt(e.target.value) || 0));
                        setHpEv(value);
                        const calculated = calculateHp(hpBaseStat, hpIv, value);
                        setHpStat(calculated);
                        notifyChange({ hpStat: calculated });
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Stat: <span className="font-bold text-foreground">{hpStat}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 p-4 border rounded-lg">
            <NatureModifierRadio
              statName="Defense"
              value={defenseModifier}
              onChange={(modifier) => {
                setDefenseModifier(modifier);
                notifyChange({ defenseModifier: modifier });
              }}
            />
            <PokemonStatInput
              label="Defense"
              statType="defense"
              level={50}
              natureModifier={defenseModifier}
              baseStat={defenseBaseStat}
              value={defenseStat}
              onChange={(value) => {
                setDefenseStat(value);
                notifyChange({ defenseStat: value });
              }}
            />
          </div>

          <div className="space-y-3 p-4 border rounded-lg">
            <NatureModifierRadio
              statName="Sp.Def"
              value={specialDefenseModifier}
              onChange={(modifier) => {
                setSpecialDefenseModifier(modifier);
                notifyChange({ specialDefenseModifier: modifier });
              }}
            />
            <PokemonStatInput
              label="Sp.Def"
              statType="specialDefense"
              level={50}
              natureModifier={specialDefenseModifier}
              baseStat={specialDefenseBaseStat}
              value={specialDefenseStat}
              onChange={(value) => {
                setSpecialDefenseStat(value);
                notifyChange({ specialDefenseStat: value });
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Stat Stages</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="defense-rank">Defense</Label>
              <Select
                value={defenseRank.toString()}
                onValueChange={(value: string) => {
                  const rank = parseInt(value) as StatStage;
                  setDefenseRank(rank);
                  notifyChange({ defenseRank: rank });
                }}
              >
                <SelectTrigger id="defense-rank">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAT_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage.toString()}>
                      {stage > 0 ? `+${stage}` : stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="special-defense-rank">Sp.Def</Label>
              <Select
                value={specialDefenseRank.toString()}
                onValueChange={(value: string) => {
                  const rank = parseInt(value) as StatStage;
                  setSpecialDefenseRank(rank);
                  notifyChange({ specialDefenseRank: rank });
                }}
              >
                <SelectTrigger id="special-defense-rank">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAT_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage.toString()}>
                      {stage > 0 ? `+${stage}` : stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Other</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="defender-ability">Ability</Label>
              <Select value="none" disabled>
                <SelectTrigger id="defender-ability">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defender-item">Item</Label>
              <Select value="none" disabled>
                <SelectTrigger id="defender-item">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
