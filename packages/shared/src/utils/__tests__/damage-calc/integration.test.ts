import { describe, expect, it } from 'vitest';
import type { DamageCalculationInput } from '../../../types/damage';
import { calculateDamage } from '../../damage-calc';
import { calculateDamageV2 } from '../../damage-calc/index';
import { convertLegacyInput } from '../../damage-calc/legacy-adapter';

/**
 * 旧API（calculateDamage）と新API（calculateDamageV2）の統合テスト
 * 同一入力で両者が同一結果を返すことを確認する
 */
describe('ダメージ計算エンジン統合テスト', () => {
  /**
   * ヘルパー関数: 旧APIと新APIの結果を比較
   */
  function compareResults(legacyInput: DamageCalculationInput, testName: string): void {
    // 旧API実行
    const legacyResult = calculateDamage(legacyInput);

    // 新APIの入力に変換
    const { attacker, defender, move, context } = convertLegacyInput(legacyInput);

    // 新API実行
    const v2Result = calculateDamageV2(attacker, defender, move, context);

    console.log(`\n${testName}`);
    console.log(`旧API - min: ${legacyResult.minDamage}, max: ${legacyResult.maxDamage}`);
    console.log(`新API - min: ${v2Result.minDamage}, max: ${v2Result.maxDamage}`);

    // 結果が一致することを確認
    expect(v2Result.minDamage, `${testName}: minDamage が一致しない`).toBe(legacyResult.minDamage);
    expect(v2Result.maxDamage, `${testName}: maxDamage が一致しない`).toBe(legacyResult.maxDamage);

    // percent も確認
    expect(v2Result.minPercent).toBe(legacyResult.minPercent);
    expect(v2Result.maxPercent).toBe(legacyResult.maxPercent);

    // guaranteed/possible も確認
    expect(v2Result.guaranteed).toBe(legacyResult.guaranteed);
    expect(v2Result.possible).toBe(legacyResult.possible);
  }

  it('①カイリューのげきりん → ガブリアス (min: 240, max: 284)', () => {
    const input: DamageCalculationInput = {
      movePower: 120,
      moveType: 'Dragon',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 204,
      attackerTypes: ['Dragon', 'Flying'],
      defenderDefense: 115,
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

    compareResults(input, '①カイリューのげきりん → ガブリアス');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(240);
    expect(result.maxDamage).toBe(284);
  });

  it('②ガブリアスの逆鱗 → ガブリアス (min: 236, max: 278)', () => {
    const input: DamageCalculationInput = {
      movePower: 120,
      moveType: 'Dragon',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 200,
      attackerTypes: ['Dragon', 'Ground'],
      defenderDefense: 115,
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

    compareResults(input, '②ガブリアスの逆鱗 → ガブリアス');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(236);
    expect(result.maxDamage).toBe(278);
  });

  it('③通常攻撃 + てだすけ (min: 102, max: 121)', () => {
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
        isHelpingHand: true,
      },
    };

    compareResults(input, '③通常攻撃 + てだすけ');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(102);
    expect(result.maxDamage).toBe(121);
  });

  it('④ダブル全体技 (min: 51, max: 60)', () => {
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

    compareResults(input, '④ダブル全体技');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(51);
    expect(result.maxDamage).toBe(60);
  });

  it('⑤テクニシャン (min: 76, max: 91)', () => {
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

    compareResults(input, '④テクニシャン適用');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(76);
    expect(result.maxDamage).toBe(91);
  });

  it('⑤こだわりハチマキ (min: 68, max: 81)', () => {
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

    compareResults(input, '⑤こだわりハチマキ適用');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(68);
    expect(result.maxDamage).toBe(81);
  });

  it('⑥いのちのたま (min: 58, max: 70)', () => {
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

    compareResults(input, '⑥いのちのたま適用');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(58);
    expect(result.maxDamage).toBe(70);
  });

  it('⑦マルチスケイル (min: 22, max: 27)', () => {
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

    compareResults(input, '⑦マルチスケイル');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(22);
    expect(result.maxDamage).toBe(27);
  });
});
