import { describe, it, expect } from 'vitest';
import { calcAbilityPointTotal } from './party-validation';
import type { Stats } from '../types/pokemon';

describe('calcAbilityPointTotal', () => {
  // ヘルパー関数：Stats オブジェクトを生成
  const createStats = (
    hp: number,
    atk: number,
    def: number,
    spa: number,
    spd: number,
    spe: number
  ): Stats => ({
    hp,
    attack: atk,
    defense: def,
    specialAttack: spa,
    specialDefense: spd,
    speed: spe,
  });

  describe('単一ステータスのテスト', () => {
    it('能力P=0 の場合、合計は0', () => {
      expect(calcAbilityPointTotal(createStats(0, 0, 0, 0, 0, 0))).toBe(0);
    });

    it('HP能力P=10 の場合、合計は10', () => {
      expect(calcAbilityPointTotal(createStats(10, 0, 0, 0, 0, 0))).toBe(10);
    });

    it('攻撃能力P=32 の場合、合計は32', () => {
      expect(calcAbilityPointTotal(createStats(0, 32, 0, 0, 0, 0))).toBe(32);
    });
  });

  describe('複数ステータスのテスト', () => {
    it('各ステータス11ずつ（合計66）', () => {
      expect(calcAbilityPointTotal(createStats(11, 11, 11, 11, 11, 11))).toBe(66);
    });

    it('HP=32, 攻撃=32, 残り=2（合計66）', () => {
      expect(calcAbilityPointTotal(createStats(32, 32, 2, 0, 0, 0))).toBe(66);
    });

    it('HP=10, 攻撃=20, 防御=5, 特攻=0, 特防=1, 素早さ=30（合計66）', () => {
      expect(calcAbilityPointTotal(createStats(10, 20, 5, 0, 1, 30))).toBe(66);
    });

    it('全ステータス0の場合は0', () => {
      expect(calcAbilityPointTotal(createStats(0, 0, 0, 0, 0, 0))).toBe(0);
    });
  });

  describe('上限テスト', () => {
    it('全ステータス32の場合、192（理論値、実際には合計66制限）', () => {
      expect(calcAbilityPointTotal(createStats(32, 32, 32, 32, 32, 32))).toBe(192);
    });

    it('合計が66になるパターン', () => {
      expect(calcAbilityPointTotal(createStats(32, 32, 2, 0, 0, 0))).toBe(66);
    });
  });
});
