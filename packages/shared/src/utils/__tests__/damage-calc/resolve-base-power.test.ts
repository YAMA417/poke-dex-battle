import { describe, expect, it } from "vitest";
import type {
  BattleContext,
  CalcMove,
  CalcPokemon,
} from "../../../types/damage";
import { resolveBasePower } from "../../damage-calc/resolve-base-power";

describe("resolveBasePower", () => {
  // テスト用のポケモンと技を定義
  const kairoyu: CalcPokemon = {
    level: 50,
    types: ["Dragon"],
    stats: { hp: 133, atk: 134, def: 95, spa: 137, spd: 95, spe: 114 },
    ability: "Multiscale",
  };

  const gabriasu: CalcPokemon = {
    level: 50,
    types: ["Dragon", "Ground"],
    stats: { hp: 123, atk: 145, def: 95, spa: 85, spd: 95, spe: 102 },
  };

  const context: BattleContext = {};

  it("should return original power when no modifiers apply", () => {
    const move: CalcMove = {
      name: "Dragon Tail",
      power: 60,
      type: "Dragon",
      category: "Physical",
    };
    const result = resolveBasePower(move, kairoyu, gabriasu, context);
    expect(result).toBe(60);
  });

  it("should apply Helping Hand modifier (1.5x)", () => {
    const move: CalcMove = {
      name: "Dragon Tail",
      power: 60,
      type: "Dragon",
      category: "Physical",
    };
    const contextWithHelpingHand: BattleContext = { isHelpingHand: true };
    const result = resolveBasePower(
      move,
      kairoyu,
      gabriasu,
      contextWithHelpingHand,
    );
    // floor(60 * 1.5) = 90
    expect(result).toBe(90);
  });

  it("should apply Technician modifier for moves with power <= 60", () => {
    const technician: CalcPokemon = {
      ...kairoyu,
      ability: "Technician",
    };
    const move: CalcMove = {
      name: "Quick Attack",
      power: 40,
      type: "Normal",
      category: "Physical",
    };
    const result = resolveBasePower(move, technician, gabriasu, context);
    // floor(40 * 1.5) = 60
    expect(result).toBe(60);
  });

  it("should not apply Technician for moves with power > 60", () => {
    const technician: CalcPokemon = {
      ...kairoyu,
      ability: "Technician",
    };
    const move: CalcMove = {
      name: "Slash",
      power: 70,
      type: "Normal",
      category: "Physical",
    };
    const result = resolveBasePower(move, technician, gabriasu, context);
    // No modifier
    expect(result).toBe(70);
  });

  it("should apply Iron Fist modifier for punch moves (1.2x)", () => {
    const ironFist: CalcPokemon = {
      ...kairoyu,
      ability: "Iron Fist",
    };
    const move: CalcMove = {
      name: "Mach Punch",
      power: 40,
      type: "Fighting",
      category: "Physical",
      flags: { isPunchMove: true },
    };
    const result = resolveBasePower(move, ironFist, gabriasu, context);
    // floor(40 * 1.2) = 48
    expect(result).toBe(48);
  });

  it("should apply Reckless modifier for recoil moves (1.2x)", () => {
    const reckless: CalcPokemon = {
      ...kairoyu,
      ability: "Reckless",
    };
    const move: CalcMove = {
      name: "Double-Edge",
      power: 120,
      type: "Normal",
      category: "Physical",
      flags: { isRecoilMove: true },
    };
    const result = resolveBasePower(move, reckless, gabriasu, context);
    // floor(120 * 1.2) = 144
    expect(result).toBe(144);
  });

  it("should apply Expert Belt modifier for super effective moves", () => {
    const withItem: CalcPokemon = {
      ...kairoyu,
      item: "Expert Belt",
    };
    const move: CalcMove = {
      name: "Ice Beam",
      power: 90,
      type: "Ice", // Ice is super effective against Dragon
      category: "Special",
    };
    const result = resolveBasePower(move, withItem, gabriasu, context);
    // Ice → Dragon/Ground: Ice → Dragon (2x) × Ice → Ground (1x) = 2x (super effective)
    // floor(90 * 1.2) = 108
    expect(result).toBe(108);
  });

  it("should not apply Expert Belt for neutral damage", () => {
    const withItem: CalcPokemon = {
      ...kairoyu,
      item: "Expert Belt",
    };
    const move: CalcMove = {
      name: "Normal Attack",
      power: 100,
      type: "Normal", // Normal is neutral against Dragon/Ground
      category: "Physical",
    };
    const result = resolveBasePower(move, withItem, gabriasu, context);
    // Normal → Dragon/Ground: 1x (not super effective)
    // No modifier
    expect(result).toBe(100);
  });

  it("should apply Normal Gem modifier for Normal type moves", () => {
    const withGem: CalcPokemon = {
      ...kairoyu,
      item: "Normal Gem",
    };
    const move: CalcMove = {
      name: "Hyper Beam",
      power: 150,
      type: "Normal",
      category: "Special",
    };
    const result = resolveBasePower(move, withGem, gabriasu, context);
    // floor(150 * 1.3) = 195
    expect(result).toBe(195);
  });

  it("should apply Punching Glove modifier for punch moves (1.1x)", () => {
    const withGlove: CalcPokemon = {
      ...kairoyu,
      item: "Punching Glove",
    };
    const move: CalcMove = {
      name: "Close Combat",
      power: 120,
      type: "Fighting",
      category: "Physical",
      flags: { isPunchMove: true },
    };
    const result = resolveBasePower(move, withGlove, gabriasu, context);
    // floor(120 * 1.1) = 132
    expect(result).toBe(132);
  });

  it("should chain multiple modifiers (Technician + Helping Hand)", () => {
    const technician: CalcPokemon = {
      ...kairoyu,
      ability: "Technician",
    };
    const move: CalcMove = {
      name: "Quick Attack",
      power: 40,
      type: "Normal",
      category: "Physical",
    };
    const contextWithHelpingHand: BattleContext = { isHelpingHand: true };
    // 処理順序: Helping Hand (1.5x) → Technician (1.5x)
    // floor(40 * 1.5) = 60 (Helping Hand)
    // floor(60 * 1.5) = 90 (Technician)
    const result = resolveBasePower(
      move,
      technician,
      gabriasu,
      contextWithHelpingHand,
    );
    expect(result).toBe(90);
  });
});
