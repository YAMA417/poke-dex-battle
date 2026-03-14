'use client';

import type { Stats } from '@poke-dex-battle/shared';
import { clampEv, calcEvTotal, MAX_EV_PER_STAT, MAX_EV_TOTAL } from '@poke-dex-battle/shared';

const STAT_LABELS: { key: keyof Stats; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: '攻撃' },
  { key: 'defense', label: '防御' },
  { key: 'specialAttack', label: '特攻' },
  { key: 'specialDefense', label: '特防' },
  { key: 'speed', label: '素早さ' },
];

interface EVSliderProps {
  evs: Stats;
  natureUp?: keyof Stats;
  natureDown?: keyof Stats;
  onChange: (newEvs: Stats) => void;
}

export function EVSlider({ evs, natureUp, natureDown, onChange }: EVSliderProps) {
  const total = calcEvTotal(evs);
  const remaining = MAX_EV_TOTAL - total;
  const pct = Math.round((total / MAX_EV_TOTAL) * 100);

  function handleChange(stat: keyof Stats, value: number) {
    const clamped = clampEv(evs, stat, value);
    onChange({ ...evs, [stat]: clamped });
  }

  function handleInputChange(stat: keyof Stats, raw: string) {
    const num = parseInt(raw, 10);
    if (!isNaN(num)) handleChange(stat, num);
  }

  return (
    <div className="space-y-3">
      {/* 合計バー */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span className="font-semibold">努力値合計</span>
          <span
            className={`font-bold tabular-nums ${remaining === 0 ? 'text-red-500' : 'text-gray-700'}`}
          >
            {total} <span className="font-normal text-gray-400">/ {MAX_EV_TOTAL}</span>
            {remaining > 0 && (
              <span className="ml-1 font-normal text-green-600">（残り{remaining}）</span>
            )}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              remaining === 0 ? 'bg-red-400' : 'bg-pokemon-blue'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* グリッドレイアウト(3列) */}
      <div className="grid grid-cols-3 gap-2">
        {STAT_LABELS.map(({ key, label }) => {
          const isUp = natureUp === key;
          const isDown = natureDown === key;
          const currentVal = evs[key];
          const displayLabel = `${label}${isUp ? ' ↑' : isDown ? ' ↓' : ''}`;
          const labelColorClass = isUp
            ? 'text-red-500'
            : isDown
              ? 'text-blue-500'
              : 'text-gray-500';

          return (
            <div key={key} className="flex flex-col gap-0.5">
              <label className={`text-[10px] font-medium ${labelColorClass}`}>{displayLabel}</label>
              <input
                type="number"
                min={0}
                max={MAX_EV_PER_STAT}
                value={currentVal}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full rounded border border-gray-200 px-1 py-1 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
              />
            </div>
          );
        })}
      </div>

      {/* クイックボタン */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() =>
            onChange({
              hp: 0,
              attack: 0,
              defense: 0,
              specialAttack: 0,
              specialDefense: 0,
              speed: 0,
            })
          }
          className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50"
        >
          すべてリセット
        </button>
      </div>
    </div>
  );
}
