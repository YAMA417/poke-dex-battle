'use client';

import { useState, useEffect } from 'react';
import type { Pokemon, PokemonSpeciesData, Move, MoveData, Nature, PokemonType, Stats } from '@poke-dex-battle/shared';
import {
    getLearnset,
    getMoveByName,
    calcActualStats,
    calcEvContributionToActualStats,
    getDuplicateMoveIds,
    findClosestRealizableEv,
    getNatureModifier,
    calcHpStat,
    calcOtherStat,
    MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS,
    splitActualStatsByEvContribution,
} from '@poke-dex-battle/shared';
import { EVSlider } from './EVSlider';
import { IVInputGrid } from './IVInputGrid';
import { STAT_COLORS } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

const NATURES: Nature[] = [
    'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
    'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
    'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
    'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
    'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky',
];
const NATURE_JA: Record<string, string> = {
    Hardy: 'がんばりや', Lonely: 'さみしがり', Brave: 'ゆうかん', Adamant: 'いじっぱり', Naughty: 'やんちゃ',
    Bold: 'ずぶとい', Docile: 'すなお', Relaxed: 'のんき', Impish: 'わんぱく', Lax: 'のうてんき',
    Timid: 'おくびょう', Hasty: 'せっかち', Serious: 'まじめ', Jolly: 'ようき', Naive: 'むじゃき',
    Modest: 'ひかえめ', Mild: 'おっとり', Quiet: 'れいせい', Bashful: 'てれや', Rash: 'うっかりや',
    Calm: 'おだやか', Gentle: 'おとなしい', Sassy: 'なまいき', Careful: 'しんちょう', Quirky: 'きまぐれ',
};

const NATURE_EFFECTS: Record<string, (keyof Omit<Stats, 'hp'>)[]> = {
    Lonely: ['attack', 'defense'], Brave: ['attack', 'speed'], Adamant: ['attack', 'specialAttack'], Naughty: ['attack', 'specialDefense'],
    Bold: ['defense', 'attack'], Relaxed: ['defense', 'speed'], Impish: ['defense', 'specialAttack'], Lax: ['defense', 'specialDefense'],
    Timid: ['speed', 'attack'], Hasty: ['speed', 'defense'], Jolly: ['speed', 'specialAttack'], Naive: ['speed', 'specialDefense'],
    Modest: ['specialAttack', 'attack'], Mild: ['specialAttack', 'defense'], Quiet: ['specialAttack', 'speed'], Rash: ['specialAttack', 'specialDefense'],
    Calm: ['specialDefense', 'attack'], Gentle: ['specialDefense', 'defense'], Sassy: ['specialDefense', 'speed'], Careful: ['specialDefense', 'specialAttack'],
};

const TYPES: PokemonType[] = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];
const TYPE_JA: Record<string, string> = {
    Normal: 'ノーマル', Fire: 'ほのお', Water: 'みず', Electric: 'でんき', Grass: 'くさ', Ice: 'こおり',
    Fighting: 'かくとう', Poison: 'どく', Ground: 'じめん', Flying: 'ひこう', Psychic: 'エスパー', Bug: 'むし',
    Rock: 'いわ', Ghost: 'ゴースト', Dragon: 'ドラゴン', Dark: 'あく', Steel: 'はがね', Fairy: 'フェアリー',
};
const TYPE_COLOR: Record<string, string> = {
    Normal: 'bg-gray-400 text-white', Fire: 'bg-orange-500 text-white', Water: 'bg-blue-500 text-white',
    Electric: 'bg-yellow-400 text-gray-900', Grass: 'bg-green-500 text-white', Ice: 'bg-cyan-300 text-gray-900',
    Fighting: 'bg-red-700 text-white', Poison: 'bg-purple-500 text-white', Ground: 'bg-yellow-600 text-white',
    Flying: 'bg-indigo-300 text-gray-900', Psychic: 'bg-pink-500 text-white', Bug: 'bg-lime-500 text-gray-900',
    Rock: 'bg-yellow-800 text-white', Ghost: 'bg-purple-800 text-white', Dragon: 'bg-indigo-700 text-white',
    Dark: 'bg-gray-800 text-white', Steel: 'bg-gray-500 text-white', Fairy: 'bg-pink-300 text-gray-900',
};
const MOVE_CAT_ICON: Record<string, string> = { Physical: '⚔️', Special: '🔮', Status: '💤' };
const GENDER_OPTIONS = [
    { value: 'male', label: '♂ オス' },
    { value: 'female', label: '♀ メス' },
    { value: 'unknown', label: '不明' },
] as const;

interface PokemonEditFormProps {
    pokemon: Pokemon;
    species: PokemonSpeciesData;
    onChange: (updated: Partial<Pokemon>) => void;
}

