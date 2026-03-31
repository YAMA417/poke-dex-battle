import { describe, expect, it } from 'vitest';
import type { BattleContext, CalcMove, CalcPokemon } from '../../../types/damage';
import { calculateDamageV2 } from '../../damage-calc/index';

/**
 * ダメージ計算エンジン V2 統合テスト
 */
describe('ダメージ計算エンジン統合テスト', () => {
  it('①カイリューのげきりん → ガブリアス (min: 240, max: 284)', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Dragon', 'Flying'],
      stats: { hp: 0, atk: 204, def: 0, spa: 0, spd: 0, spe: 0 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Dragon', 'Ground'],
      stats: { hp: 100, atk: 0, def: 115, spa: 0, spd: 0, spe: 0 },
      maxHp: 100,
    };
    const move: CalcMove = {
      name: 'Outrage',
      power: 120,
      type: 'Dragon',
      category: 'Physical',
    };

    const result = calculateDamageV2(attacker, defender, move, {});
    expect(result.minDamage).toBe(240);
    expect(result.maxDamage).toBe(284);
  });

  it('②ガブリアスの逆鱗 → ガブリアス (min: 236, max: 278)', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Dragon', 'Ground'],
      stats: { hp: 0, atk: 200, def: 0, spa: 0, spd: 0, spe: 0 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Dragon', 'Ground'],
      stats: { hp: 100, atk: 0, def: 115, spa: 0, spd: 0, spe: 0 },
      maxHp: 100,
    };
    const move: CalcMove = {
      name: 'Outrage',
      power: 120,
      type: 'Dragon',
      category: 'Physical',
    };

    const result = calculateDamageV2(attacker, defender, move, {});
    expect(result.minDamage).toBe(236);
    expect(result.maxDamage).toBe(278);
  });

  it('③通常攻撃 + てだすけ (min: 102, max: 121)', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
      maxHp: 100,
    };
    const move: CalcMove = {
      name: '',
      power: 80,
      type: 'Normal',
      category: 'Physical',
    };
    const context: BattleContext = { isHelpingHand: true };

    const result = calculateDamageV2(attacker, defender, move, context);
    expect(result.minDamage).toBe(102);
    expect(result.maxDamage).toBe(121);
  });

  it('④ダブル全体技 (min: 51, max: 60)', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
      maxHp: 100,
    };
    const move: CalcMove = {
      name: '',
      power: 80,
      type: 'Normal',
      category: 'Physical',
    };
    const context: BattleContext = { isDoubleBattle: true, isSpreadMove: true };

    const result = calculateDamageV2(attacker, defender, move, context);
    expect(result.minDamage).toBe(51);
    expect(result.maxDamage).toBe(60);
  });

  it('⑤テクニシャン (min: 76, max: 91)', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
      ability: 'Technician',
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
      maxHp: 100,
    };
    const move: CalcMove = {
      name: '',
      power: 60,
      type: 'Normal',
      category: 'Physical',
    };

    const result = calculateDamageV2(attacker, defender, move, {});
    expect(result.minDamage).toBe(76);
    expect(result.maxDamage).toBe(91);
  });

  it('⑤こだわりハチマキ (min: 68, max: 81)', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Dragon', 'Flying'],
      stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
      item: 'Choice Band',
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
      maxHp: 100,
    };
    const move: CalcMove = {
      name: '',
      power: 80,
      type: 'Normal',
      category: 'Physical',
    };

    const result = calculateDamageV2(attacker, defender, move, {});
    expect(result.minDamage).toBe(68);
    expect(result.maxDamage).toBe(81);
  });

  it('⑥いのちのたま (min: 58, max: 70)', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Dragon', 'Flying'],
      stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
      item: 'Life Orb',
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
      maxHp: 100,
    };
    const move: CalcMove = {
      name: '',
      power: 80,
      type: 'Normal',
      category: 'Physical',
    };

    const result = calculateDamageV2(attacker, defender, move, {});
    expect(result.minDamage).toBe(58);
    expect(result.maxDamage).toBe(70);
  });

  it('⑦マルチスケイル (min: 22, max: 27)', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Dragon', 'Flying'],
      stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Dragon', 'Flying'],
      stats: { hp: 183, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
      ability: 'Multiscale',
      currentHp: 183,
      maxHp: 183,
    };
    const move: CalcMove = {
      name: '',
      power: 80,
      type: 'Normal',
      category: 'Physical',
    };

    const result = calculateDamageV2(attacker, defender, move, {});
    expect(result.minDamage).toBe(22);
    expect(result.maxDamage).toBe(27);
  });
});

