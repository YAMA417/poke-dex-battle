import { describe, expect, it } from "vitest";
import { applyOtherModifiers } from "../../damage-calc/apply-other-modifiers";

describe("applyOtherModifiers", () => {
  it("should return the same damage when modifiers are all 1.0", () => {
    const baseDamage = 100;
    const modifiers = [1.0, 1.0, 1.0];
    expect(applyOtherModifiers(baseDamage, modifiers)).toBe(100);
  });

  it("should apply a single modifier correctly", () => {
    const baseDamage = 100;
    // 持ち物: 1.3倍（いのちのたま）
    const modifiers = [1.3];
    const result = applyOtherModifiers(baseDamage, modifiers);
    expect(result).toBe(130);
  });

  it("should chain multiple modifiers correctly (4096 base)", () => {
    const baseDamage = 100;
    // 複数の補正を連鎖させる（shadowtag.xyz方式）
    // 1.3 × 0.5 = 0.65 → 4096チェーン計算で 65 に確定
    const modifiers = [1.3, 0.5];
    const result = applyOtherModifiers(baseDamage, modifiers);
    expect(result).toBe(65);
  });

  it("should handle empty modifier list", () => {
    const baseDamage = 100;
    expect(applyOtherModifiers(baseDamage, [])).toBe(100);
  });

  it("should skip modifiers equal to 1.0", () => {
    const baseDamage = 100;
    // 1.0のモディファイアはスキップされるため、結果は1.5で計算される
    const modifiers = [1.0, 1.5, 1.0];
    const result = applyOtherModifiers(baseDamage, modifiers);
    expect(result).toBe(150);
  });
});
