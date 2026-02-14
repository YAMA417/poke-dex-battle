import { describe, expect, it } from "vitest";
import { calculateBaseDamage } from "../../damage-calc/calculate-base-damage";

describe("calculateBaseDamage", () => {
  it("should calculate damage for a simple physical attack", () => {
    // レベル50、威力100、攻撃100、防御100の場合
    // levelFactor = floor((50 * 2) / 5) + 2 = 22
    // damage = floor(floor(floor((22 * 100 * 100) / 100) / 50) + 2)
    //        = floor(floor(2200 / 50) + 2)
    //        = floor(44 + 2) = 46
    const damage = calculateBaseDamage(50, 100, 100, 100);
    expect(damage).toBe(46);
  });

  it("should calculate damage for level 100", () => {
    // レベル100、威力100、攻撃100、防御100
    // levelFactor = floor((100 * 2) / 5) + 2 = 42
    // damage = floor(floor(floor((42 * 100 * 100) / 100) / 50) + 2)
    //        = floor(floor(4200 / 50) + 2)
    //        = floor(84 + 2) = 86
    const damage = calculateBaseDamage(100, 100, 100, 100);
    expect(damage).toBe(86);
  });

  it("should increase damage with higher attack", () => {
    const damageBase = calculateBaseDamage(50, 100, 100, 100);
    const damageHigher = calculateBaseDamage(50, 100, 150, 100);
    expect(damageHigher).toBeGreaterThan(damageBase);
  });

  it("should decrease damage with higher defense", () => {
    const damageBase = calculateBaseDamage(50, 100, 100, 100);
    const damageLower = calculateBaseDamage(50, 100, 100, 150);
    expect(damageLower).toBeLessThan(damageBase);
  });

  it("should scale damage with move power", () => {
    const damage100 = calculateBaseDamage(50, 100, 100, 100);
    const damage150 = calculateBaseDamage(50, 150, 100, 100);
    const ratio = damage150 / damage100;
    // 威力が1.5倍なら、ダメージもほぼ1.5倍になるはず
    expect(ratio).toBeGreaterThan(1.4);
    expect(ratio).toBeLessThan(1.6);
  });

  it("should always produce at least 2 damage (formula minimum)", () => {
    // 非常に低いステ設定でも最小値は2
    const damage = calculateBaseDamage(5, 1, 1, 500);
    expect(damage).toBeGreaterThanOrEqual(2);
  });
});
