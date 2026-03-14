import { describe, expect, it } from 'vitest';
import { applyRandom } from '../../damage-calc/apply-random';

describe('applyRandom', () => {
  it('should apply minimum random (seed=0) for 0.85x factor', () => {
    const baseDamage = 100;
    // seed=0: factor = (85 + 0) / 100 = 0.85
    const damage = applyRandom(baseDamage, 0);
    expect(damage).toBe(85);
  });

  it('should apply maximum random (seed=15) for 1.00x factor', () => {
    const baseDamage = 100;
    // seed=15: factor = (85 + 15) / 100 = 1.00
    const damage = applyRandom(baseDamage, 15);
    expect(damage).toBe(100);
  });

  it('should apply mid-range random (seed=8)', () => {
    const baseDamage = 100;
    // seed=8: factor = (85 + 8) / 100 = 0.93
    const damage = applyRandom(baseDamage, 8);
    expect(damage).toBe(93);
  });

  it('should scale correctly for different base damages', () => {
    // baseDamage=200, seed=0で170（200*0.85）
    const damage1 = applyRandom(200, 0);
    expect(damage1).toBe(170);

    // baseDamage=50, seed=0で42（50*0.85=42.5→42）
    const damage2 = applyRandom(50, 0);
    expect(damage2).toBe(42);
  });

  it('should use Math.random when seed is undefined', () => {
    const baseDamage = 100;
    // seedなしで複数回実行して、範囲内の結果を確認
    const results = Array.from({ length: 20 }, () => applyRandom(baseDamage));

    // すべての結果が有効な範囲内（85-100）
    for (const result of results) {
      expect(result).toBeGreaterThanOrEqual(85);
      expect(result).toBeLessThanOrEqual(100);
    }
  });
});
