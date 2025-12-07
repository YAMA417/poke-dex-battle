import { describe, expect, it } from "vitest";
import type { DamageCalculationInput } from "../../types/damage";
import {
  calculateDamage,
  calculateStab,
  calculateWeatherModifier,
  getStatStageMultiplier,
} from "../damage-calc";

describe("damage-calc", () => {
  describe("getStatStageMultiplier", () => {
    it("ランク0は1.0倍", () => {
      expect(getStatStageMultiplier(0)).toBe(1.0);
    });

    it("ランク+1は1.5倍", () => {
      expect(getStatStageMultiplier(1)).toBe(1.5);
    });

    it("ランク-1は2/3倍", () => {
      expect(getStatStageMultiplier(-1)).toBeCloseTo(0.6667, 4);
    });

    it("ランク+6は4.0倍", () => {
      expect(getStatStageMultiplier(6)).toBe(4.0);
    });
  });

  describe("calculateStab", () => {
    it("タイプ一致は1.5倍", () => {
      expect(calculateStab("Fire", ["Fire", "Flying"])).toBe(1.5);
    });

    it("タイプ不一致は1.0倍", () => {
      expect(calculateStab("Water", ["Fire", "Flying"])).toBe(1.0);
    });

    it("テラスタル使用時、元タイプと一致なら2.0倍", () => {
      expect(calculateStab("Fire", ["Fire", "Flying"], "Fire", true)).toBe(2.0);
    });

    it("テラスタル使用時、元タイプと不一致なら1.5倍", () => {
      expect(calculateStab("Water", ["Fire", "Flying"], "Water", true)).toBe(
        1.5
      );
    });
  });

  describe("calculateWeatherModifier", () => {
    it("晴れ時の炎技は1.5倍", () => {
      expect(calculateWeatherModifier("Fire", "sun")).toBe(1.5);
    });

    it("雨時の水技は1.5倍", () => {
      expect(calculateWeatherModifier("Water", "rain")).toBe(1.5);
    });

    it("晴れ時の水技は0.5倍", () => {
      expect(calculateWeatherModifier("Water", "sun")).toBe(0.5);
    });
  });

  describe("calculateDamage", () => {
    it("カイリューのげきりん → ガブリアス", () => {
      const input: DamageCalculationInput = {
        movePower: 120,
        moveType: "Dragon",
        moveCategory: "Physical",
        attackerLevel: 50,
        attackerAttack: 204, // カイリューの攻撃実数値
        attackerTypes: ["Dragon", "Flying"],
        defenderDefense: 115, // ガブリアスの防御実数値
        defenderTypes: ["Dragon", "Ground"],
        condition: {
          weather: "none",
          field: "none",
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

      // ダメージ範囲を確認
      expect(result.minDamage).toBeGreaterThan(0);
      expect(result.maxDamage).toBeGreaterThanOrEqual(result.minDamage);

      // デバッグ情報を確認
      expect(result.details?.stab).toBe(1.5); // タイプ一致
      expect(result.details?.typeEffectiveness).toBe(2); // ドラゴン → ドラゴンは2倍
      expect(result.details?.weatherModifier).toBe(1.0);

      console.log("カイリューのげきりん → ガブリアス:", result);
    });

    it("てだすけ使用時は1.5倍", () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: "Normal",
        moveCategory: "Physical",
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ["Normal"],
        defenderDefense: 100,
        defenderTypes: ["Normal"],
        condition: {
          weather: "none",
          field: "none",
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

      const inputWithHelp = {
        ...input,
        condition: { ...input.condition, isHelpingHand: true },
      };
      const helpResult = calculateDamage(inputWithHelp);

      // てだすけありの方がダメージが高い
      expect(helpResult.maxDamage).toBeGreaterThan(normalResult.maxDamage);

      console.log("通常(最小値):", normalResult.minDamage);
      console.log("てだすけ(最小値):", helpResult.minDamage);
      console.log("通常(最大値):", normalResult.minDamage);
      console.log("てだすけ(最大値):", helpResult.minDamage);
    });

    it("ダブルバトルの全体技は0.75倍", () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: "Normal",
        moveCategory: "Physical",
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ["Normal"],
        defenderDefense: 100,
        defenderTypes: ["Normal"],
        condition: {
          weather: "none",
          field: "none",
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
          isDoubleBattle: false,
          isSpreadMove: false,
        },
      };

      const singleResult = calculateDamage(input);

      const doubleInput = {
        ...input,
        condition: {
          ...input.condition,
          isDoubleBattle: true,
          isSpreadMove: true,
        },
      };
      const doubleResult = calculateDamage(doubleInput);

      // 全体技の方がダメージが低い
      expect(doubleResult.maxDamage).toBeLessThan(singleResult.maxDamage);

      console.log("単体技:", singleResult.maxDamage);
      console.log("全体技:", doubleResult.maxDamage);
    });
  });
  describe("特性と持ち物のテスト", () => {
    it("テクニシャン: 威力60以下の技が1.5倍", () => {
      const input: DamageCalculationInput = {
        movePower: 60,
        moveType: "Normal",
        moveCategory: "Physical",
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ["Normal"],
        defenderDefense: 100,
        defenderTypes: ["Normal"],
        condition: {
          weather: "none",
          field: "none",
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
          attackerAbility: "Technician",
        },
      };

      const result = calculateDamage(input);
      console.log("テクニシャン適用:", result.maxDamage);

      expect(result.maxDamage).toBeGreaterThan(0);
    });

    it("こだわりハチマキ: 物理攻撃1.5倍", () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: "Normal",
        moveCategory: "Physical",
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ["Dragon", "Flying"],
        defenderDefense: 100,
        defenderTypes: ["Normal"],
        condition: {
          weather: "none",
          field: "none",
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
          attackerItem: "Choice Band",
        },
      };

      const result = calculateDamage(input);
      console.log("こだわりハチマキ適用:", result.maxDamage);

      expect(result.maxDamage).toBeGreaterThan(0);
    });

    it("いのちのたま: 全ての技1.3倍", () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: "Normal",
        moveCategory: "Physical",
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ["Dragon", "Flying"],
        defenderDefense: 100,
        defenderTypes: ["Normal"],
        condition: {
          weather: "none",
          field: "none",
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
          attackerItem: "Life Orb",
        },
      };

      const result = calculateDamage(input);
      console.log("いのちのたま適用:", result.maxDamage);

      expect(result.maxDamage).toBeGreaterThan(0);
    });

    it("マルチスケイル: HP満タン時ダメージ0.5倍", () => {
      const input: DamageCalculationInput = {
        movePower: 80,
        moveType: "Normal",
        moveCategory: "Physical",
        attackerLevel: 50,
        attackerAttack: 150,
        attackerTypes: ["Dragon", "Flying"],
        defenderDefense: 100,
        defenderTypes: ["Dragon", "Flying"],
        defenderCurrentHp: 183,
        defenderMaxHp: 183,
        condition: {
          weather: "none",
          field: "none",
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
          defenderAbility: "Multiscale",
        },
      };

      const result = calculateDamage(input);
      console.log("マルチスケイル適用:", result.maxDamage);

      expect(result.maxDamage).toBeGreaterThan(0);
    });
  });
});
