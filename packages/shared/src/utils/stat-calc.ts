import type { BaseStats, Nature, Stats } from '../types/pokemon';

/** 性格補正値 */
const NATURE_MODIFIERS: Record<Nature, { up?: keyof Omit<Stats, 'hp'>; down?: keyof Omit<Stats, 'hp'> }> = {
  // 補正なし
  Hardy: {},
  Docile: {},
  Serious: {},
  Bashful: {},
  Quirky: {},
  // 攻撃↑
  Lonely: { up: 'attack', down: 'defense' },
  Brave: { up: 'attack', down: 'speed' },
  Adamant: { up: 'attack', down: 'specialAttack' },
  Naughty: { up: 'attack', down: 'specialDefense' },
  // 防御↑
  Bold: { up: 'defense', down: 'attack' },
  Relaxed: { up: 'defense', down: 'speed' },
  Impish: { up: 'defense', down: 'specialAttack' },
  Lax: { up: 'defense', down: 'specialDefense' },
  // 素早さ↑
  Timid: { up: 'speed', down: 'attack' },
  Hasty: { up: 'speed', down: 'defense' },
  Jolly: { up: 'speed', down: 'specialAttack' },
  Naive: { up: 'speed', down: 'specialDefense' },
  // 特攻↑
  Modest: { up: 'specialAttack', down: 'attack' },
  Mild: { up: 'specialAttack', down: 'defense' },
  Quiet: { up: 'specialAttack', down: 'speed' },
  Rash: { up: 'specialAttack', down: 'specialDefense' },
  // 特防↑
  Calm: { up: 'specialDefense', down: 'attack' },
  Gentle: { up: 'specialDefense', down: 'defense' },
  Sassy: { up: 'specialDefense', down: 'speed' },
  Careful: { up: 'specialDefense', down: 'specialAttack' },
};

/**
 * 性格補正を取得
 */
export function getNatureModifier(nature: Nature, stat: keyof Omit<Stats, 'hp'>): number {
  const modifier = NATURE_MODIFIERS[nature];
  if (modifier.up === stat) return 1.1;
  if (modifier.down === stat) return 0.9;
  return 1.0;
}

/**
 * HP実数値を計算
 * HP = (種族値×2 + 個体値 + 努力値÷4) × レベル÷100 + レベル + 10
 */
export function calcHpStat(base: number, iv: number, ev: number, level: number): number {
  return Math.floor((base * 2 + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
}

/**
 * HP以外の実数値を計算
 * 能力値 = ((種族値×2 + 個体値 + 努力値÷4) × レベル÷100 + 5) × 性格補正
 */
export function calcOtherStat(
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureModifier: number
): number {
  return Math.floor(
    (Math.floor((base * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5) * natureModifier
  );
}

/**
 * 全ステータスの実数値を計算
 */
export function calcActualStats(
  baseStats: BaseStats,
  ivs: Stats,
  evs: Stats,
  level: number,
  nature: Nature
): Stats {
  return {
    hp: calcHpStat(baseStats.hp, ivs.hp, evs.hp, level),
    attack: calcOtherStat(
      baseStats.attack,
      ivs.attack,
      evs.attack,
      level,
      getNatureModifier(nature, 'attack')
    ),
    defense: calcOtherStat(
      baseStats.defense,
      ivs.defense,
      evs.defense,
      level,
      getNatureModifier(nature, 'defense')
    ),
    specialAttack: calcOtherStat(
      baseStats.specialAttack,
      ivs.specialAttack,
      evs.specialAttack,
      level,
      getNatureModifier(nature, 'specialAttack')
    ),
    specialDefense: calcOtherStat(
      baseStats.specialDefense,
      ivs.specialDefense,
      evs.specialDefense,
      level,
      getNatureModifier(nature, 'specialDefense')
    ),
    speed: calcOtherStat(
      baseStats.speed,
      ivs.speed,
      evs.speed,
      level,
      getNatureModifier(nature, 'speed')
    ),
  };
}
