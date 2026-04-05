import { describe, expect, it } from 'vitest';
import { ABILITY_SKILL_LINK, ITEM_LOADED_DICE } from '../../../constants/damage-calc-names';
import type { BattleContext, CalcMove, CalcPokemon } from '../../../types/damage';
import type { DamageEffect } from '../../../types/damage-effect';
import { calculateDamageV2 } from '../../damage-calc/index';

/**
 * 連続技ダメージ計算テスト
 */
describe('連続技ダメージ計算', () => {
  // 共通のテスト用ポケモン
  const baseAttacker: CalcPokemon = {
    level: 50,
    types: ['Normal'],
    stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
  };
  const baseDefender: CalcPokemon = {
    level: 50,
    types: ['Normal'],
    stats: { hp: 200, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
    maxHp: 200,
  };
  const defaultContext: BattleContext = {};

  /** fixed型のdamageEffectを作る */
  function makeFixedMultiHit(min: number, max: number): DamageEffect {
    return { multiHit: { type: 'fixed', min, max } };
  }

  /** escalating型のdamageEffectを作る */
  function makeEscalatingMultiHit(powers: number[]): DamageEffect {
    return { multiHit: { type: 'escalating', powers } };
  }

  describe('fixed型', () => {
    it('3ヒット: 1発分のmin/maxの3倍と一致', () => {
      // まず1発分を計算
      const singleMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
      };
      const singleResult = calculateDamageV2(
        baseAttacker,
        baseDefender,
        singleMove,
        defaultContext
      );

      // 3ヒットで計算
      const multiMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
        damageEffect: makeFixedMultiHit(2, 5),
        hitCount: 3,
      };
      const multiResult = calculateDamageV2(baseAttacker, baseDefender, multiMove, defaultContext);

      expect(multiResult.minDamage).toBe(singleResult.minDamage * 3);
      expect(multiResult.maxDamage).toBe(singleResult.maxDamage * 3);
      expect(multiResult.multiHit).toBeDefined();
      expect(multiResult.multiHit?.perHit).toHaveLength(3);
    });

    it('5ヒット: 1発分のmin/maxの5倍と一致', () => {
      const singleMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
      };
      const singleResult = calculateDamageV2(
        baseAttacker,
        baseDefender,
        singleMove,
        defaultContext
      );

      const multiMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
        damageEffect: makeFixedMultiHit(2, 5),
        hitCount: 5,
      };
      const multiResult = calculateDamageV2(baseAttacker, baseDefender, multiMove, defaultContext);

      expect(multiResult.minDamage).toBe(singleResult.minDamage * 5);
      expect(multiResult.maxDamage).toBe(singleResult.maxDamage * 5);
      expect(multiResult.multiHit?.perHit).toHaveLength(5);
    });
  });

  describe('escalating型', () => {
    it('3ヒット（トリプルキック powers:[10,20,30]）: 各回個別計算の合算', () => {
      const powers = [10, 20, 30];
      // 各回の1発分を個別に計算
      const perHitResults = powers.map((power) => {
        const move: CalcMove = {
          name: 'Triple Kick',
          power,
          type: 'Normal',
          category: 'Physical',
        };
        return calculateDamageV2(baseAttacker, baseDefender, move, defaultContext);
      });

      // escalating 3ヒットで計算
      const multiMove: CalcMove = {
        name: 'Triple Kick',
        power: 10,
        type: 'Normal',
        category: 'Physical',
        damageEffect: makeEscalatingMultiHit(powers),
        hitCount: 3,
      };
      const multiResult = calculateDamageV2(baseAttacker, baseDefender, multiMove, defaultContext);

      const expectedMin = perHitResults.reduce((sum, r) => sum + r.minDamage, 0);
      const expectedMax = perHitResults.reduce((sum, r) => sum + r.maxDamage, 0);
      expect(multiResult.minDamage).toBe(expectedMin);
      expect(multiResult.maxDamage).toBe(expectedMax);
      expect(multiResult.multiHit?.perHit).toHaveLength(3);
    });

    it('2ヒット: powers[0]とpowers[1]のみ使用', () => {
      const powers = [10, 20, 30];
      const perHitResults = powers.slice(0, 2).map((power) => {
        const move: CalcMove = {
          name: 'Triple Kick',
          power,
          type: 'Normal',
          category: 'Physical',
        };
        return calculateDamageV2(baseAttacker, baseDefender, move, defaultContext);
      });

      const multiMove: CalcMove = {
        name: 'Triple Kick',
        power: 10,
        type: 'Normal',
        category: 'Physical',
        damageEffect: makeEscalatingMultiHit(powers),
        hitCount: 2,
      };
      const multiResult = calculateDamageV2(baseAttacker, baseDefender, multiMove, defaultContext);

      const expectedMin = perHitResults.reduce((sum, r) => sum + r.minDamage, 0);
      const expectedMax = perHitResults.reduce((sum, r) => sum + r.maxDamage, 0);
      expect(multiResult.minDamage).toBe(expectedMin);
      expect(multiResult.maxDamage).toBe(expectedMax);
      expect(multiResult.multiHit?.perHit).toHaveLength(2);
    });
  });

  describe('hitCount未指定時のデフォルト', () => {
    it('hitCount未指定 + multiHitあり: max値がデフォルト', () => {
      // hitCount指定なし → max=5がデフォルト
      const multiMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
        damageEffect: makeFixedMultiHit(2, 5),
      };
      const multiResult = calculateDamageV2(baseAttacker, baseDefender, multiMove, defaultContext);

      // 1発分を計算
      const singleMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
      };
      const singleResult = calculateDamageV2(
        baseAttacker,
        baseDefender,
        singleMove,
        defaultContext
      );

      // デフォルトはmax=5回
      expect(multiResult.minDamage).toBe(singleResult.minDamage * 5);
      expect(multiResult.maxDamage).toBe(singleResult.maxDamage * 5);
      expect(multiResult.multiHit?.perHit).toHaveLength(5);
    });

    it('hitCount指定なし + multiHitなし: 通常1発計算、multiHitフィールドがundefined', () => {
      const move: CalcMove = {
        name: 'Tackle',
        power: 40,
        type: 'Normal',
        category: 'Physical',
      };
      const result = calculateDamageV2(baseAttacker, baseDefender, move, defaultContext);

      expect(result.multiHit).toBeUndefined();
      expect(result.minDamage).toBeGreaterThan(0);
    });
  });

  describe('perHitの各要素', () => {
    it('perHitの各要素が正しいダメージ値を持つこと', () => {
      const singleMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
      };
      const singleResult = calculateDamageV2(
        baseAttacker,
        baseDefender,
        singleMove,
        defaultContext
      );

      const multiMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
        damageEffect: makeFixedMultiHit(2, 5),
        hitCount: 3,
      };
      const multiResult = calculateDamageV2(baseAttacker, baseDefender, multiMove, defaultContext);

      // fixed型: 各ヒットは同じダメージ
      for (const hit of multiResult.multiHit?.perHit ?? []) {
        expect(hit.minDamage).toBe(singleResult.minDamage);
        expect(hit.maxDamage).toBe(singleResult.maxDamage);
        expect(hit.minPercent).toBeGreaterThan(0);
        expect(hit.maxPercent).toBeGreaterThan(0);
      }
    });
  });

  describe('特性・アイテムとの連携', () => {
    it('スキルリンク特性: fixed型でmax値が強制される', () => {
      const attacker: CalcPokemon = {
        ...baseAttacker,
        ability: ABILITY_SKILL_LINK,
      };
      const multiMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
        damageEffect: makeFixedMultiHit(2, 5),
        hitCount: 2, // hitCountに関係なくmax=5が強制される
      };
      const result = calculateDamageV2(attacker, baseDefender, multiMove, defaultContext);

      // 1発分
      const singleMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
      };
      const singleResult = calculateDamageV2(attacker, baseDefender, singleMove, defaultContext);

      // スキルリンクで5回固定
      expect(result.minDamage).toBe(singleResult.minDamage * 5);
      expect(result.maxDamage).toBe(singleResult.maxDamage * 5);
      expect(result.multiHit?.perHit).toHaveLength(5);
    });

    it('いかさまダイス: fixed型で min=4, max=5 に制限される', () => {
      const attacker: CalcPokemon = {
        ...baseAttacker,
        item: ITEM_LOADED_DICE,
      };
      const multiMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
        damageEffect: makeFixedMultiHit(2, 5),
        hitCount: 4,
      };
      const result = calculateDamageV2(attacker, baseDefender, multiMove, defaultContext);

      // 1発分
      const singleMove: CalcMove = {
        name: 'Bullet Seed',
        power: 25,
        type: 'Normal',
        category: 'Physical',
      };
      const singleResult = calculateDamageV2(attacker, baseDefender, singleMove, defaultContext);

      // いかさまダイスで4回
      expect(result.minDamage).toBe(singleResult.minDamage * 4);
      expect(result.maxDamage).toBe(singleResult.maxDamage * 4);
      expect(result.multiHit?.perHit).toHaveLength(4);
    });

    it('いかさまダイス + escalating型: 影響なし（そのまま）', () => {
      const powers = [10, 20, 30];
      const attacker: CalcPokemon = {
        ...baseAttacker,
        item: ITEM_LOADED_DICE,
      };
      const multiMove: CalcMove = {
        name: 'Triple Kick',
        power: 10,
        type: 'Normal',
        category: 'Physical',
        damageEffect: makeEscalatingMultiHit(powers),
        hitCount: 3,
      };
      const result = calculateDamageV2(attacker, baseDefender, multiMove, defaultContext);

      // escalating型はいかさまダイスの影響を受けない
      expect(result.multiHit?.perHit).toHaveLength(3);

      // 各回のダメージを個別に確認
      const perHitResults = powers.map((power) => {
        const move: CalcMove = {
          name: 'Triple Kick',
          power,
          type: 'Normal',
          category: 'Physical',
        };
        return calculateDamageV2(attacker, baseDefender, move, defaultContext);
      });
      const expectedMin = perHitResults.reduce((sum, r) => sum + r.minDamage, 0);
      const expectedMax = perHitResults.reduce((sum, r) => sum + r.maxDamage, 0);
      expect(result.minDamage).toBe(expectedMin);
      expect(result.maxDamage).toBe(expectedMax);
    });
  });
});
