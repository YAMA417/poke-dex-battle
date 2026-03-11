'use client';

import type { Nature, Stats } from '@poke-dex-battle/shared';

/**
 * Nature selection component with effects visualization.
 * Displays all 25 natures in a 5-column grid with stat modifiers.
 */

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

interface NatureSelectorProps {
    nature: Nature;
    onChange: (nature: Nature) => void;
}

export function NatureSelector({ nature, onChange }: NatureSelectorProps) {
    return (
        <div className="grid grid-cols-5 gap-1">
            {NATURES.map((n) => {
                const fx = NATURE_EFFECTS[n];
                return (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        className={`text-[11px] py-1 rounded border transition-all text-center
                  ${nature === n
                                ? 'bg-pokemon-blue text-white border-pokemon-blue font-bold shadow'
                                : 'border-gray-200 text-gray-600 hover:border-pokemon-blue'}`}
                    >
                        {NATURE_JA[n]}
                        {fx && <span className="block text-[9px] opacity-70">↑{fx[0]?.slice(0, 1).toUpperCase()} ↓{fx[1]?.slice(0, 1).toUpperCase()}</span>}
                    </button>
                );
            })}
        </div>
    );
}