export function PokemonEditForm({ pokemon, species, onChange }: PokemonEditFormProps) {
    const [learnset, setLearnset] = useState<MoveData[]>([]);
    const [moveSearch, setMoveSearch] = useState<string[]>(['', '', '', '']);
    const [moveResults, setMoveResults] = useState<MoveData[][]>([[], [], [], []]);
    const [actualStatInputs, setActualStatInputs] = useState<Partial<Record<keyof Stats, string>>>({});
    const [actualStatErrors, setActualStatErrors] = useState<Partial<Record<keyof Stats, string>>>({});
    const [isEVsOpen, setIsEVsOpen] = useState<boolean>(false);

    const natureEffect = NATURE_EFFECTS[pokemon.nature] ?? [];
    const natureUp = natureEffect[0] as keyof Stats | undefined;
    const natureDown = natureEffect[1] as keyof Stats | undefined;

    const actualStats = calcActualStats(
        species.baseStats,
        pokemon.ivs,
        pokemon.evs,
        pokemon.level,
        pokemon.nature as Nature
    );

    const dupMoveIds = getDuplicateMoveIds(pokemon.moves);

    /**
     * 実数値入力時のハンドラー
     * 実数値 → EV に逆算し、親に通知
     */
    function handleActualStatChange(stat: keyof Stats, targetStat: number) {
        const isHp = stat === 'hp';
        const baseStat = species.baseStats[stat];
        const iv = pokemon.ivs[stat];
        const natureModifier = isHp ? 1 : getNatureModifier(pokemon.nature as Nature, stat as keyof Omit<Stats, 'hp'>);
        
        // 最も近い実現可能な EV を取得
        const { ev: newEv, actualStat } = findClosestRealizableEv(
            targetStat,
            baseStat,
            iv,
            pokemon.level,
            natureModifier,
            isHp
        );
        
        // 新しい EV 配置を計算して合計を確認
        const updatedEvs = { ...pokemon.evs, [stat]: newEv };
        const newTotal = Object.values(updatedEvs).reduce((sum, v) => sum + v, 0);
        
        // エラーハンドリング
        const errors: Partial<Record<keyof Stats, string>> = {};
        
        if (targetStat < 1) {
            errors[stat] = '1 以上の値が必要です';
        } else if (newEv > 252) {
            errors[stat] = `最大252EVで、実数値${actualStat}に調整しました`;
        } else if (newTotal > 510) {
            errors[stat] = `EV合計が超過しています（現在: ${newTotal}）`;
        }
        
        setActualStatErrors(errors);
        
        // EV を親に通知
        onChange({ evs: updatedEvs });
    }

    useEffect(() => {
        const moves = getLearnset(species.name)
            .map((moveName) => getMoveByName(moveName))
            .filter((m): m is MoveData => m !== null);
        setLearnset(moves);
    }, [species.name]);

    function handleMoveSearch(slot: number, query: string) {
        const next = [...moveSearch];
        next[slot] = query;
        setMoveSearch(next);
        if (!query.trim()) {
            const nextRes = [...moveResults];
            nextRes[slot] = [];
            setMoveResults(nextRes);
            return;
        }
        const filtered = learnset
            .filter((m) => m.nameJa.includes(query) || m.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8);
        const nextRes = [...moveResults];
        nextRes[slot] = filtered;
        setMoveResults(nextRes);
    }

    function selectMove(slot: number, md: MoveData) {
        const newMoves = [...pokemon.moves];
        const move: Move = {
            id: md.id,
            name: md.name,
            type: md.type,
            category: md.category,
            power: md.power ?? undefined,
            accuracy: md.accuracy ?? undefined,
            pp: md.pp,
        };
        newMoves[slot] = move;
        onChange({ moves: newMoves });
        const nextSearch = [...moveSearch];
        nextSearch[slot] = '';
        setMoveSearch(nextSearch);
        const nextRes = [...moveResults];
        nextRes[slot] = [];
        setMoveResults(nextRes);
    }

    function clearMove(slot: number) {
        const newMoves = [...pokemon.moves];
        newMoves.splice(slot, 1);
        onChange({ moves: newMoves });
    }

    return (
        <div className="space-y-6">
            {/* ── 基本情報 ── */}
            <section className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 border-b pb-1">基本情報</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 font-medium">ニックネーム</label>
                        <input
                            type="text"
                            value={pokemon.nickname ?? ''}
                            onChange={(e) => onChange({ nickname: e.target.value || undefined })}
                            placeholder={species.nameJa}
                            className="w-full mt-0.5 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-medium">レベル</label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={pokemon.level}
                            onChange={(e) => onChange({ level: Math.min(100, Math.max(1, Number(e.target.value))) })}
                            className="w-full mt-0.5 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 font-medium">性別</label>
                        <select
                            value={pokemon.gender ?? 'unknown'}
                            onChange={(e) => onChange({ gender: e.target.value as Pokemon['gender'] })}
                            className="w-full mt-0.5 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
                        >
                            {GENDER_OPTIONS.map((g) => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-medium">持ち物</label>
                        <input
                            type="text"
                            value={pokemon.item ?? ''}
                            onChange={(e) => onChange({ item: e.target.value || undefined })}
                            placeholder="なし"
                            className="w-full mt-0.5 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
                        />
                    </div>
                </div>
            </section>

            {/* ── 特性 ── */}
            <section className="space-y-2">
                <h4 className="text-sm font-bold text-gray-700 border-b pb-1">特性</h4>
                <div className="flex flex-wrap gap-2">
                    {species.abilities.map((ab) => (
                        <button
                            key={ab.name}
                            type="button"
                            onClick={() => onChange({ ability: ab.name })}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${pokemon.ability === ab.name
                                    ? 'bg-pokemon-blue text-white border-pokemon-blue font-semibold shadow'
                                    : 'border-gray-200 text-gray-600 hover:border-pokemon-blue hover:text-pokemon-blue'
                                }`}
                        >
                            {ab.nameJa}
                            {ab.isHidden && <span className="ml-1 text-[10px] opacity-70">(夢)</span>}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── テラスタイプ ── */}
            <section className="space-y-2">
                <h4 className="text-sm font-bold text-gray-700 border-b pb-1">テラスタイプ</h4>
                <div className="flex flex-wrap gap-1.5">
                    {TYPES.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => onChange({ teraType: t })}
                            className={`text-[11px] px-2 py-1 rounded-full font-semibold border-2 transition-all
                ${TYPE_COLOR[t]}
                ${pokemon.teraType === t ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                        >
                            {TYPE_JA[t]}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── 性格 ── */}
            <section className="space-y-2">
                <h4 className="text-sm font-bold text-gray-700 border-b pb-1">性格</h4>
                <div className="grid grid-cols-5 gap-1">
                    {NATURES.map((n) => {
                        const fx = NATURE_EFFECTS[n];
                        return (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onChange({ nature: n })}
                                className={`text-[11px] py-1 rounded border transition-all text-center
                  ${pokemon.nature === n
                                        ? 'bg-pokemon-blue text-white border-pokemon-blue font-bold shadow'
                                        : 'border-gray-200 text-gray-600 hover:border-pokemon-blue'}`}
                            >
                                {NATURE_JA[n]}
                                {fx && <span className="block text-[9px] opacity-70">↑{fx[0]?.slice(0, 1).toUpperCase()} ↓{fx[1]?.slice(0, 1).toUpperCase()}</span>}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── 技 ── */}
            <section className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 border-b pb-1">技（最大4つ）</h4>
                {[0, 1, 2, 3].map((slot) => {
                    const move = pokemon.moves[slot];
                    const isDup = move && dupMoveIds.has(move.id);
                    return (
                        <div key={slot} className="relative">
                            {move ? (
                                <div className={`flex items-center gap-2 p-2 rounded-lg border ${isDup ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <span className="text-xs">{MOVE_CAT_ICON[move.category]}</span>
                                    <span className={`text-[10px] text-white px-1.5 py-0.5 rounded-full font-semibold ${TYPE_COLOR[move.type]?.split(' ')[0]}`}>
                                        {TYPE_JA[move.type] ?? move.type}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-800 flex-1">{getMoveByName(move.name)?.nameJa ?? move.name}</span>
                                    {move.power && <span className="text-xs text-gray-400">威力{move.power}</span>}
                                    {isDup && <AlertTriangle size={14} className="text-amber-500" />}
                                    <button
                                        type="button"
                                        onClick={() => clearMove(slot)}
                                        className="text-gray-300 hover:text-red-400 text-lg leading-none"
                                    >×</button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={moveSearch[slot]}
                                        onChange={(e) => handleMoveSearch(slot, e.target.value)}
                                        placeholder={`技スロット ${slot + 1} を検索...`}
                                        className="w-full text-sm border border-dashed border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pokemon-blue focus:border-solid"
                                    />
                                    {moveResults[slot].length > 0 && (
                                        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                            {moveResults[slot].map((md) => (
                                                <button
                                                    key={md.id}
                                                    type="button"
                                                    onClick={() => selectMove(slot, md)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors text-left"
                                                >
                                                    <span className="text-xs">{MOVE_CAT_ICON[md.category]}</span>
                                                    <span className={`text-[10px] text-white px-1.5 py-0.5 rounded-full font-semibold ${TYPE_COLOR[md.type]?.split(' ')[0]}`}>
                                                        {TYPE_JA[md.type] ?? md.type}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800 flex-1">{md.nameJa}</span>
                                                    {md.power && <span className="text-xs text-gray-400">威力{md.power}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </section>

            {/* ── 個体値 ── */}
            <section className="space-y-2">
                <h4 className="text-sm font-bold text-gray-700 border-b pb-1">個体値 (IV)</h4>
                <IVInputGrid ivs={pokemon.ivs} onChange={(ivs) => onChange({ ivs })} />
            </section>

            {/* ── 努力値 ── */}
            <section className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-700 border-b pb-1 flex-1">努力値 (EV)</h4>
                    <button
                        onClick={() => setIsEVsOpen(!isEVsOpen)}
                        className="text-xs px-3 py-1 bg-pokemon-blue text-white rounded hover:bg-pokemon-blue/90 transition-colors"
                    >
                        {isEVsOpen ? '非表示' : '表示'}
                    </button>
                </div>
                {isEVsOpen && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <EVSlider
                            evs={pokemon.evs}
                            natureUp={natureUp}
                            natureDown={natureDown}
                            onChange={(evs) => onChange({ evs })}
                        />
                    </div>
                )}
            </section>

            {/* ── 実数値（リアルタイム） ── */}
            <section className="bg-gray-50 rounded-xl p-4 space-y-2">
                {/* EV寄与度合計表示 */}
                <div className="space-y-1 pb-2 border-b border-gray-200">
                    <div className="flex justify-between text-xs text-gray-600">
                        <span className="font-semibold">実数値寄与度合計</span>
                        <span className={`font-bold tabular-nums ${calcEvContributionToActualStats(pokemon.evs) >= MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS ? 'text-red-500' : 'text-gray-700'}`}>
                            {calcEvContributionToActualStats(pokemon.evs)} <span className="text-gray-400 font-normal">/ {MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS}</span>
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-200 ${
                                calcEvContributionToActualStats(pokemon.evs) >= MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS ? 'bg-red-400' : 'bg-pokemon-blue'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((calcEvContributionToActualStats(pokemon.evs) / MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS) * 100))}%` }}
                        />
                    </div>
                </div>
                <h4 className="text-sm font-bold text-gray-700">実数値（推定）</h4>
                {(['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as (keyof Stats)[]).map((key) => {
                    const isUp = natureUp === key;
                    const isDown = natureDown === key;
                    const labels: Record<keyof Stats, string> = {
                        hp: 'H', attack: 'A', defense: 'B', specialAttack: 'C', specialDefense: 'D', speed: 'S'
                    };
                    const error = actualStatErrors[key];
                    
                    // EV増加分を計算
                    const splitStats = splitActualStatsByEvContribution(
                        species.baseStats,
                        pokemon.ivs,
                        pokemon.evs,
                        pokemon.level,
                        pokemon.nature as Nature
                    );
                    const split = splitStats[key];
                    const max = key === 'hp' ? 230 : 200;
                    const basePct = Math.min(100, (split.baseValue / max) * 100);
                    const evPct = Math.min(100, (split.evContribution / max) * 100);
                    
                    return (
                        <div key={key} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold w-4 ${isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-500'}`}>
                                    {labels[key]}
                                </span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
                                    <div
                                        className={`h-full transition-all ${isUp ? 'bg-red-300' : isDown ? 'bg-blue-300' : STAT_COLORS.base}`}
                                        style={{ width: `${basePct}%` }}
                                    />
                                    <div
                                        className={`h-full transition-all ${STAT_COLORS.evContribution}`}
                                        style={{ width: `${evPct}%` }}
                                    />
                                </div>
                                <input
                                    type="number"
                                    min={1}
                                    value={actualStatInputs[key] ?? actualStats[key]}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setActualStatInputs((prev) => ({ ...prev, [key]: val }));
                                        const num = parseInt(val, 10);
                                        if (!isNaN(num) && num > 0) {
                                            handleActualStatChange(key, num);
                                        }
                                    }}
                                    onBlur={() => {
                                        setActualStatInputs((prev) => {
                                            const next = { ...prev };
                                            delete next[key];
                                            return next;
                                        });
                                    }}
                                    className={`w-16 text-right text-xs border rounded px-1 py-0.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-pokemon-blue ${
                                        error ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                                    }`}
                                />
                                <div className="w-8 text-[10px] text-right text-gray-500">
                                    +{split.evContribution}
                                </div>
                                {isUp && <span className="text-[10px] text-red-500">↑</span>}
                                {isDown && <span className="text-[10px] text-blue-500">↓</span>}
                            </div>
                            {error && (
                                <p className="text-[11px] text-amber-600 ml-4">{error}</p>
                            )}
                        </div>
                    );
                })}
            </section>
        </div>
    );
}
