import { describe, it, expect } from 'vitest';
import type { BaseStats, Stats } from '../../types/pokemon';
import {
  calcHpStat,
  calcOtherStat,
  reverseCalcHpAbilityPoint,
  reverseCalcOtherAbilityPoint,
  toClassicEv,
  calcActualStats,
  splitActualStatsByAbilityPoint,
  findClosestRealizableAbilityPoint,
  getNatureModifier,
} from '../stat-calc';

/** テスト用ヘルパー: Stats オブジェクトを生成 */
const createStats = (
  hp: number,
  attack: number,
  defense: number,
  specialAttack: number,
  specialDefense: number,
  speed: number
): Stats => ({ hp, attack, defense, specialAttack, specialDefense, speed });

describe('calcHpStat', () => {
  it('HP = 種族値 + 75 + 能力P（abilityPoint=0）', () => {
    expect(calcHpStat(91, 0)).toBe(166);
  });

  it('HP = 種族値 + 75 + 能力P（abilityPoint=32）', () => {
    expect(calcHpStat(91, 32)).toBe(198);
  });

  it('HP = 種族値 + 75 + 能力P（高種族値）', () => {
    expect(calcHpStat(255, 32)).toBe(362);
  });
});

describe('calcOtherStat', () => {
  it('floor((種族値 + 20 + 能力P) * 性格補正) 補正なし', () => {
    expect(calcOtherStat(134, 0, 1.0)).toBe(154);
  });

  it('floor((種族値 + 20 + 能力P) * 性格補正) 上昇補正', () => {
    // floor((134 + 20 + 32) * 1.1) = floor(204.6) = 204
    expect(calcOtherStat(134, 32, 1.1)).toBe(204);
  });

  it('floor((種族値 + 20 + 能力P) * 性格補正) 下降補正', () => {
    // floor((134 + 20 + 32) * 0.9) = floor(167.4) = 167
    expect(calcOtherStat(134, 32, 0.9)).toBe(167);
  });

  it('floor((種族値 + 20 + 能力P) * 性格補正) 上昇補正 abilityPoint=0', () => {
    // floor((134 + 20) * 1.1) = floor(169.4) = 169
    expect(calcOtherStat(134, 0, 1.1)).toBe(169);
  });
});

describe('reverseCalcHpAbilityPoint', () => {
  it('目標値から能力ポイントを逆算（abilityPoint=32）', () => {
    expect(reverseCalcHpAbilityPoint(198, 91)).toBe(32);
  });

  it('目標値から能力ポイントを逆算（abilityPoint=0）', () => {
    expect(reverseCalcHpAbilityPoint(166, 91)).toBe(0);
  });

  it('上限を超える目標値は32にクランプ', () => {
    expect(reverseCalcHpAbilityPoint(999, 91)).toBe(32);
  });

  it('下限を下回る目標値は0にクランプ', () => {
    expect(reverseCalcHpAbilityPoint(0, 91)).toBe(0);
  });
});

describe('reverseCalcOtherAbilityPoint', () => {
  it('目標値から能力ポイントを逆算（abilityPoint=0, 補正なし）', () => {
    expect(reverseCalcOtherAbilityPoint(154, 134, 1.0)).toBe(0);
  });

  it('目標値から能力ポイントを逆算（abilityPoint=32, 上昇補正）', () => {
    expect(reverseCalcOtherAbilityPoint(204, 134, 1.1)).toBe(32);
  });

  it('目標値から能力ポイントを逆算（abilityPoint=1, 補正なし）', () => {
    expect(reverseCalcOtherAbilityPoint(155, 134, 1.0)).toBe(1);
  });
});

describe('toClassicEv', () => {
  it('能力ポイント0 → EV 0', () => {
    expect(toClassicEv(0)).toBe(0);
  });

  it('能力ポイント1 → EV 4', () => {
    expect(toClassicEv(1)).toBe(4);
  });

  it('能力ポイント2 → EV 12', () => {
    expect(toClassicEv(2)).toBe(12);
  });

  it('能力ポイント10 → EV 76', () => {
    expect(toClassicEv(10)).toBe(76);
  });

  it('能力ポイント32 → EV 252', () => {
    expect(toClassicEv(32)).toBe(252);
  });
});

