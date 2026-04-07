'use client';

import type { Stats } from '@poke-dex-battle/shared';

const STAT_LABELS: { key: keyof Stats; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: '攻撃' },
  { key: 'defense', label: '防御' },
  { key: 'specialAttack', label: '特攻' },
  { key: 'specialDefense', label: '特防' },
  { key: 'speed', label: '素早さ' },
];

interface IVInputGridProps {
  ivs: Stats;
  onChange: (newIvs: Stats) => void;
}

export function IVInputGrid({ ivs, onChange }: IVInputGridProps) {
  function handleChange(stat: keyof Stats, raw: string) {
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(31, num));
    onChange({ ...ivs, [stat]: clamped });
  }

  return (
    <div className="space-y-1">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">個体値 (0–31)</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() =>
              onChange({
                hp: 31,
                attack: 31,
                defense: 31,
                specialAttack: 31,
                specialDefense: 31,
                speed: 31,
              })
            }
            className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-50"
          >
            すべて31
          </button>
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
            className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-50"
          >
            すべて0
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {STAT_LABELS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-gray-500">{label}</label>
            <input
              type="number"
              min={0}
              max={31}
              value={ivs[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full rounded border border-gray-200 px-1 py-1 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
