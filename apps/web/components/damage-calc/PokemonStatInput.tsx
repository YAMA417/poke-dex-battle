'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calcOtherStat } from '@poke-dex-battle/shared';
import { useState, useEffect, useRef } from 'react';

type StatType = 'attack' | 'defense' | 'specialAttack' | 'specialDefense';

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
  const [mode, setMode] = useState<'manual' | 'auto'>('auto');
  const [iv, setIv] = useState(31);
  const [ev, setEv] = useState(32);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // natureModifier or baseStat が変更されたら自動で再計算
  useEffect(() => {
    if (mode === 'auto') {
      const calculated = calcOtherStat(baseStat, ev, natureModifier);
      onChangeRef.current(calculated);
    }
  }, [natureModifier, baseStat, mode, iv, ev, level]);

  const handleModeToggle = () => {
    if (mode === 'manual') {
      const calculated = calcOtherStat(baseStat, ev, natureModifier);
      onChange(calculated);
      setMode('auto');
    } else {
      setMode('manual');
    }
  };

  const handleIvChange = (newIv: number) => {
    setIv(newIv);
    if (mode === 'auto') {
      const calculated = calcOtherStat(baseStat, ev, natureModifier);
      onChange(calculated);
    }
  };

  const handleEvChange = (newEv: number) => {
    setEv(newEv);
    if (mode === 'auto') {
      const calculated = calcOtherStat(baseStat, newEv, natureModifier);
      onChange(calculated);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleModeToggle}>
          {mode === 'manual' ? '自動計算に切替' : '手動入力に切替'}
        </Button>
      </div>

      {mode === 'manual' ? (
        <div className="space-y-2">
          <Input
            type="number"
            min={1}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(parseInt(e.target.value) || 1)
            }
            placeholder="実数値を入力"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${statType}-iv`} className="text-xs">
                個体値
              </Label>
              <Input
                id={`${statType}-iv`}
                type="number"
                min={0}
                max={31}
                value={iv}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleIvChange(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${statType}-ev`} className="text-xs">
                ���力ポイント
              </Label>
              <Input
                id={`${statType}-ev`}
                type="number"
                min={0}
                max={32}
                step={1}
                value={ev}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleEvChange(Math.max(0, Math.min(32, parseInt(e.target.value) || 0)))
                }
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            実数値: <span className="font-bold text-foreground">{value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
