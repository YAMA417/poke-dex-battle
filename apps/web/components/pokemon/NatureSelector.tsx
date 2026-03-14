'use client';

import type { Nature, Stats } from '@poke-dex-battle/shared';
import { NATURE_EFFECTS_MAP } from '@/lib/constants';

/**
 * Nature selection component with effects visualization.
 * Displays all 25 natures in a 5-column grid with stat modifiers.
 */

const NATURES: Nature[] = [
  'Hardy',
  'Lonely',
  'Brave',
  'Adamant',
  'Naughty',
  'Bold',
  'Docile',
  'Relaxed',
  'Impish',
  'Lax',
  'Modest',
  'Mild',
  'Quiet',
  'Bashful',
  'Rash',
  'Calm',
  'Gentle',
  'Sassy',
  'Careful',
  'Quirky',
  'Timid',
  'Hasty',
  'Serious',
  'Jolly',
  'Naive',
];

const NATURE_JA: Record<string, string> = {
  Hardy: 'がんばりや',
  Lonely: 'さみしがり',
  Brave: 'ゆうかん',
  Adamant: 'いじっぱり',
  Naughty: 'やんちゃ',
  Bold: 'ずぶとい',
  Docile: 'すなお',
  Relaxed: 'のんき',
  Impish: 'わんぱく',
  Lax: 'のうてんき',
  Modest: 'ひかえめ',
  Mild: 'おっとり',
  Quiet: 'れいせい',
  Bashful: 'てれや',
  Rash: 'うっかりや',
  Calm: 'おだやか',
  Gentle: 'おとなしい',
  Sassy: 'なまいき',
  Careful: 'しんちょう',
  Quirky: 'きまぐれ',
  Timid: 'おくびょう',
  Hasty: 'せっかち',
  Serious: 'まじめ',
  Jolly: 'ようき',
  Naive: 'むじゃき',
};

// Stat keyからポケモン略称への変換マップ
// A(攻撃)/B(防御)/C(特攻)/D(特防)/S(素早さ)
const STAT_ABBREV: Record<keyof Omit<Stats, 'hp'>, string> = {
  attack: 'A',
  defense: 'B',
  specialAttack: 'C',
  specialDefense: 'D',
  speed: 'S',
};

interface NatureSelectorProps {
  nature: Nature;
  onChange: (nature: Nature) => void;
}

export function NatureSelector({ nature, onChange }: NatureSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {NATURES.map((n) => {
        const fx = NATURE_EFFECTS_MAP[n];
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded border py-1 text-center text-[11px] transition-all ${
              nature === n
                ? 'border-pokemon-blue bg-pokemon-blue font-bold text-white shadow'
                : 'border-gray-200 text-gray-600 hover:border-pokemon-blue'
            }`}
          >
            {NATURE_JA[n]}
            {fx && fx.length > 0 && (
              <span className="block text-[9px] opacity-70">
                ↑{STAT_ABBREV[fx[0]]} ↓{STAT_ABBREV[fx[1]]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
