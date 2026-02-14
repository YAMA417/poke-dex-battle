import { describe, expect, it } from "vitest";
import { pokeRound } from "../../damage-calc/poke-round";

describe("pokeRound", () => {
  it("should round down for values < 0.5", () => {
    expect(pokeRound(142.4)).toBe(142);
    expect(pokeRound(100.0)).toBe(100);
    expect(pokeRound(123.49)).toBe(123);
  });

  it("should round down for exactly 0.5", () => {
    expect(pokeRound(142.5)).toBe(142);
    expect(pokeRound(100.5)).toBe(100);
    expect(pokeRound(1.5)).toBe(1);
  });

  it("should round up for values > 0.5", () => {
    expect(pokeRound(142.6)).toBe(143);
    expect(pokeRound(100.9)).toBe(101);
    expect(pokeRound(123.51)).toBe(124);
  });

  it("should handle integers without change", () => {
    expect(pokeRound(100)).toBe(100);
    expect(pokeRound(1)).toBe(1);
    expect(pokeRound(0)).toBe(0);
  });
});
