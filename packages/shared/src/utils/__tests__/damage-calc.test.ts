import { describe, expect, it } from 'vitest';
import type { BattleContext, CalcMove, CalcPokemon } from '../../types/damage';
import { calculateStab, calculateWeatherModifier, getStatStageMultiplier } from '../damage-calc';
import { calculateDamageV2 } from '../damage-calc/index';

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

    it('テラタイプ≠技タイプ、元タイプ=技タイプ → 1.5倍', () => {
      // 炎テラス中に飛行技（元タイプ一致）を使う
      expect(calculateStab('Flying', ['Fire', 'Flying'], 'Fire', true)).toBe(1.5);
    });

    it('テラタイプ≠技タイプ、元タイプ=技タイプ、適応力 → 1.5倍（適応力不発）', () => {
      expect(calculateStab('Flying', ['Fire', 'Flying'], 'Fire', true, 'Adaptability')).toBe(1.5);
    });

    it('ステラ未使用+元タイプ一致 → 2.0倍', () => {
      expect(calculateStab('Fire', ['Fire', 'Flying'], 'Stellar', true, undefined, false)).toBe(
        2.0
      );
    });

    it('ステラ未使用+元タイプ不一致 → 1.2倍', () => {
      expect(calculateStab('Water', ['Fire', 'Flying'], 'Stellar', true, undefined, false)).toBe(
        1.2
      );
    });

    it('ステラ使用済+元タイプ一致 → 1.5倍', () => {
      expect(calculateStab('Fire', ['Fire', 'Flying'], 'Stellar', true, undefined, true)).toBe(1.5);
    });

    it('ステラ使用済+元タイプ不一致 → 1.0倍', () => {
      expect(calculateStab('Water', ['Fire', 'Flying'], 'Stellar', true, undefined, true)).toBe(
        1.0
      );
    });

    it('ステラ+適応力 → 適応力不発確認', () => {
      // ステラ時は適応力が効かない
      expect(
        calculateStab('Fire', ['Fire', 'Flying'], 'Stellar', true, 'Adaptability', false)
      ).toBe(2.0);
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

  describe('calculateDamageV2', () => {
    it('①カイリューのげきりん → ガブリアス', () => {
      const attacker: CalcPokemon = {
        level: 50,
        types: ['Dragon', 'Flying'],
        stats: { hp: 0, atk: 204, def: 0, spa: 0, spd: 0, spe: 0 },
      };
      const defender: CalcPokemon = {
        level: 50,
        types: ['Dragon', 'Ground'],
        stats: { hp: 100, atk: 0, def: 115, spa: 0, spd: 0, spe: 0 },
        maxHp: 100,
      };
      const move: CalcMove = {
        name: 'Outrage',
        power: 120,
        type: 'Dragon',
        category: 'Physical',
      };
      const context: BattleContext = {};

      const result = calculateDamageV2(attacker, defender, move, context);

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(240);
      expect(result.maxDamage).toBe(284);
    });

    it('②通常攻撃とてだすけ使用時', () => {
      const attacker: CalcPokemon = {
        level: 50,
        types: ['Normal'],
        stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
      };
      const defender: CalcPokemon = {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
        maxHp: 100,
      };
      const move: CalcMove = {
        name: '',
        power: 80,
        type: 'Normal',
        category: 'Physical',
      };

      const normalResult = calculateDamageV2(attacker, defender, move, {});
      const helpResult = calculateDamageV2(attacker, defender, move, { isHelpingHand: true });

      // shadowtag.xyzの期待値
      expect(normalResult.minDamage).toBe(67);
      expect(normalResult.maxDamage).toBe(81);
      expect(helpResult.minDamage).toBe(102);
      expect(helpResult.maxDamage).toBe(121);
    });

    it('④ダブルバトルの全体技は0.75倍', () => {
      const attacker: CalcPokemon = {
        level: 50,
        types: ['Normal'],
        stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
      };
      const defender: CalcPokemon = {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
        maxHp: 100,
      };
      const move: CalcMove = {
        name: '',
        power: 80,
        type: 'Normal',
        category: 'Physical',
      };
      const context: BattleContext = {
        isDoubleBattle: true,
        isSpreadMove: true,
      };

      const result = calculateDamageV2(attacker, defender, move, context);

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(51);
      expect(result.maxDamage).toBe(60);
    });
  });

  describe('特性と持ち物のテスト', () => {
    it('⑤テクニシャン: 威力60以下の技が1.5倍', () => {
      const attacker: CalcPokemon = {
        level: 50,
        types: ['Normal'],
        stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
        ability: 'Technician',
      };
      const defender: CalcPokemon = {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
        maxHp: 100,
      };
      const move: CalcMove = {
        name: '',
        power: 60,
        type: 'Normal',
        category: 'Physical',
      };

      const result = calculateDamageV2(attacker, defender, move, {});

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(76);
      expect(result.maxDamage).toBe(91);
    });

    it('⑥こだわりハチマキ: 物理攻撃1.5倍', () => {
      const attacker: CalcPokemon = {
        level: 50,
        types: ['Dragon', 'Flying'],
        stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
        item: 'Choice Band',
      };
      const defender: CalcPokemon = {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
        maxHp: 100,
      };
      const move: CalcMove = {
        name: '',
        power: 80,
        type: 'Normal',
        category: 'Physical',
      };

      const result = calculateDamageV2(attacker, defender, move, {});

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(68);
      expect(result.maxDamage).toBe(81);
    });

    it('⑦いのちのたま: 全ての技1.3倍', () => {
      const attacker: CalcPokemon = {
        level: 50,
        types: ['Dragon', 'Flying'],
        stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
        item: 'Life Orb',
      };
      const defender: CalcPokemon = {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
        maxHp: 100,
      };
      const move: CalcMove = {
        name: '',
        power: 80,
        type: 'Normal',
        category: 'Physical',
      };

      const result = calculateDamageV2(attacker, defender, move, {});

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(58);
      expect(result.maxDamage).toBe(70);
    });

    it('⑧マルチスケイル: HP満タン時ダメージ0.5倍', () => {
      const attacker: CalcPokemon = {
        level: 50,
        types: ['Dragon', 'Flying'],
        stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
      };
      const defender: CalcPokemon = {
        level: 50,
        types: ['Dragon', 'Flying'],
        stats: { hp: 183, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
        ability: 'Multiscale',
        currentHp: 183,
        maxHp: 183,
      };
      const move: CalcMove = {
        name: '',
        power: 80,
        type: 'Normal',
        category: 'Physical',
      };

      const result = calculateDamageV2(attacker, defender, move, {});

      // shadowtag.xyzの期待値
      expect(result.minDamage).toBe(22);
      expect(result.maxDamage).toBe(27);
    });
  });
});