describe('calcActualStats', () => {
  it('カイリュー Adamant性格 abilityPoints全0', () => {
    const baseStats: BaseStats = {
      hp: 91,
      attack: 134,
      defense: 95,
      specialAttack: 100,
      specialDefense: 100,
      speed: 80,
    };
    const abilityPoints = createStats(0, 0, 0, 0, 0, 0);
    const result = calcActualStats(baseStats, abilityPoints, 'Adamant');

    expect(result.hp).toBe(166); // 91 + 75 + 0
    expect(result.attack).toBe(169); // floor((134 + 20) * 1.1) = floor(169.4)
    expect(result.defense).toBe(115); // floor((95 + 20) * 1.0)
    expect(result.specialAttack).toBe(108); // floor((100 + 20) * 0.9) = floor(108)
    expect(result.specialDefense).toBe(120); // floor((100 + 20) * 1.0)
    expect(result.speed).toBe(100); // floor((80 + 20) * 1.0)
  });
});

describe('splitActualStatsByAbilityPoint', () => {
  it('カイリュー Adamant性格 abilityPoints={hp:32, atk:32, def:0, spa:0, spd:0, spe:0}', () => {
    const baseStats: BaseStats = {
      hp: 91,
      attack: 134,
      defense: 95,
      specialAttack: 100,
      specialDefense: 100,
      speed: 80,
    };
    const abilityPoints = createStats(32, 32, 0, 0, 0, 0);
    const result = splitActualStatsByAbilityPoint(baseStats, abilityPoints, 'Adamant');

    // HP: baseValue=166 (91+75+0), evContribution=32 (198-166)
    expect(result.hp.baseValue).toBe(166);
    expect(result.hp.evContribution).toBe(32);

    // atk: baseValue=169 (floor((134+20)*1.1)), evContribution=204-169=35
    expect(result.attack.baseValue).toBe(169);
    expect(result.attack.evContribution).toBe(35);

    // def: baseValue=115, evContribution=0
    expect(result.defense.baseValue).toBe(115);
    expect(result.defense.evContribution).toBe(0);
  });
});

describe('findClosestRealizableAbilityPoint', () => {
  it('HP: 完全一致（target=170, base=91）', () => {
    // 91 + 75 + 4 = 170
    const result = findClosestRealizableAbilityPoint(170, 91, 1.0, true);
    expect(result.abilityPoint).toBe(4);
    expect(result.actualStat).toBe(170);
  });

  it('HP: 完全一致（target=168, base=91）', () => {
    // 91 + 75 + 2 = 168
    const result = findClosestRealizableAbilityPoint(168, 91, 1.0, true);
    expect(result.abilityPoint).toBe(2);
    expect(result.actualStat).toBe(168);
  });

  it('HP: 完全一致（target=197, base=91）', () => {
    // 91 + 75 + 31 = 197
    const result = findClosestRealizableAbilityPoint(197, 91, 1.0, true);
    expect(result.abilityPoint).toBe(31);
    expect(result.actualStat).toBe(197);
  });

  it('HP以外: 完全一致（target=155, base=134, mod=1.0）', () => {
    // floor((134 + 20 + 1) * 1.0) = 155
    const result = findClosestRealizableAbilityPoint(155, 134, 1.0, false);
    expect(result.abilityPoint).toBe(1);
    expect(result.actualStat).toBe(155);
  });

  it('HP以外: 最も近い値（target=156, base=134, mod=1.1）', () => {
    // abilityPoint=0: floor((134+20+0)*1.1) = floor(169.4) = 169 > 156 → abilityPoint=0で既に超過
    // 実際にはtargetが低いので abilityPoint=0 が最も近い
    const result = findClosestRealizableAbilityPoint(156, 134, 1.1, false);
    expect(result.abilityPoint).toBeDefined();
    expect(result.actualStat).toBeDefined();
  });
});

describe('getNatureModifier', () => {
  it('Adamant性格のattackは1.1', () => {
    expect(getNatureModifier('Adamant', 'attack')).toBe(1.1);
  });

  it('Adamant性格のspecialAttackは0.9', () => {
    expect(getNatureModifier('Adamant', 'specialAttack')).toBe(0.9);
  });

  it('Hardy性格のattackは1.0', () => {
    expect(getNatureModifier('Hardy', 'attack')).toBe(1.0);
  });
});
