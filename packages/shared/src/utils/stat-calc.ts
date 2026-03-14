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
 * HP実数値から努力値を逆算（最小EVを返す）
 * 到達不可能な場合は最も近いEV（252）を返す
 */
export function reverseCalcHpEv(targetStat: number, base: number, iv: number, level: number): number {
  for (let ev = 0; ev <= 252; ev += 4) {
    if (calcHpStat(base, iv, ev, level) >= targetStat) {
      return ev;
    }
  }
  return 252;
}

/**
 * HP以外の実数値から努力値を逆算（最小EVを返す）
 * 到達不可能な場合は最も近いEV（252）を返す
 */
export function reverseCalcOtherEv(
  targetStat: number,
  base: number,
  iv: number,
  level: number,
  natureModifier: number
): number {
  for (let ev = 0; ev <= 252; ev += 4) {
    if (calcOtherStat(base, iv, ev, level, natureModifier) >= targetStat) {
      return ev;
    }
  }
  return 252;
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

/**
 * EV配置が規則内か検証（総EV≤510、各ステータス≤252）
 */
export function isValidEvAllocation(evs: Stats): boolean {
  const total = Object.values(evs).reduce((sum, val) => sum + val, 0);
  return (
    total <= 510 && 
    evs.hp <= 252 &&
    evs.attack <= 252 &&
    evs.defense <= 252 &&
    evs.specialAttack <= 252 &&
    evs.specialDefense <= 252 &&
    evs.speed <= 252
  );
}

/**
 * 実数値から「最も近い実現可能なEV」を見つける（単一ステータス）
 * 到達不可能な場合も、最も近い値を返す（到達不可なら0）
 */
export function findClosestRealizableEv(
  targetStat: number,
  base: number,
  iv: number,
  level: number,
  natureModifier: number,
  isHp: boolean
): { ev: number; actualStat: number } {
  const maxEv = 252;
  let bestEv = 0;
  let bestStat = isHp 
    ? calcHpStat(base, iv, 0, level) 
    : calcOtherStat(base, iv, 0, level, natureModifier);
  
  for (let ev = 0; ev <= maxEv; ev += 4) {
    const actual = isHp
      ? calcHpStat(base, iv, ev, level)
      : calcOtherStat(base, iv, ev, level, natureModifier);
    
    if (actual === targetStat) {
      // 完全一致
      return { ev, actualStat: actual };
    }
    
    if (actual < targetStat) {
      // より近い値を記録
      bestEv = ev;
      bestStat = actual;
    } else {
      // targetStat を超えた → 終了
      break;
    }
  }
  
  return { ev: bestEv, actualStat: bestStat };
}

/**
 * 単一ステータスのEVから寄与実数値を計算（ヘルパー関数）
 * EV 0-3: 0
 * EV 4: 1
 * EV 5-11: 1
 * EV 12: 2
 * EV 13-19: 2
 * EV 20: 3
 * ...計算式: EV < 4 ? 0 : 1 + floor((EV - 4) / 8)
 */
function calculateSingleEvContribution(ev: number): number {
  if (ev < 4) return 0;
  return 1 + Math.floor((ev - 4) / 8);
}

/**
 * EVから寄与される実数値の合計を計算
 * 各ステータスのEVを新仕様で計算して合計
 * EV0-3で0、EV4で1増加、以降8刻みで+1
 * @param evs - 努力値オブジェクト
 * @returns EVから寄与される実数値の合計（最大66）
 */
export function calcEvContributionToActualStats(evs: Stats): number {
  return (
    calculateSingleEvContribution(evs.hp) +
    calculateSingleEvContribution(evs.attack) +
    calculateSingleEvContribution(evs.defense) +
    calculateSingleEvContribution(evs.specialAttack) +
    calculateSingleEvContribution(evs.specialDefense) +
    calculateSingleEvContribution(evs.speed)
  );
}

/**
 * 実数値をEV＝0の基本値とEV増加分に分割する
 * @param baseStats - 種族値
 * @param ivs - 個体値
 * @param evs - 努力値
 * @param level - レベル
 * @param nature - 性格
 * @returns 各ステータスの { baseValue, evContribution } を含むオブジェクト
 */
export function splitActualStatsByEvContribution(
  baseStats: BaseStats,
  ivs: Stats,
  evs: Stats,
  level: number,
  nature: Nature
): Record<keyof Stats, { baseValue: number; evContribution: number }> {
  // EV=0の状態での基本値を計算
  const baseValues = calcActualStats(baseStats, ivs, { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }, level, nature);
  
  // 現在の実数値を計算
  const currentValues = calcActualStats(baseStats, ivs, evs, level, nature);
  
  // 差分を計算（EV増加分）
  return {
    hp: {
      baseValue: baseValues.hp,
      evContribution: currentValues.hp - baseValues.hp,
    },
    attack: {
      baseValue: baseValues.attack,
      evContribution: currentValues.attack - baseValues.attack,
    },
    defense: {
      baseValue: baseValues.defense,
      evContribution: currentValues.defense - baseValues.defense,
    },
    specialAttack: {
      baseValue: baseValues.specialAttack,
      evContribution: currentValues.specialAttack - baseValues.specialAttack,
    },
    specialDefense: {
      baseValue: baseValues.specialDefense,
      evContribution: currentValues.specialDefense - baseValues.specialDefense,
    },
    speed: {
      baseValue: baseValues.speed,
      evContribution: currentValues.speed - baseValues.speed,
    },
  };
}

