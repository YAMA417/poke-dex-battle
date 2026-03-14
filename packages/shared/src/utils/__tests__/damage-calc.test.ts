import { describe, expect, it } from 'vitest';
import type { DamageCalculationInput } from '../../types/damage';
import {
  calculateDamage,
  calculateStab,
  calculateWeatherModifier,
  getStatStageMultiplier,
} from '../damage-calc';

describe('damage-calc', () => {
  describe('getStatStageMultiplier', () => {
    it('ランク0は1.0倍', () => {
      expect(getStatStageMultiplier(0)).toBe(1.0);
    });

    it('ランク+1は1.5倍', () => {
      expect(getStatStageMultiplier(1)).toBe(1.5);
    });

    it('ランク-1は2/3倍', () => {
      expect(getStatStageMultiplier(-1)).toBeCloseTo(0.6667, 4);
    });

    it('ランク+6は4.0倍', () => {
      expect(getStatStageMultiplier(6)).toBe(4.0);
    });
  });

  describe('calculateStab', () => {
    it('タイプ一致は1.5倍', () => {
      expect(calculateStab('Fire', ['Fire', 'Flying'])).toBe(1.5);
    });

    it('タイプ不一致は1.0倍', () => {
      expect(calculateStab('Water', ['Fire', 'Flying'])).toBe(1.0);
    });

    it('テラスタル使用時、元タイプと一致なら2.0倍', () => {
      expect(calculateStab('Fire', ['Fire', 'Flying'], 'Fire', true)).toBe(2.0);
    });

    it('テラスタル使用時、元タイプと不一致なら1.5倍', () => {
      expect(calculateStab('Water', ['Fire', 'Flying'], 'Water', true)).toBe(1.5);
    });
  });

  describe('calculateWeatherModifier', () => {
    it('晴れ時の炎技は1.5倍', () => {
      expect(calculateWeatherModifier('Fire', 'sun')).toBe(1.5);
    });

    it('雨時の水技は1.5倍', () => {
      expect(calculateWeatherModifier('Water', 'rain')).toBe(1.5);
    });

    it('晴れ時の水技は0.5倍', () => {
      expect(calculateWeatherModifier('Water', 'sun')).toBe(0.5);
    });
  });

  describe('calculateDamage', () => {
    it('①カイリューのげきりん → ガブリアス', () => {
      const input: DamageCalculationInput = {
        movePower: 120,
        moveType: 'Dragon',
        moveCategory: 'Physical',
        attackerLevel: 50,
        attackerAttack: 204, // カイリューの攻撃実数値
        attackerTypes: ['Dragon', 'Flying'],
        defenderDefense: 115, // ガブリアスの防御実数値
        defenderTypes: ['Dragon', 'Ground'],
        condition: {
          weather: 'none',
          field: 'none',
          attackerStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          defenderStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
        },
      };

      const result = calculateDamage(input);

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(240);
      expect(result.maxDamage).toBe(284);

      console.log('①カイリューのげきりん → ガブリアス:');
      console.log('  最小:', result.minDamage, '(期待: 240)');
      console.log('  最大:', result.maxDamage, '(期待: 284)');
    });

    it('②通常攻撃とてだすけ使用時', () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: 'Normal',
        moveCategory: 'Physical',
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ['Normal'],
        defenderDefense: 100,
        defenderTypes: ['Normal'],
        condition: {
          weather: 'none',
          field: 'none',
          attackerStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          defenderStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          isHelpingHand: false,
        },
      };

      const normalResult = calculateDamage(input);

      console.log('②通常（実際の値）:');
      console.log('  最小:', normalResult.minDamage, '(期待: 67)');
      console.log('  最大:', normalResult.maxDamage, '(期待: 81)');

      const inputWithHelp = {
        ...input,
        condition: { ...input.condition, isHelpingHand: true },
      };
      const helpResult = calculateDamage(inputWithHelp);

      console.log('②てだすけ（実際の値）:');
      console.log('  最小:', helpResult.minDamage, '(期待: 102)');
      console.log('  最大:', helpResult.maxDamage, '(期待: 121)');

      // shadowtag.xyzの期待値
      expect(normalResult.minDamage).toBe(67);
      expect(normalResult.maxDamage).toBe(81);
      expect(helpResult.minDamage).toBe(102);
      expect(helpResult.maxDamage).toBe(121);
    });

    it('④ダブルバトルの全体技は0.75倍', () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: 'Normal',
        moveCategory: 'Physical',
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ['Normal'],
        defenderDefense: 100,
        defenderTypes: ['Normal'],
        condition: {
          weather: 'none',
          field: 'none',
          attackerStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          defenderStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          isDoubleBattle: true,
          isSpreadMove: true,
        },
      };

      const result = calculateDamage(input);

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(51);
      expect(result.maxDamage).toBe(60);

      console.log('④全体技:');
      console.log('  最小:', result.minDamage, '(期待: 51)');
      console.log('  最大:', result.maxDamage, '(期待: 60)');
    });
  });
  describe('特性と持ち物のテスト', () => {
    it('⑤テクニシャン: 威力60以下の技が1.5倍', () => {
      const input: DamageCalculationInput = {
        movePower: 60,
        moveType: 'Normal',
        moveCategory: 'Physical',
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ['Normal'],
        defenderDefense: 100,
        defenderTypes: ['Normal'],
        condition: {
          weather: 'none',
          field: 'none',
          attackerStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          defenderStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          attackerAbility: 'Technician',
        },
      };

      const result = calculateDamage(input);

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(76);
      expect(result.maxDamage).toBe(91);

      console.log('⑤テクニシャン適用:');
      console.log('  最小:', result.minDamage, '(期待: 76)');
      console.log('  最大:', result.maxDamage, '(期待: 91)');
    });

    it('⑥こだわりハチマキ: 物理攻撃1.5倍', () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: 'Normal',
        moveCategory: 'Physical',
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ['Dragon', 'Flying'],
        defenderDefense: 100,
        defenderTypes: ['Normal'],
        condition: {
          weather: 'none',
          field: 'none',
          attackerStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          defenderStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          attackerItem: 'Choice Band',
        },
      };

      const result = calculateDamage(input);

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(68);
      expect(result.maxDamage).toBe(81);

      console.log('⑥こだわりハチマキ適用:');
      console.log('  最小:', result.minDamage, '(期待: 68)');
      console.log('  最大:', result.maxDamage, '(期待: 81)');
    });

    it('⑦いのちのたま: 全ての技1.3倍', () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: 'Normal',
        moveCategory: 'Physical',
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ['Dragon', 'Flying'],
        defenderDefense: 100,
        defenderTypes: ['Normal'],
        condition: {
          weather: 'none',
          field: 'none',
          attackerStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          defenderStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          attackerItem: 'Life Orb',
        },
      };

      const result = calculateDamage(input);

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(58);
      expect(result.maxDamage).toBe(70);

      console.log('⑦いのちのたま適用:');
      console.log('  最小:', result.minDamage, '(期待: 58)');
      console.log('  最大:', result.maxDamage, '(期待: 70)');
    });

    it('⑧マルチスケイル: HP満タン時ダメージ0.5倍', () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: 'Normal',
        moveCategory: 'Physical',
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ['Dragon', 'Flying'],
        defenderDefense: 100,
        defenderTypes: ['Dragon', 'Flying'],
        defenderCurrentHp: 183,
        defenderMaxHp: 183,
        condition: {
          weather: 'none',
          field: 'none',
          attackerStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          defenderStatStages: {
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          defenderAbility: 'Multiscale',
        },
      };

      const result = calculateDamage(input);

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(22);
      expect(result.maxDamage).toBe(27);

      console.log('⑧マルチスケイル適用:');
      console.log('  最小:', result.minDamage, '(期待: 22)');
      console.log('  最大:', result.maxDamage, '(期待: 27)');
    });
  });
});
