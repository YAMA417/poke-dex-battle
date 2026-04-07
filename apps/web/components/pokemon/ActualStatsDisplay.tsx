'use client';

import { Pokemon } from '@poke-dex-battle/shared';
import {
  calcActualStats,
  calcAbilityPointTotal,
  MAX_ABILITY_POINT_TOTAL,
  splitActualStatsByAbilityPoint,
} from '@poke-dex-battle/shared';
import type { BaseStats, Nature, Stats } from '@poke-dex-battle/shared';
import { POKEMON_TYPE_COLORS, NATURE_EFFECTS_MAP } from '@/lib/constants';
import { POKEMON_TYPE_LABELS_JA } from '@poke-dex-battle/shared';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  colorClass?: string;
}

/**
 * 能力ポイント増加分を色分けして表示するバー
 */
interface StatBarWithEvProps {
  label: string;
  baseValue: number;
  evContribution: number;
  max?: number;
  baseValueColor?: string;
  evContributionColor?: string;
}

function StatBar({ label, value, max = 255, colorClass = 'bg-blue-500' }: StatBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-right text-xs text-gray-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/**
 * 基本値と能力ポイント増加分を色分けして表示
 */
function StatBarWithEv({
  label,
  baseValue,
  evContribution,
  max = 255,
  baseValueColor = 'bg-pokemon-blue',
  evContributionColor = 'bg-orange-400',
}: StatBarWithEvProps) {
  const totalValue = baseValue + evContribution;
  const basePct = Math.min(100, Math.round((baseValue / max) * 100));
  const evPct = Math.min(100, Math.round((evContribution / max) * 100));

  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-right text-xs text-gray-500">{label}</span>
      <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${baseValueColor}`}
          style={{ width: `${basePct}%` }}
        />
        <div
          className={`h-full transition-all duration-300 ${evContributionColor}`}
          style={{ width: `${evPct}%` }}
        />
      </div>
      <div className="w-6 text-right text-xs font-semibold tabular-nums">
        <span>{totalValue}</span>
      </div>
      <div className="w-3 text-right text-xs font-semibold tabular-nums">
        <span className="text-[10px] text-gray-400">+{evContribution}</span>
      </div>
    </div>
  );
}

type ActualStatsDisplayProps = {
  pokemon: Pokemon;
  baseStats: BaseStats;
  showEvContribution?: boolean;
  baseValueColor?: string;
  evContributionColor?: string;
  /**
   * Callback when actual stat value is changed by user input.
   * Only effective when showEvContribution is true.
   */
  onStatChange?: (stat: keyof Stats, targetValue: number) => void;
  /**
   * Validation errors for each stat.
   * Only effective when showEvContribution is true.
   */
  statErrors?: Partial<Record<keyof Stats, string>>;
  /**
   * Controlled input values for stat editing.
   * Only effective when showEvContribution is true.
   */
  actualStatInputs?: Partial<Record<keyof Stats, string>>;
  /**
   * Callback when stat input value changes (for controlled input).
   * Only effective when showEvContribution is true.
   */
  onStatInputChange?: (stat: keyof Stats, value: string) => void;
  /**
   * Callback when stat input loses focus.
   * Only effective when showEvContribution is true.
   */
  onStatInputBlur?: (stat: keyof Stats) => void;
};

export function ActualStatsDisplay({
  pokemon,
  baseStats,
  showEvContribution = false,
  baseValueColor = 'bg-pokemon-blue',
  evContributionColor = 'bg-orange-400',
  onStatChange,
  statErrors = {},
  actualStatInputs = {},
  onStatInputChange,
  onStatInputBlur,
}: ActualStatsDisplayProps) {
  const actual = calcActualStats(baseStats, pokemon.abilityPoints, pokemon.nature);

  // 能力ポイント増加分を表示する場合、基本値と増加分を計算
  const splitStats = showEvContribution
    ? splitActualStatsByAbilityPoint(baseStats, pokemon.abilityPoints, pokemon.nature)
    : null;

  const NATURE_UP_DOWN = getNatureEffect(pokemon.nature);
  const abilityPointTotal = calcAbilityPointTotal(pokemon.abilityPoints);
  const isAbilityPointAtMax = abilityPointTotal >= MAX_ABILITY_POINT_TOTAL;

  const stats: { key: keyof Stats; label: string; barColor: string }[] = [
    { key: 'hp', label: 'H', barColor: 'bg-red-400' },
    { key: 'attack', label: 'A', barColor: 'bg-orange-400' },
    { key: 'defense', label: 'B', barColor: 'bg-yellow-400' },
    { key: 'specialAttack', label: 'C', barColor: 'bg-blue-400' },
    { key: 'specialDefense', label: 'D', barColor: 'bg-green-400' },
    { key: 'speed', label: 'S', barColor: 'bg-pink-400' },
  ];

  return (
    <div className="space-y-1.5">
      {/* 能力ポイント合計 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span className="font-semibold">能力ポイント合計</span>
          <span
            className={`font-bold tabular-nums ${isAbilityPointAtMax ? 'text-red-500' : 'text-gray-700'}`}
          >
            {abilityPointTotal}{' '}
            <span className="font-normal text-gray-400">/ {MAX_ABILITY_POINT_TOTAL}</span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isAbilityPointAtMax ? 'bg-red-400' : 'bg-pokemon-blue'
            }`}
            style={{
              width: `${Math.min(100, Math.round((abilityPointTotal / MAX_ABILITY_POINT_TOTAL) * 100))}%`,
            }}
          />
        </div>
      </div>

      <div className="mb-1 text-xs font-semibold text-gray-600">実数値</div>
      {stats.map(({ key, label, barColor }) => {
        const isUp = NATURE_UP_DOWN.up === key;
        const isDown = NATURE_UP_DOWN.down === key;

        // 能力ポイント増加分を表示する場合
        if (showEvContribution && splitStats) {
          const split = splitStats[key];
          const max = key === 'hp' ? 230 : 200;
          const error = statErrors?.[key];

          return (
            <div
              key={key}
              className={`flex items-center gap-1 ${error ? 'rounded bg-amber-50 p-1' : ''}`}
            >
              <span
                className={`w-4 text-xs font-bold ${
                  isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {label}
              </span>
              <div className="flex flex-1 items-center gap-2">
                <div className="flex-1">
                  <StatBarWithEv
                    label=""
                    baseValue={split.baseValue}
                    evContribution={split.evContribution}
                    max={max}
                    baseValueColor={baseValueColor}
                    evContributionColor={evContributionColor}
                  />
                </div>
                {/* 実数値入力フィールド（onStatChange が渡された場合のみ） */}
                {onStatChange && (
                  <input
                    type="number"
                    min={1}
                    value={actualStatInputs[key] ?? split.baseValue + split.evContribution}
                    onChange={(e) => onStatInputChange?.(key, e.target.value)}
                    onBlur={() => onStatInputBlur?.(key)}
                    className={`w-16 rounded border px-1 py-0.5 text-right text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-pokemon-blue ${
                      error ? 'border-amber-300 bg-white' : 'border-gray-200'
                    }`}
                  />
                )}
              </div>
              {error && (
                <span className="ml-1 max-w-[100px] text-right text-[10px] text-amber-600">
                  {error}
                </span>
              )}
            </div>
          );
        }

        // 通常の表示（能力ポイント増加分なし）
        return (
          <div key={key} className="flex items-center gap-1">
            <span
              className={`w-4 text-xs font-bold ${
                isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {label}
            </span>
            <div className="flex-1">
              <StatBar
                label=""
                value={actual[key]}
                max={key === 'hp' ? 230 : 200}
                colorClass={isUp ? 'bg-red-400' : isDown ? 'bg-blue-300' : barColor}
              />
            </div>
          </div>
        );
      })}
      {/* テラスタイプバッジ */}
      <div className="flex items-center gap-1 pt-2">
        <span className="text-xs text-gray-500">テラスタイプ:</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
            POKEMON_TYPE_COLORS[pokemon.teraType] ?? 'bg-gray-400'
          }`}
        >
          {POKEMON_TYPE_LABELS_JA[pokemon.teraType] ?? pokemon.teraType}
        </span>
      </div>
    </div>
  );
}

/**
 * Convert NATURE_EFFECTS_MAP array format [+stat, -stat] to object format {up, down}
 */
function getNatureEffect(nature: Nature): { up?: keyof Stats; down?: keyof Stats } {
  const effects = NATURE_EFFECTS_MAP[nature];
  if (!effects || effects.length === 0) return {};
  return {
    up: effects[0],
    down: effects[1],
  };
}
