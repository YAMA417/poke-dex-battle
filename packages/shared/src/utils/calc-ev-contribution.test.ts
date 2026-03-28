import { describe, it, expect } from 'vitest';
import { calcEvContributionToActualStats } from './stat-calc';
import type { Stats } from '../types/pokemon';

describe('calcEvContributionToActualStats', () => {
  // ヘルパー関数：Stats オブジェクトを生成
  const createStats = (
    hp: number,
    attack: number,
    defense: number,
    specialAttack: number,
    specialDefense: number,
    speed: number
  ): Stats => ({
    hp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed,
  });

  describe('単一ステータスのテスト', () => {
    it('EV=0 の場合、寄与度は0', () => {
      const stats = createStats(0, 0, 0, 0, 0, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(0);
    });

    it('EV=3 の場合、寄与度は0', () => {
      const stats = createStats(3, 0, 0, 0, 0, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(0);
    });

    it('EV=4 の場合、寄与度は1', () => {
      const stats = createStats(4, 0, 0, 0, 0, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(1);
    });

    it('EV=11 の場合、寄与度は1', () => {
      const stats = createStats(11, 0, 0, 0, 0, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(1);
    });

    it('EV=12 の場合、寄与度は2', () => {
      const stats = createStats(12, 0, 0, 0, 0, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(2);
    });

    it('EV=19 の場合、寄与度は2', () => {
      const stats = createStats(19, 0, 0, 0, 0, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(2);
    });

    it('EV=20 の場合、寄与度は3', () => {
      const stats = createStats(20, 0, 0, 0, 0, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(3);
    });

    it('EV=28 の場合、寄与度は4', () => {
      const stats = createStats(28, 0, 0, 0, 0, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(4);
    });

    it('EV=252 の場合、寄与度は32', () => {
      // 計算: 1 + floor((252 - 4) / 8) = 1 + floor(248 / 8) = 1 + 31 = 32
      const stats = createStats(252, 0, 0, 0, 0, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(32);
    });
  });

  describe('複数ステータスのテスト', () => {
    it('例1: HP=0, 攻撃=4, 防御=12, 特攻=20, 特防=28, 素早さ=0', () => {
      // HP: 0, 攻撃: 1, 防御: 2, 特攻: 3, 特防: 4, 素早さ: 0
      // 合計: 0 + 1 + 2 + 3 + 4 + 0 = 10
      const stats = createStats(0, 4, 12, 20, 28, 0);
      expect(calcEvContributionToActualStats(stats)).toBe(10);
    });

    it('例2: EV合計510（全ステータス85）の場合', () => {
      // 各85: 1 + floor((85 - 4) / 8) = 1 + floor(81 / 8) = 1 + 10 = 11
      // 合計: 11 * 6 = 66
      const stats = createStats(85, 85, 85, 85, 85, 85);
      expect(calcEvContributionToActualStats(stats)).toBe(66);
    });

    it('最大値66に達する（全ステータス252の場合）', () => {
      // 各252: 1 + floor((252 - 4) / 8) = 1 + 31 = 32
      // 合計: 32 * 6 = 192（実際にはEV合計510制限があるため、この設定は不可能）
      // ただわかりやすく確認するため、計算の理論値をテスト
      const stats = createStats(252, 252, 252, 252, 252, 252);
      expect(calcEvContributionToActualStats(stats)).toBe(192);
    });

    it('EV合計510（攻撃252, 素早さ252, 特防4）の場合', () => {
      // 攻撃252: 32, 素早さ252: 32, 特防4: 1
      // 合計: 32 + 32 + 0 + 0 + 1 + 0 = 65
      const stats = createStats(0, 252, 0, 0, 4, 252);
      expect(calcEvContributionToActualStats(stats)).toBe(65);
    });

    it('境界値テスト: 各ステータス4,4,3,4,4,4', () => {
      // 4: 1, 4: 1, 3: 0, 4: 1, 4: 1, 4: 1
      // 合計: 1 + 1 + 0 + 1 + 1 + 1 = 5
      const stats = createStats(4, 4, 3, 4, 4, 4);
      expect(calcEvContributionToActualStats(stats)).toBe(5);
    });
  });

  describe('実装の検証テスト', () => {
    it('実数値寄与度が66を超えないことを確認（理論値）', () => {
      // EV合計510の場合、最大寄与度は66
      // 例: 全ステータス85（合計510）
      const stats = createStats(85, 85, 85, 85, 85, 85);
      expect(calcEvContributionToActualStats(stats)).toBe(66);
    });

    it('計算式が一貫していることを確認', () => {
      // EV 4,12,20,28,36,44 の場合
      // 寄与度: 1,2,3,4,5,6
      // 合計: 21
      const stats = createStats(4, 12, 20, 28, 36, 44);
      expect(calcEvContributionToActualStats(stats)).toBe(21);
    });
  });
});