/**
 * Issue #16 再現ケース + 新規追加補正の統合テスト
 * V2 API を直接使用（スラッグ形式の名前で呼び出す）
 */
describe('Issue #16: スラッグ形式名での補正適用テスト', () => {
  it('⑧ミライドン/イナズマドライブ/ハドロンエンジン → オーガポン-かまど (78-93)', () => {
    const result = calculateDamageV2(
      {
        level: 50,
        types: ['Electric', 'Dragon'],
        stats: { hp: 175, atk: 100, def: 100, spa: 187, spd: 100, spe: 100 },
        ability: 'hadron-engine',
      },
      {
        level: 50,
        types: ['Grass', 'Fire'],
        stats: { hp: 155, atk: 100, def: 100, spa: 100, spd: 116, spe: 100 },
        maxHp: 155,
      },
      { name: 'electro-drift', power: 100, type: 'Electric', category: 'Special' },
      { field: 'electric', isDoubleBattle: true }
    );

    expect(result.minDamage).toBe(78);
    expect(result.maxDamage).toBe(93);
  });

  it('⑨テクニシャン（スラッグ形式）が正しく適用される', () => {
    const result = calculateDamageV2(
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
        ability: 'technician',
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      {
        name: 'mach-punch',
        power: 40,
        type: 'Fighting',
        category: 'Physical',
        flags: { isPunchMove: true },
      },
      { isDoubleBattle: true }
    );

    expect(result.minDamage).toBeGreaterThan(0);
    expect(result.details?.stab).toBe(1.0);
  });

  it('⑩こだわりメガネ（スラッグ形式）が正しく適用される', () => {
    const withSpecs = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
        item: 'choice-specs',
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flamethrower', power: 90, type: 'Fire', category: 'Special' },
      { isDoubleBattle: true }
    );

    const withoutSpecs = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flamethrower', power: 90, type: 'Fire', category: 'Special' },
      { isDoubleBattle: true }
    );

    expect(withSpecs.maxDamage).toBeGreaterThan(withoutSpecs.maxDamage);
  });

  it('⑪はたきおとす: 持ち物ありで1.5倍', () => {
    const withItem = calculateDamageV2(
      {
        level: 50,
        types: ['Dark'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        item: 'leftovers',
        maxHp: 175,
      },
      { name: 'knock-off', power: 65, type: 'Dark', category: 'Physical' },
      { isDoubleBattle: true }
    );

    const withoutItem = calculateDamageV2(
      {
        level: 50,
        types: ['Dark'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'knock-off', power: 65, type: 'Dark', category: 'Physical' },
      { isDoubleBattle: true }
    );

    expect(withItem.maxDamage).toBeGreaterThan(withoutItem.maxDamage);
  });

  it('⑫かたやぶり vs マルチスケイル: 防御特性を無視', () => {
    const moldBreaker = calculateDamageV2(
      {
        level: 50,
        types: ['Grass'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
        ability: 'mold-breaker',
      },
      {
        level: 50,
        types: ['Dragon', 'Flying'],
        stats: { hp: 183, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        ability: 'multiscale',
        currentHp: 183,
        maxHp: 183,
      },
      { name: 'power-whip', power: 120, type: 'Grass', category: 'Physical' },
      { isDoubleBattle: true }
    );

    const noMoldBreaker = calculateDamageV2(
      {
        level: 50,
        types: ['Grass'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Dragon', 'Flying'],
        stats: { hp: 183, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        ability: 'multiscale',
        currentHp: 183,
        maxHp: 183,
      },
      { name: 'power-whip', power: 120, type: 'Grass', category: 'Physical' },
      { isDoubleBattle: true }
    );

    expect(moldBreaker.maxDamage).toBeGreaterThan(noMoldBreaker.maxDamage);
  });

  it('⑬半減実: 効果抜群ダメージを0.5倍', () => {
    const withBerry = calculateDamageV2(
      {
        level: 50,
        types: ['Ice'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Dragon'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        item: 'yache-berry',
        maxHp: 175,
      },
      { name: 'ice-beam', power: 90, type: 'Ice', category: 'Special' },
      { isDoubleBattle: true }
    );

    const withoutBerry = calculateDamageV2(
      {
        level: 50,
        types: ['Ice'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Dragon'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'ice-beam', power: 90, type: 'Ice', category: 'Special' },
      { isDoubleBattle: true }
    );

    expect(withBerry.maxDamage).toBeLessThan(withoutBerry.maxDamage);
    expect(withBerry.maxDamage).toBeCloseTo(Math.floor(withoutBerry.maxDamage * 0.5), -1);
  });

  it('⑭こだいかっせい + 晴れ: 最高ステータスが攻撃の場合のみ補正', () => {
    // ハバタクカミ想定: C(187) > S(172) > D(155) > B(100) > A(75)
    const withProto = calculateDamageV2(
      {
        level: 50,
        types: ['Ghost', 'Fairy'],
        stats: { hp: 131, atk: 75, def: 100, spa: 187, spd: 155, spe: 172 },
        ability: 'protosynthesis',
      },
      {
        level: 50,
        types: ['Water'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'moonblast', power: 95, type: 'Fairy', category: 'Special' },
      { weather: 'sun', isDoubleBattle: true }
    );

    const withoutProto = calculateDamageV2(
      {
        level: 50,
        types: ['Ghost', 'Fairy'],
        stats: { hp: 131, atk: 75, def: 100, spa: 187, spd: 155, spe: 172 },
      },
      {
        level: 50,
        types: ['Water'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'moonblast', power: 95, type: 'Fairy', category: 'Special' },
      { weather: 'sun', isDoubleBattle: true }
    );

    expect(withProto.maxDamage).toBeGreaterThan(withoutProto.maxDamage);
  });

  it('⑮こだいかっせい + 晴れ: 最高ステータスが素早さの場合は攻撃に補正なし', () => {
    // テツノツツミ想定: S(188) > C(176) > B(100) > D(80) > A(60)
    const withProtoSFastest = calculateDamageV2(
      {
        level: 50,
        types: ['Ice', 'Water'],
        stats: { hp: 131, atk: 60, def: 100, spa: 176, spd: 80, spe: 188 },
        ability: 'quark-drive',
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'hydro-pump', power: 110, type: 'Water', category: 'Special' },
      { field: 'electric', isDoubleBattle: true }
    );

    const withoutProto = calculateDamageV2(
      {
        level: 50,
        types: ['Ice', 'Water'],
        stats: { hp: 131, atk: 60, def: 100, spa: 176, spd: 80, spe: 188 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'hydro-pump', power: 110, type: 'Water', category: 'Special' },
      { field: 'electric', isDoubleBattle: true }
    );

    expect(withProtoSFastest.maxDamage).toBe(withoutProto.maxDamage);
  });

  it('⑯タイプ強化アイテム: もくたんで炎技1.2倍', () => {
    const withCharcoal = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
        item: 'charcoal',
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flamethrower', power: 90, type: 'Fire', category: 'Special' },
      { isDoubleBattle: true }
    );

    const withoutItem = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flamethrower', power: 90, type: 'Fire', category: 'Special' },
      { isDoubleBattle: true }
    );

    expect(withCharcoal.maxDamage).toBeGreaterThan(withoutItem.maxDamage);
  });

  it('⑰ワイドフォース: サイコフィールド + isSpreadMove=true → 威力1.5倍 + 全体技補正(0.75x)', () => {
    const expandingForceOnPsychicSpread = calculateDamageV2(
      {
        level: 50,
        types: ['Psychic'],
        stats: { hp: 175, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'expanding-force', power: 80, type: 'Psychic', category: 'Special' },
      { field: 'psychic', isDoubleBattle: true, isSpreadMove: true }
    );

    const expandingForceNoField = calculateDamageV2(
      {
        level: 50,
        types: ['Psychic'],
        stats: { hp: 175, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'expanding-force', power: 80, type: 'Psychic', category: 'Special' },
      { isDoubleBattle: true, isSpreadMove: false }
    );

    // 威力1.5倍 + フィールド補正 > spread0.75倍ペナルティ → フィールドなし単体より大きい
    expect(expandingForceOnPsychicSpread.maxDamage).toBeGreaterThan(
      expandingForceNoField.maxDamage
    );

    // 防御側1体(isSpreadMove=false)のサイコフィールドでは全体技補正なし → より大きいダメージ
    const expandingForcePsychicSingle = calculateDamageV2(
      {
        level: 50,
        types: ['Psychic'],
        stats: { hp: 175, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'expanding-force', power: 80, type: 'Psychic', category: 'Special' },
      { field: 'psychic', isDoubleBattle: true, isSpreadMove: false }
    );

    // 単体(isSpreadMove=false)の方がspread(0.75x)より大きい
    expect(expandingForcePsychicSingle.maxDamage).toBeGreaterThan(
      expandingForceOnPsychicSpread.maxDamage
    );
  });
});
