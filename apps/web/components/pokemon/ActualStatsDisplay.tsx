'use client';

import { Pokemon } from '@poke-dex-battle/shared';
import { calcActualStats, calcEvContributionToActualStats, MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS, splitActualStatsByEvContribution } from '@poke-dex-battle/shared';
import type { BaseStats, Nature, Stats } from '@poke-dex-battle/shared';

const TYPE_COLORS: Record<string, string> = {
    Normal: 'bg-gray-400',
    Fire: 'bg-orange-500',
    Water: 'bg-blue-500',
    Electric: 'bg-yellow-400',
    Grass: 'bg-green-500',
    Ice: 'bg-cyan-300',
    Fighting: 'bg-red-700',
    Poison: 'bg-purple-500',
    Ground: 'bg-yellow-600',
    Flying: 'bg-indigo-300',
    Psychic: 'bg-pink-500',
    Bug: 'bg-lime-500',
    Rock: 'bg-yellow-800',
    Ghost: 'bg-purple-800',
    Dragon: 'bg-indigo-700',
    Dark: 'bg-gray-800',
    Steel: 'bg-gray-500',
    Fairy: 'bg-pink-300',
};

const TYPE_LABELS: Record<string, string> = {
    Normal: 'ノーマル',
    Fire: 'ほのお',
    Water: 'みず',
    Electric: 'でんき',
    Grass: 'くさ',
    Ice: 'こおり',
    Fighting: 'かくとう',
    Poison: 'どく',
    Ground: 'じめん',
    Flying: 'ひこう',
    Psychic: 'エスパー',
    Bug: 'むし',
    Rock: 'いわ',
    Ghost: 'ゴースト',
    Dragon: 'ドラゴン',
    Dark: 'あく',
    Steel: 'はがね',
    Fairy: 'フェアリー',
};

interface StatBarProps {
    label: string;
    value: number;
    max?: number;
    colorClass?: string;
}

