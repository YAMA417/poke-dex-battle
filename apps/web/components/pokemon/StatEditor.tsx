'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import type { Stats, BaseStats, Nature } from '@poke-dex-battle/shared';
import {
  splitActualStatsByAbilityPoint,
  calcAbilityPointTotal,
  clampAbilityPoint,
  findClosestRealizableAbilityPoint,
  getNatureModifier,
  MAX_ABILITY_POINT_TOTAL,
  MAX_ABILITY_POINT_PER_STAT,
} from '@poke-dex-battle/shared';
import { NATURE_EFFECTS_MAP } from '@/lib/constants';

/** ステータスの定義 */
const STAT_DEFS: { key: keyof Stats; short: string; nameJa: string }[] = [
  { key: 'hp', short: 'H', nameJa: 'HP' },
  { key: 'attack', short: 'A', nameJa: '攻撃' },
  { key: 'defense', short: 'B', nameJa: '防御' },
  { key: 'specialAttack', short: 'C', nameJa: '特攻' },
  { key: 'specialDefense', short: 'D', nameJa: '特防' },
  { key: 'speed', short: 'S', nameJa: '素早さ' },
];

/** バーの最大値（表示用） */
const BAR_MAX_HP = 230;
const BAR_MAX_OTHER = 200;

/** 能力ポイントの初期値 */
const ZERO_ABILITY_POINTS: Stats = {
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
};

interface StatEditorProps {
  abilityPoints: Stats;
  baseStats: BaseStats;
  nature: Nature;
  onChange: (abilityPoints: Stats) => void;
}

/**
 * 能力ポイント編集 + 実数値表示を統合したコンポーネント
 * EVSlider + ActualStatsDisplay を1つにまとめたもの
 */
