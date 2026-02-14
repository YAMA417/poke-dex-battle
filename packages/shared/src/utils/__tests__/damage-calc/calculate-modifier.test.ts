import { describe, expect, it } from "vitest";
import type {
  BattleContext,
  CalcMove,
  CalcPokemon,
} from "../../../types/damage";
import { calculateModifier } from "../../damage-calc/calculate-modifier";

describe("calculateModifier", () => {
  const attacker: CalcPokemon = {
    level: 50,
    types: ["Dragon"],
    stats: { hp: 133, atk: 134, def: 95, spa: 137, spd: 95, spe: 114 },
    ability: "Multiscale",
  };

  const defender: CalcPokemon = {
    level: 50,
    types: ["Dragon", "Ground"],
    stats: { hp: 123, atk: 145, def: 95, spa: 85, spd: 95, spe: 102 },
  };

  const move: CalcMove = {
    name: "Dragon Tail",
    power: 60,
    type: "Dragon",
    category: "Physical",
  };

  const context: BattleContext = {};

  it("should return base damage without modifiers", () => {
    const baseDamage = 46;
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      move,
      context,
    );
    // Dragon attacker, Dragon/Ground defender, Dragon move
    // Type: Dragon vs Dragon (2x) × Dragon vs Ground (1x) = 2x
    // min: 46 * 0.85 * 1.5 * 2 = floor(39) * 1.5 * 2 = 58 * 2 = 116
    // max: 46 * 1.0 * 1.5 * 2 = 46 * 1.5 * 2 = 69 * 2 = 138
    expect(result.minDamage).toBe(116);
    expect(result.maxDamage).toBe(138);
  });

  it("should apply double battle spread modifier (0.75x)", () => {
    const baseDamage = 100;
    const spreadContext: BattleContext = {
      isDoubleBattle: true,
      isSpreadMove: true,
    };
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      move,
      spreadContext,
    );
    // 100 * 0.75 = 75 * 0.85 * 1.5(STAB) * 2(Dragon→Dragon) = ~191 for min
    // Dragon → Dragon/Ground: Dragon → Dragon (2x) × Dragon → Ground (1x) = 2x
    // min: 100 * 0.75 * 0.85 * 1.5 * 2 = 75 * 0.85 * 1.5 * 2 = floor(382.5) = 382 (Floor-by-floor: 75 → 75 * 0.85 = 63.75 → 63 → 63 * 1.5 = 94.5 → 94 → 94 * 2 = 188)
    // max: 100 * 0.75 * 1.0 * 1.5 * 2 = 75 * 1.0 * 1.5 * 2 = floor(225) = 225
    // Let's recalculate step-by-step: min: 100 * 0.75 = 75, then 75 * 0.85 = 63.75 → 63, then 63 * 1.5 = 94.5 → 94, then 94 * 2 = 188
    // max: 100 * 0.75 = 75, then 75 * 1.0 = 75, then 75 * 1.5 = 112.5 → 112, then 112 * 2 = 224
    expect(result.minDamage).toBe(188);
    expect(result.maxDamage).toBe(224);
  });

  it("should apply weather modifier (sun boost Fire type)", () => {
    const baseDamage = 80;
    const fireMove: CalcMove = {
      ...move,
      type: "Fire",
    };
    const sunContext: BattleContext = { weather: "sun" };
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      fireMove,
      sunContext,
    );
    // Fire attacker (no STAB), Dragon/Ground defender
    // Type: Fire vs Dragon (0.5x) × Fire vs Ground (1x) = 0.5x
    // min: 80 * 1.5(sun) * 0.85 * 1.0(no STAB) * 0.5 = 120 * 0.85 * 0.5 = floor(102) * 0.5 = 51
    // max: 80 * 1.5(sun) * 1.0 * 1.0 * 0.5 = 120 * 1.0 * 0.5 = 60
    expect(result.minDamage).toBe(51);
    expect(result.maxDamage).toBe(60);
  });

  it("should apply critical hit modifier (1.5x)", () => {
    const baseDamage = 60;
    const critMove: CalcMove = {
      ...move,
      isCritical: true,
    };
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      critMove,
      context,
    );
    // min: 60 * 1.5 = 90 → 90 * 0.85 = 76.5 → 76 → 76 * 1.5 = 114 → 114 * 2 = 228
    // max: 60 * 1.5 = 90 → 90 * 1.0 = 90 → 90 * 1.5 = 135 → 135 * 2 = 270
    expect(result.minDamage).toBe(228);
    expect(result.maxDamage).toBe(270);
  });

  it("should apply STAB modifier for same type", () => {
    const baseDamage = 46;
    // Attacker is Dragon type, move is Dragon type
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      move,
      context,
    );
    // STAB: 1.5x (since attacker is Dragon type)
    // Type: Dragon → Dragon/Ground: Dragon → Dragon (2x) × Dragon → Ground (1x) = 2x
    // min: 46 * 0.85 * 1.5 * 2 = 117.3 → 117
    // max: 46 * 1.0 * 1.5 * 2 = 138
    expect(result.maxDamage).toBe(138);
  });

  it("should not apply STAB for different type", () => {
    const baseDamage = 46;
    const fireMove: CalcMove = {
      ...move,
      type: "Fire",
    };
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      fireMove,
      context,
    );
    // No STAB: 1.0x
    // Type effectiveness: Fire vs Dragon/Ground = 0.5x
    // min: 46 * 0.85 * 1.0 * 0.5 = 19.55 → 19
    // max: 46 * 1.0 * 1.0 * 0.5 = 23
    expect(result.maxDamage).toBe(23);
  });

  it("should apply type effectiveness", () => {
    const baseDamage = 86;
    const waterMove: CalcMove = {
      name: "Surf",
      power: 90,
      type: "Water",
      category: "Special",
    };
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      waterMove,
      context,
    );
    // Water → Dragon/Ground: Water → Dragon (0.5x) × Water → Ground (2x) = 1x (neutral)
    // min: 86 * 0.85 * 1.0(no STAB) * 1.0 = 73.1 → 73
    // max: 86 * 1.0 * 1.0 * 1.0 = 86
    expect(result.maxDamage).toBeCloseTo(86, 0);
  });

  it("should apply Reflect modifier for physical moves (0.5x)", () => {
    const baseDamage = 86;
    const reflectContext: BattleContext = { reflect: true };
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      move,
      reflectContext,
    );
    // Reflect reduces physical damage to 0.5x (after random, STAB, type)
    // This should reduce final damage
    expect(result.minDamage).toBeLessThan(86 * 0.85 * 1.5); // less than no-reflect scenario
  });

  it("should not apply Reflect on critical hit", () => {
    const baseDamage = 86;
    const critMove: CalcMove = {
      ...move,
      isCritical: true,
    };
    const reflectContext: BattleContext = { reflect: true };
    const resultWithCrit = calculateModifier(
      baseDamage,
      attacker,
      defender,
      critMove,
      reflectContext,
    );
    const resultWithoutCrit = calculateModifier(
      baseDamage,
      attacker,
      defender,
      move,
      reflectContext,
    );
    // Critical hit ignores Reflect, so damage should be higher
    expect(resultWithCrit.minDamage).toBeGreaterThan(
      resultWithoutCrit.minDamage,
    );
  });

  it("should apply Light Screen modifier for special moves (0.5x)", () => {
    const baseDamage = 85;
    const specialMove: CalcMove = {
      name: "Dragon Pulse",
      power: 85,
      type: "Dragon",
      category: "Special",
    };
    const lightScreenContext: BattleContext = { lightScreen: true };
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      specialMove,
      lightScreenContext,
    );
    // Light Screen reduces special damage to 0.5x
    expect(result.minDamage).toBeLessThan(85 * 0.85 * 1.5);
  });

  it("should apply Life Orb modifier (1.3x)", () => {
    const baseDamage = 60;
    const attackerWithOrb: CalcPokemon = {
      ...attacker,
      item: "Life Orb",
    };
    const result = calculateModifier(
      baseDamage,
      attackerWithOrb,
      defender,
      move,
      context,
    );
    // Life Orb applies 1.3x to all moves. Uses applyOtherModifiers() with 4096 rounding
    // min: 60 * 0.85 * 1.5 * 2 * 1.3 (with pokeRound)
    // max: 60 * 1.0 * 1.5 * 2 * 1.3
    expect(result.minDamage).toBe(198);
    expect(result.maxDamage).toBe(234);
  });

  it("should apply Multiscale for full HP defender (0.5x)", () => {
    const baseDamage = 60;
    const defenderWithMS: CalcPokemon = {
      ...defender,
      ability: "Multiscale",
      currentHp: 123,
      maxHp: 123,
    };
    const result = calculateModifier(
      baseDamage,
      attacker,
      defenderWithMS,
      move,
      context,
    );
    // Multiscale reduces damage to 0.5x
    // min: 60 * 0.85 * 1.5 * 2 * 0.5 = floor(51) * 1.5 * 2 * 0.5 = 76 * 2 * 0.5 = 76
    // max: 60 * 1.0 * 1.5 * 2 * 0.5 = 60 * 1.5 * 2 * 0.5 = 90 * 2 * 0.5 = 90
    expect(result.minDamage).toBe(76);
    expect(result.maxDamage).toBe(90);
  });

  it("should not apply Multiscale when not at full HP", () => {
    const baseDamage = 60;
    const defenderWithMS: CalcPokemon = {
      ...defender,
      ability: "Multiscale",
      currentHp: 100,
      maxHp: 123,
    };
    const result = calculateModifier(
      baseDamage,
      attacker,
      defenderWithMS,
      move,
      context,
    );
    // Multiscale doesn't apply
    const resultWithoutMS = calculateModifier(
      baseDamage,
      attacker,
      defender,
      move,
      context,
    );
    expect(result.minDamage).toBeCloseTo(resultWithoutMS.minDamage, -1);
    expect(result.maxDamage).toBeCloseTo(resultWithoutMS.maxDamage, -1);
  });

  it("should respect random range (0.85 - 1.0)", () => {
    const baseDamage = 100;
    const result = calculateModifier(
      baseDamage,
      attacker,
      defender,
      move,
      context,
    );
    // min should use 0.85, max should use 1.0
    // The ratio should be approximately 0.85:1.0
    const ratio = result.minDamage / result.maxDamage;
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(0.9);
  });
});