/**
 * EV増加分を色分けして表示するバー
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
            <span className="text-xs text-gray-500 w-8 shrink-0 text-right">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-semibold w-8 text-right tabular-nums">{value}</span>
        </div>
    );
}

/**
 * 基本値とEV増加分を色分けして表示
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
    const totalPct = Math.min(100, Math.round((totalValue / max) * 100));
    const basePct = Math.min(100, Math.round((baseValue / max) * 100));
    const evPct = Math.min(100, Math.round((evContribution / max) * 100));

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8 shrink-0 text-right">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden flex">
                <div
                    className={`h-full transition-all duration-300 ${baseValueColor}`}
                    style={{ width: `${basePct}%` }}
                />
                <div
                    className={`h-full transition-all duration-300 ${evContributionColor}`}
                    style={{ width: `${evPct}%` }}
                />
            </div>
            <div className="text-xs font-semibold w-6 text-right tabular-nums">
                <span >{totalValue}</span>
            </div>
            <div className="text-xs font-semibold w-3 text-right tabular-nums">
                <span className="text-gray-400 text-[10px]">+{evContribution}</span>
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
};

export function ActualStatsDisplay({
    pokemon,
    baseStats,
    showEvContribution = false,
    baseValueColor = 'bg-pokemon-blue',
    evContributionColor = 'bg-orange-400',
}: ActualStatsDisplayProps) {
    const actual = calcActualStats(
        baseStats,
        pokemon.ivs,
        pokemon.evs,
        pokemon.level,
        pokemon.nature as Nature
    );

    // EV増加分を表示する場合、基本値とEV増加分を計算
    const splitStats = showEvContribution
        ? splitActualStatsByEvContribution(
              baseStats,
              pokemon.ivs,
              pokemon.evs,
              pokemon.level,
              pokemon.nature as Nature
          )
        : null;

    const NATURE_UP_DOWN = getNatureEffect(pokemon.nature as Nature);
    const evContribution = calcEvContributionToActualStats(pokemon.evs);
    const isEvContributionAtMax = evContribution >= MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS;

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
            {/* EV寄与実数値合計 */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                    <span className="font-semibold">実数値寄与度合計</span>
                    <span className={`font-bold tabular-nums ${isEvContributionAtMax ? 'text-red-500' : 'text-gray-700'}`}>
                        {evContribution} <span className="text-gray-400 font-normal">/ {MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS}</span>
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-200 ${
                            isEvContributionAtMax ? 'bg-red-400' : 'bg-pokemon-blue'
                        }`}
                        style={{ width: `${Math.min(100, Math.round((evContribution / MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS) * 100))}%` }}
                    />
                </div>
            </div>

            <div className="text-xs font-semibold text-gray-600 mb-1">実数値</div>
            {stats.map(({ key, label, barColor }) => {
                const isUp = NATURE_UP_DOWN.up === key;
                const isDown = NATURE_UP_DOWN.down === key;

                // EV増加分を表示する場合
                if (showEvContribution && splitStats) {
                    const split = splitStats[key];
                    const max = key === 'hp' ? 230 : 200;

                    return (
                        <div key={key} className="flex items-center gap-1">
                            <span
                                className={`text-xs font-bold w-4 ${
                                    isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-500'
                                }`}
                            >
                                {label}
                            </span>
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
                            {isUp && <span className="text-[10px] text-red-500 font-bold">↑</span>}
                            {isDown && <span className="text-[10px] text-blue-500 font-bold">↓</span>}
                        </div>
                    );
                }

                // 通常の表示（EV増加分なし）
                return (
                    <div key={key} className="flex items-center gap-1">
                        <span
                            className={`text-xs font-bold w-4 ${isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-500'
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
                        {isUp && <span className="text-[10px] text-red-500 font-bold">↑</span>}
                        {isDown && <span className="text-[10px] text-blue-500 font-bold">↓</span>}
                    </div>
                );
            })}
            {/* テラスタイプバッジ */}
            <div className="pt-2 flex items-center gap-1">
                <span className="text-xs text-gray-500">テラスタイプ:</span>
                <span
                    className={`text-xs text-white px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[pokemon.teraType] ?? 'bg-gray-400'
                        }`}
                >
                    {TYPE_LABELS[pokemon.teraType] ?? pokemon.teraType}
                </span>
            </div>
        </div>
    );
}

// 性格の上昇・下降ステータスを返す簡易実装
function getNatureEffect(nature: Nature): { up?: keyof Stats; down?: keyof Stats } {
    const table: Partial<Record<Nature, { up?: keyof Stats; down?: keyof Stats }>> = {
        Lonely: { up: 'attack', down: 'defense' },
        Brave: { up: 'attack', down: 'speed' },
        Adamant: { up: 'attack', down: 'specialAttack' },
        Naughty: { up: 'attack', down: 'specialDefense' },
        Bold: { up: 'defense', down: 'attack' },
        Relaxed: { up: 'defense', down: 'speed' },
        Impish: { up: 'defense', down: 'specialAttack' },
        Lax: { up: 'defense', down: 'specialDefense' },
        Timid: { up: 'speed', down: 'attack' },
        Hasty: { up: 'speed', down: 'defense' },
        Jolly: { up: 'speed', down: 'specialAttack' },
        Naive: { up: 'speed', down: 'specialDefense' },
        Modest: { up: 'specialAttack', down: 'attack' },
        Mild: { up: 'specialAttack', down: 'defense' },
        Quiet: { up: 'specialAttack', down: 'speed' },
        Rash: { up: 'specialAttack', down: 'specialDefense' },
        Calm: { up: 'specialDefense', down: 'attack' },
        Gentle: { up: 'specialDefense', down: 'defense' },
        Sassy: { up: 'specialDefense', down: 'speed' },
        Careful: { up: 'specialDefense', down: 'specialAttack' },
    };
    return table[nature] ?? {};
}