export const StatEditor = memo(function StatEditor({
  abilityPoints,
  baseStats,
  nature,
  onChange,
}: StatEditorProps): React.ReactElement {
  const [actualStatInputs, setActualStatInputs] = useState<Partial<Record<keyof Stats, string>>>(
    {}
  );
  const [actualStatErrors, setActualStatErrors] = useState<Partial<Record<keyof Stats, string>>>(
    {}
  );

  // 性格補正の取得
  const natureEffect = NATURE_EFFECTS_MAP[nature] ?? [];
  const natureUp = natureEffect[0] as keyof Stats | undefined;
  const natureDown = natureEffect[1] as keyof Stats | undefined;

  // 合計・残り計算
  const total = calcAbilityPointTotal(abilityPoints);
  const remaining = MAX_ABILITY_POINT_TOTAL - total;
  const totalPct = Math.min(100, Math.round((total / MAX_ABILITY_POINT_TOTAL) * 100));
  const isAtMax = remaining <= 0;

  // 実数値の分割計算
  const splitStats = useMemo(
    () => splitActualStatsByAbilityPoint(baseStats, abilityPoints, nature),
    [baseStats, abilityPoints, nature]
  );

  // 能力ポイント直接変更
  const handleAbilityPointChange = useCallback(
    (stat: keyof Stats, raw: string): void => {
      const num = parseInt(raw, 10);
      if (isNaN(num)) return;
      const clamped = clampAbilityPoint(abilityPoints, stat, num);
      onChange({ ...abilityPoints, [stat]: clamped });
      // エラーをクリア
      setActualStatErrors((prev) => {
        const next = { ...prev };
        delete next[stat];
        return next;
      });
    },
    [abilityPoints, onChange]
  );

  // 実数値入力 → 能力ポイント逆算
  const handleActualStatChange = useCallback(
    (stat: keyof Stats, targetStat: number): void => {
      const isHp = stat === 'hp';
      const baseStat = baseStats[stat];
      const natureModifier = isHp ? 1 : getNatureModifier(nature, stat as keyof Omit<Stats, 'hp'>);

      const { abilityPoint: newAbilityPoint, actualStat } = findClosestRealizableAbilityPoint(
        targetStat,
        baseStat,
        natureModifier,
        isHp
      );

      const updatedAbilityPoints = { ...abilityPoints, [stat]: newAbilityPoint };
      const newTotal = Object.values(updatedAbilityPoints).reduce((sum, v) => sum + v, 0);

      // エラーハンドリング
      const errors: Partial<Record<keyof Stats, string>> = {};
      if (targetStat < 1) {
        errors[stat] = '1 以上の値が必要です';
      } else if (newAbilityPoint > MAX_ABILITY_POINT_PER_STAT) {
        errors[stat] = `最大${MAX_ABILITY_POINT_PER_STAT}Pで実数値${actualStat}に調整`;
      } else if (newTotal > MAX_ABILITY_POINT_TOTAL) {
        errors[stat] = `合計超過（${newTotal}/${MAX_ABILITY_POINT_TOTAL}）`;
      }

      setActualStatErrors(errors);
      onChange(updatedAbilityPoints);
    },
    [abilityPoints, baseStats, nature, onChange]
  );

  // 実数値入力フィールドの変更
  const handleStatInputChange = useCallback(
    (stat: keyof Stats, value: string): void => {
      setActualStatInputs((prev) => ({ ...prev, [stat]: value }));
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        handleActualStatChange(stat, num);
      }
    },
    [handleActualStatChange]
  );

  // 実数値入力フィールドのフォーカス解除
  const handleStatInputBlur = useCallback((stat: keyof Stats): void => {
    setActualStatInputs((prev) => {
      const next = { ...prev };
      delete next[stat];
      return next;
    });
  }, []);

  // リセット
  const handleReset = useCallback((): void => {
    onChange(ZERO_ABILITY_POINTS);
    setActualStatErrors({});
    setActualStatInputs({});
  }, [onChange]);

  return (
    <div className="space-y-3">
      {/* 能力ポイント合計バー */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="font-semibold">能力ポイント合計</span>
          <span className={`font-bold tabular-nums ${isAtMax ? 'text-red-500' : 'text-gray-700'}`}>
            {total} <span className="font-normal text-gray-400">/ {MAX_ABILITY_POINT_TOTAL}</span>
            {remaining > 0 && (
              <span className="ml-1 font-normal text-green-600">（残り{remaining}）</span>
            )}
          </span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-valuenow={total}
          aria-valuemin={0}
          aria-valuemax={MAX_ABILITY_POINT_TOTAL}
          aria-label={`能力ポイント合計 ${total}/${MAX_ABILITY_POINT_TOTAL}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isAtMax ? 'bg-red-400' : 'bg-pokemon-blue'
            }`}
            style={{ width: `${totalPct}%` }}
          />
        </div>
      </div>

      {/* 6ステータス行 */}
      <div className="space-y-1.5">
        {STAT_DEFS.map(({ key, short, nameJa }) => {
          const isUp = natureUp === key;
          const isDown = natureDown === key;
          const split = splitStats[key];
          const actualValue = split.baseValue + split.evContribution;
          const barMax = key === 'hp' ? BAR_MAX_HP : BAR_MAX_OTHER;
          const basePct = Math.min(100, Math.round((split.baseValue / barMax) * 100));
          const evPct = Math.min(100, Math.round((split.evContribution / barMax) * 100));
          const error = actualStatErrors[key];
          const currentAP = abilityPoints[key];

          return (
            <div key={key} className={`rounded px-2 py-1 ${error ? 'bg-amber-50' : ''}`}>
              <div className="flex items-center gap-2">
                {/* ラベル + 性格補正 */}
                <div className="flex w-14 shrink-0 items-center gap-1">
                  <span
                    className={`text-xs font-bold ${
                      isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  >
                    {short}
                  </span>
                  <span className="text-[10px] text-gray-400">{nameJa}</span>
                  {isUp && (
                    <span className="text-[10px] font-bold text-red-500" aria-label="性格上昇補正">
                      ↑
                    </span>
                  )}
                  {isDown && (
                    <span className="text-[10px] font-bold text-blue-500" aria-label="性格下降補正">
                      ↓
                    </span>
                  )}
                </div>

                {/* カラーバー */}
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-pokemon-blue transition-all duration-200"
                    style={{ width: `${basePct}%` }}
                  />
                  <div
                    className="h-full bg-orange-400 transition-all duration-200"
                    style={{ width: `${evPct}%` }}
                  />
                </div>

                {/* 実数値入力 */}
                <label className="sr-only" htmlFor={`stat-actual-${key}`}>
                  {nameJa}の実数値
                </label>
                <input
                  id={`stat-actual-${key}`}
                  type="number"
                  min={1}
                  value={actualStatInputs[key] ?? actualValue}
                  onChange={(e) => handleStatInputChange(key, e.target.value)}
                  onBlur={() => handleStatInputBlur(key)}
                  className={`w-14 rounded border px-1 py-0.5 text-right text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-pokemon-blue ${
                    error ? 'border-amber-300 bg-white' : 'border-gray-200'
                  }`}
                  aria-describedby={error ? `stat-error-${key}` : undefined}
                  aria-invalid={error ? true : undefined}
                />

                {/* 能力ポイント入力 */}
                <label className="sr-only" htmlFor={`stat-ap-${key}`}>
                  {nameJa}の能力ポイント
                </label>
                <div className="flex w-16 shrink-0 items-center gap-0.5">
                  <input
                    id={`stat-ap-${key}`}
                    type="number"
                    min={0}
                    max={MAX_ABILITY_POINT_PER_STAT}
                    value={currentAP}
                    onChange={(e) => handleAbilityPointChange(key, e.target.value)}
                    className="w-10 rounded border border-gray-200 px-1 py-0.5 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
                  />
                  <span className="text-[10px] text-gray-400">P</span>
                </div>
              </div>

              {/* エラー表示 */}
              {error && (
                <p
                  id={`stat-error-${key}`}
                  className="mt-0.5 pl-14 text-[10px] text-amber-600"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 凡例 + リセット */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-pokemon-blue" aria-hidden="true" />
            基本値
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-orange-400" aria-hidden="true" />
            能力P増加分
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50"
        >
          すべてリセット
        </button>
      </div>
    </div>
  );
});
