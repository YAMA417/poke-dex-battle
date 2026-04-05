import type { BaseStats, Nature, Stats } from '../types/pokemon';

/** 性格補正値 */
const NATURE_MODIFIERS: Record<
  Nature,
  { up?: keyof Omit<Stats, 'hp'>; down?: keyof Omit<Stats, 'hp'> }
> = {
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
 * HP実数値を計算（チャンピオンズ仕様）
 * HP = 種族値 + 75 + 能力P
 * @param base - HP種族値
 * @param ev - 能力ポイント（0〜32）
 */
export function calcHpStat(base: number, ev: number): number {
  return base + 75 + ev;
}

/**
 * HP以外の実数値を計算（チャンピオンズ仕様）
 * 能力値 = floor((種族値 + 20 + 能力P) * 性格補正)
 * @param base - 種族値
 * @param ev - 能力ポイント（0〜32）
 * @param natureModifier - 性格補正値（0.9 / 1.0 / 1.1）
 */
export function calcOtherStat(base: number, ev: number, natureModifier: number): number {
  return Math.floor((base + 20 + ev) * natureModifier);
}

/**
 * HP実数値から能力ポイントを逆算
 * @param targetStat - 目標HP実数値
 * @param base - HP種族値
 * @returns 能力ポイント（0〜32にクランプ）
 */
export function reverseCalcHpEv(targetStat: number, base: number): number {
  return Math.max(0, Math.min(32, targetStat - base - 75));
}

/**
 * HP以外の実数値から能力ポイントを逆算（最小EVを返す）
 * 到達不可能な場合は最も近いEV（32）を返す
 * @param targetStat - 目標実数値
 * @param base - 種族値
 * @param natureModifier - 性格補正値
 * @returns 能力ポイント（0〜32）
 */
export function reverseCalcOtherEv(
  targetStat: number,
  base: number,
  natureModifier: number
): number {
  for (let ev = 0; ev <= 32; ev += 1) {
    if (calcOtherStat(base, ev, natureModifier) >= targetStat) {
      return ev;
    }
  }
  return 32;
}

/**
 * 能力ポイントを旧努力値（EV）に換算（UI表示用）
 * @param abilityPoint - 能力ポイント（0〜32）
 * @returns 旧仕様のEV値（0〜252）
 */
export function toClassicEv(abilityPoint: number): number {
  if (abilityPoint <= 0) return 0;
  return (abilityPoint - 1) * 8 + 4;
}

/**
 * 全ステータスの実数値を計算（チャンピオンズ仕様）
 * @param baseStats - 種族値
 * @param evs - 能力ポイント
 * @param nature - 性格
 */
export function calcActualStats(baseStats: BaseStats, evs: Stats, nature: Nature): Stats {
  return {
    hp: calcHpStat(baseStats.hp, evs.hp),
    attack: calcOtherStat(baseStats.attack, evs.attack, getNatureModifier(nature, 'attack')),
    defense: calcOtherStat(baseStats.defense, evs.defense, getNatureModifier(nature, 'defense')),
    specialAttack: calcOtherStat(
      baseStats.specialAttack,
      evs.specialAttack,
      getNatureModifier(nature, 'specialAttack')
    ),
    specialDefense: calcOtherStat(
      baseStats.specialDefense,
      evs.specialDefense,
      getNatureModifier(nature, 'specialDefense')
    ),
    speed: calcOtherStat(baseStats.speed, evs.speed, getNatureModifier(nature, 'speed')),
  };
}

/**
 * 能力ポイントから寄与される合計を計算（チャンピオンズ仕様）
 * 単純に各ステータスの能力ポイントを合算する
 * @param evs - 能力ポイントオブジェクト
 * @returns 能力ポイントの合計（最大 6 * 32 = 192、実際の上限は66）
 */
export function calcEvContributionToActualStats(evs: Stats): number {
  return evs.hp + evs.attack + evs.defense + evs.specialAttack + evs.specialDefense + evs.speed;
}

/**
 * 実数値を能力P=0の基本値と能力P増加分に分割する（チャンピオンズ仕様）
 * @param baseStats - 種族値
 * @param evs - 能力ポイント
 * @param nature - 性格
 * @returns 各ステータスの { baseValue, evContribution } を含むオブジェクト
 */
export function splitActualStatsByEvContribution(
  baseStats: BaseStats,
  evs: Stats,
  nature: Nature
): Record<keyof Stats, { baseValue: number; evContribution: number }> {
  // 能力P=0の状態での基本値を計算
  const baseValues = calcActualStats(
    baseStats,
    { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
    nature
  );

  // 現在の実数値を計算
  const currentValues = calcActualStats(baseStats, evs, nature);

  // 差分を計算（能力P増加分）
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

/**
 * 実数値から「最も近い実現可能な能力P」を見つける（チャンピオンズ仕様）
 * @param targetStat - 目標実数値
 * @param base - 種族値
 * @param natureModifier - 性格補正値（HPの場合は無視される）
 * @param isHp - HPかどうか
 * @returns 最も近い能力Pと実際の実数値
 */
export function findClosestRealizableEv(
  targetStat: number,
  base: number,
  natureModifier: number,
  isHp: boolean
): { ev: number; actualStat: number } {
  const maxEv = 32;
  let bestEv = 0;
  let bestStat = isHp ? calcHpStat(base, 0) : calcOtherStat(base, 0, natureModifier);

  for (let ev = 0; ev <= maxEv; ev += 1) {
    const actual = isHp ? calcHpStat(base, ev) : calcOtherStat(base, ev, natureModifier);

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
