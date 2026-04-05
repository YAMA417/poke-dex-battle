import { describe, expect, it } from 'vitest';
import { ITEM_CHOICE_BAND, ITEM_MUSCLE_BAND } from '../../../constants/damage-calc-names';
import type { CalcMove, CalcPokemon } from '../../../types/damage';
import {
  resolveEffectiveAttack,
  resolveEffectiveDefense,
} from '../../damage-calc/resolve-effective-stat';

describe('resolveEffectiveAttack', () => {
  const attacker: CalcPokemon = {
    level: 50,
    types: ['Dragon'],
    stats: { hp: 133, atk: 134, def: 95, spa: 137, spd: 95, spe: 114 },
  };

  const physicalMove: CalcMove = {
    name: 'Dragon Tail',
    power: 60,
    type: 'Dragon',
    category: 'Physical',
  };

  const specialMove: CalcMove = {
    name: 'Dragon Pulse',
    power: 85,
    type: 'Dragon',
    category: 'Special',
  };

  it('should return base attack for no boosts', () => {
    const result = resolveEffectiveAttack(attacker, physicalMove);
    expect(result).toBe(134); // base atk
  });

  it('should apply positive boost multiplier', () => {
    const boosted: CalcPokemon = {
      ...attacker,
      boosts: { atk: 1 },
    };
    // Stage +1: 3/2 multiplier
    const result = resolveEffectiveAttack(boosted, physicalMove);
    expect(result).toBe(Math.floor(134 * 1.5)); // 201
  });

  it('should apply negative boost multiplier', () => {
    const lowered: CalcPokemon = {
      ...attacker,
      boosts: { atk: -1 },
    };
    // Stage -1: 2/3 multiplier
    const result = resolveEffectiveAttack(lowered, physicalMove);
    expect(result).toBe(Math.floor(134 * (2 / 3))); // 89
  });

  it('should ignore negative boost on critical hit (physical)', () => {
    const lowered: CalcPokemon = {
      ...attacker,
      boosts: { atk: -1 },
    };
    const criticalMove = { ...physicalMove, isCritical: true };
    const result = resolveEffectiveAttack(lowered, criticalMove);
    expect(result).toBe(134); // base atk, ignoring boost
  });

  it('should apply Choice Band for physical moves (1.5x)', () => {
    const withBand: CalcPokemon = {
      ...attacker,
      item: ITEM_CHOICE_BAND,
    };
    const result = resolveEffectiveAttack(withBand, physicalMove);
    expect(result).toBe(Math.floor(134 * 1.5)); // 201
  });

  it('should apply Muscle Band for physical moves (1.1x)', () => {
    const withBand: CalcPokemon = {
      ...attacker,
      item: ITEM_MUSCLE_BAND,
    };
    const result = resolveEffectiveAttack(withBand, physicalMove);
    expect(result).toBe(Math.floor(134 * 1.1)); // 147
  });

  it('やけどは resolveEffectiveAttack では適用しない（calculate-modifier で処理）', () => {
    const burned: CalcPokemon = {
      ...attacker,
      status: 'burn',
    };
    // やけど補正は calculate-modifier.ts に移動済み
    const result = resolveEffectiveAttack(burned, physicalMove);
    expect(result).toBe(134); // やけど補正なしの素ステータス
  });

  it('should use spa stat for special moves', () => {
    const result = resolveEffectiveAttack(attacker, specialMove);
    expect(result).toBe(137); // base spa
  });

  it('こだわりハチマキ + やけどでもここでは Band のみ適用', () => {
    const burned: CalcPokemon = {
      ...attacker,
      item: ITEM_CHOICE_BAND,
      status: 'burn',
    };
    // やけど補正は calculate-modifier.ts に移動済みのため、ここでは Choice Band のみ
    const result = resolveEffectiveAttack(burned, physicalMove);
    expect(result).toBe(Math.floor(134 * 1.5)); // 201
  });
});

describe('resolveEffectiveDefense', () => {
  const defender: CalcPokemon = {
    level: 50,
    types: ['Dragon', 'Ground'],
    stats: { hp: 123, atk: 145, def: 95, spa: 85, spd: 95, spe: 102 },
  };

  const physicalMove: CalcMove = {
    name: 'Dragon Tail',
    power: 60,
    type: 'Dragon',
    category: 'Physical',
  };

  const specialMove: CalcMove = {
    name: 'Dragon Pulse',
    power: 85,
    type: 'Dragon',
    category: 'Special',
  };

  it('should return base defense for no boosts', () => {
    const result = resolveEffectiveDefense(defender, physicalMove);
    expect(result).toBe(95); // base def
  });

  it('should apply positive boost multiplier', () => {
    const boosted: CalcPokemon = {
      ...defender,
      boosts: { def: 2 },
    };
    // Stage +2: 2.0 multiplier
    const result = resolveEffectiveDefense(boosted, physicalMove);
    expect(result).toBe(Math.floor(95 * 2.0)); // 190
  });

  it('should apply negative boost multiplier', () => {
    const lowered: CalcPokemon = {
      ...defender,
      boosts: { def: -1 },
    };
    // Stage -1: 2/3 multiplier
    const result = resolveEffectiveDefense(lowered, physicalMove);
    expect(result).toBe(Math.floor(95 * (2 / 3))); // 63
  });

  it('should ignore positive boost on critical hit (physical)', () => {
    const boosted: CalcPokemon = {
      ...defender,
      boosts: { def: 2 },
    };
    const criticalMove = { ...physicalMove, isCritical: true };
    const result = resolveEffectiveDefense(boosted, criticalMove);
    expect(result).toBe(95); // base def, ignoring boost
  });

  it('should use spd stat for special moves', () => {
    const result = resolveEffectiveDefense(defender, specialMove);
    expect(result).toBe(95); // base spd
  });

  it('should apply boost to special defense', () => {
    const boosted: CalcPokemon = {
      ...defender,
      boosts: { spd: 1 },
    };
    const result = resolveEffectiveDefense(boosted, specialMove);
    expect(result).toBe(Math.floor(95 * 1.5)); // 142
  });
});
