import { describe, expect, it } from 'vitest';
import {
  ABILITY_GUTS,
  ABILITY_MULTISCALE,
  ABILITY_PARENTAL_BOND,
  ABILITY_TECHNICIAN,
  ITEM_CHOICE_BAND,
  ITEM_LIFE_ORB,
} from '../../../constants/damage-calc-names';
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
      ability: ABILITY_TECHNICIAN,
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
      item: ITEM_CHOICE_BAND,
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
      item: ITEM_LIFE_ORB,
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
      ability: ABILITY_MULTISCALE,
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

/**
 * 防御側テラスタル対応テスト
 */
describe('防御側テラスタル対応', () => {
  it('防御側テラスタル時、テラタイプで相性判定される', () => {
    // 水テラスのドラゴン → 電気技が等倍から抜群に変わる
    const defenderTerastallized = calculateDamageV2(
      {
        level: 50,
        types: ['Electric'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Dragon', 'Ground'], // 元タイプ: 電気無効
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        teraType: 'Water',
        isTerastallized: true,
        maxHp: 175,
      },
      { name: 'thunderbolt', power: 90, type: 'Electric', category: 'Special' },
      {}
    );

    const defenderNormal = calculateDamageV2(
      {
        level: 50,
        types: ['Electric'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Dragon', 'Ground'], // 元タイプ: 電気無効
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'thunderbolt', power: 90, type: 'Electric', category: 'Special' },
      {}
    );

    // テラスタル（水）で電気抜群 → ダメージ大
    expect(defenderTerastallized.maxDamage).toBeGreaterThan(0);
    // 元タイプ（地面含む）で電気無効 → ダメージ0
    expect(defenderNormal.maxDamage).toBe(0);
  });

  it('防御側テラスタル時、テラタイプ一致技で等倍になる', () => {
    // 鋼テラスの炎/飛行 → 氷技が抜群(2x: 元タイプ) から等倍(1x: 鋼) に変わる
    const defenderTerastallized = calculateDamageV2(
      {
        level: 50,
        types: ['Ice'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Fire', 'Flying'], // 元タイプ: 氷2倍
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        teraType: 'Steel', // 鋼: 氷0.5倍
        isTerastallized: true,
        maxHp: 175,
      },
      { name: 'ice-beam', power: 90, type: 'Ice', category: 'Special' },
      {}
    );

    const defenderNormal = calculateDamageV2(
      {
        level: 50,
        types: ['Ice'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Fire', 'Flying'], // 元タイプ: 氷2倍
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'ice-beam', power: 90, type: 'Ice', category: 'Special' },
      {}
    );

    // テラスタル時のダメージが小さい（半減）
    expect(defenderTerastallized.maxDamage).toBeLessThan(defenderNormal.maxDamage);
  });

  it('防御側ステラテラスタル時、元タイプ維持', () => {
    // ステラテラスのドラゴン/地面 → 電気技は無効のまま
    const defenderStellar = calculateDamageV2(
      {
        level: 50,
        types: ['Electric'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Dragon', 'Ground'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        teraType: 'Stellar',
        isTerastallized: true,
        maxHp: 175,
      },
      { name: 'thunderbolt', power: 90, type: 'Electric', category: 'Special' },
      {}
    );

    expect(defenderStellar.maxDamage).toBe(0);
  });
});

/**
 * テラバースト対応テスト
 */
describe('テラバースト対応', () => {
  it('通常テラスタル時、テラバーストはテラタイプに変更', () => {
    // 炎テラスでテラバースト → 炎技として計算
    const result = calculateDamageV2(
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
        teraType: 'Fire',
        isTerastallized: true,
      },
      {
        level: 50,
        types: ['Grass'], // 炎に弱い
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'Tera Blast', power: 80, type: 'Normal', category: 'Special' },
      {}
    );

    // 炎技としてタイプ相性が抜群 → details.typeEffectiveness が 2.0
    expect(result.details?.typeEffectiveness).toBe(2.0);
  });

  it('テラバースト: A > Cなら物理技として計算', () => {
    const result = calculateDamageV2(
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 200, def: 100, spa: 100, spd: 100, spe: 100 },
        teraType: 'Fire',
        isTerastallized: true,
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'Tera Blast', power: 80, type: 'Normal', category: 'Special' },
      {}
    );

    // A(200)で計算 → C(100)で計算する場合よりダメージが大きい
    const resultWithLowAtk = calculateDamageV2(
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 100, def: 100, spa: 200, spd: 100, spe: 100 },
        teraType: 'Fire',
        isTerastallized: true,
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'Tera Blast', power: 80, type: 'Normal', category: 'Special' },
      {}
    );

    // 両方とも最高攻撃力200で物理 or 特殊、防御同じなので同ダメージ
    expect(result.maxDamage).toBe(resultWithLowAtk.maxDamage);
  });

  it('ステラテラバースト: 威力100、全タイプに等倍', () => {
    // ステラテラバースト → 威力100、相性等倍
    const result = calculateDamageV2(
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
        teraType: 'Stellar',
        isTerastallized: true,
      },
      {
        level: 50,
        types: ['Ghost'], // ノーマル無効だが、ステラテラバーストは等倍
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'Tera Blast', power: 80, type: 'Normal', category: 'Special' },
      {}
    );

    // ゴーストにノーマルは無効だが、ステラテラバーストは等倍で通る
    expect(result.maxDamage).toBeGreaterThan(0);
    expect(result.details?.typeEffectiveness).toBe(1.0);
  });
});

/**
 * テラスタル威力底上げテスト
 */
describe('テラスタル威力底上げ', () => {
  it('テラタイプ一致技で威力60未満 → 60に底上げ', () => {
    // 威力40の炎テラスタイプ一致技 → 60に底上げ
    const withTera = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
        teraType: 'Fire',
        isTerastallized: true,
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'ember', power: 40, type: 'Fire', category: 'Physical' },
      {}
    );

    // 威力60の非テラスタル時と比較
    const withoutTera60 = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'ember', power: 60, type: 'Fire', category: 'Physical' },
      {}
    );

    // テラスタルSTABは2.0倍、非テラスタルSTABは1.5倍
    // 威力60*STAB2.0 > 威力60*STAB1.5 → テラスタル時の方が大きいはず
    expect(withTera.maxDamage).toBeGreaterThan(withoutTera60.maxDamage);
  });

  it('先制技はテラスタル威力底上げ対象外', () => {
    const withTeraPriority = calculateDamageV2(
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
        teraType: 'Normal',
        isTerastallized: true,
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      {
        name: 'quick-attack',
        power: 40,
        type: 'Normal',
        category: 'Physical',
        flags: { isPriorityMove: true },
      },
      {}
    );

    const withoutTeraPriority = calculateDamageV2(
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      {
        name: 'quick-attack',
        power: 40,
        type: 'Normal',
        category: 'Physical',
        flags: { isPriorityMove: true },
      },
      {}
    );

    // 先制技は底上げされないので威力40のまま
    // テラスタルSTABの差のみ (2.0 vs 1.5)
    // 底上げなし: withTera.maxDamage / withoutTera.maxDamage ≒ 2.0/1.5 = 1.33
    const ratio = withTeraPriority.maxDamage / withoutTeraPriority.maxDamage;
    // 底上げがあれば 60/40 * 2.0/1.5 = 2.0 の差、底上げなしなら 2.0/1.5 = 1.33 の差
    expect(ratio).toBeLessThan(1.5);
  });

  it('威力60以上はテラスタル威力底上げ対象外', () => {
    const withTera = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
        teraType: 'Fire',
        isTerastallized: true,
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flamethrower', power: 90, type: 'Fire', category: 'Physical' },
      {}
    );

    const withoutTera = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flamethrower', power: 90, type: 'Fire', category: 'Physical' },
      {}
    );

    // 威力は変わらないのでSTABの差のみ: 2.0/1.5 ≒ 1.33
    const ratio = withTera.maxDamage / withoutTera.maxDamage;
    expect(ratio).toBeLessThan(1.5);
  });
});

/**
 * Z技統合テスト
 */
describe('Z技統合', () => {
  it('Z技: 威力80の技 → Z技威力140に変換される', () => {
    const zMove = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flare-blitz', power: 80, type: 'Fire', category: 'Physical', isZMove: true },
      {}
    );

    const normalMove = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flare-blitz', power: 80, type: 'Fire', category: 'Physical' },
      {}
    );

    // Z技(威力140)は通常技(威力80)より強い
    expect(zMove.maxDamage).toBeGreaterThan(normalMove.maxDamage);
  });
});

/**
 * ダイマックス統合テスト
 */
describe('ダイマックス統合', () => {
  it('ダイマックス技: 威力80の技 → ダイマックス威力130に変換', () => {
    const dynamaxMove = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      {
        name: 'flare-blitz',
        power: 80,
        type: 'Fire',
        category: 'Physical',
        isDynamaxMove: true,
      },
      {}
    );

    const normalMove = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flare-blitz', power: 80, type: 'Fire', category: 'Physical' },
      {}
    );

    // ダイマックス技(威力130)は通常技(威力80)より強い
    expect(dynamaxMove.maxDamage).toBeGreaterThan(normalMove.maxDamage);
  });

  it('防御側ダイマックス: HP2倍', () => {
    const vsDynamaxed = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
        isDynamaxed: true,
      },
      { name: 'flare-blitz', power: 80, type: 'Fire', category: 'Physical' },
      {}
    );

    const vsNormal = calculateDamageV2(
      {
        level: 50,
        types: ['Fire'],
        stats: { hp: 100, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      },
      {
        level: 50,
        types: ['Normal'],
        stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
        maxHp: 175,
      },
      { name: 'flare-blitz', power: 80, type: 'Fire', category: 'Physical' },
      {}
    );

    // ダメージ自体は同じだがHP割合が半分
    expect(vsDynamaxed.minDamage).toBe(vsNormal.minDamage);
    expect(vsDynamaxed.maxDamage).toBe(vsNormal.maxDamage);
    expect(vsDynamaxed.maxPercent).toBeCloseTo(vsNormal.maxPercent / 2, 0);
  });
});

/**
 * damageEffect経由のテスト（UI実動作と同等）
 * テストでitemDamageEffectを設定し、フォールバックと同じ結果になることを検証
 */
describe('damageEffect経由の動作検証', () => {
  it('いのちのたま: damageEffect経由でもフォールバックと同じ結果', () => {
    const base: CalcPokemon = {
      level: 50,
      types: ['Dragon', 'Flying'],
      stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
      item: ITEM_LIFE_ORB,
    };
    const withDamageEffect: CalcPokemon = {
      ...base,
      itemDamageEffect: {
        attackerModifier: { condition: 'unconditional', multiplier: 1.3 },
      },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 100, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
      maxHp: 100,
    };
    const move: CalcMove = { name: '', power: 80, type: 'Normal', category: 'Physical' };

    const fallback = calculateDamageV2(base, defender, move, {});
    const damageEffect = calculateDamageV2(withDamageEffect, defender, move, {});

    // フォールバックとdamageEffect経由で同じ結果になること
    expect(damageEffect.minDamage).toBe(fallback.minDamage);
    expect(damageEffect.maxDamage).toBe(fallback.maxDamage);
    // 既知の期待値
    expect(damageEffect.minDamage).toBe(58);
    expect(damageEffect.maxDamage).toBe(70);
  });

  it('とつげきチョッキ: damageEffect経由で特殊ダメージ減少', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 0, atk: 0, def: 0, spa: 150, spd: 0, spe: 0 },
    };
    const defenderBase: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 200, atk: 0, def: 100, spa: 0, spd: 100, spe: 0 },
      maxHp: 200,
      item: 'Assault Vest',
    };
    const move: CalcMove = { name: '', power: 80, type: 'Normal', category: 'Special' };

    const noItem = calculateDamageV2(attacker, { ...defenderBase, item: undefined }, move, {});
    const withItem = calculateDamageV2(attacker, defenderBase, move, {});

    // とつげきチョッキありで特殊ダメージが減少すること
    expect(withItem.maxDamage).toBeLessThan(noItem.maxDamage);
  });

  it('オーガポンのお面: damageEffect(unconditional 1.2倍)がダメージ補正で適用', () => {
    const base: CalcPokemon = {
      level: 50,
      types: ['Grass', 'Fire'],
      stats: { hp: 0, atk: 150, def: 0, spa: 0, spd: 0, spe: 0 },
    };
    const withMask: CalcPokemon = {
      ...base,
      item: 'Hearthflame Mask',
      itemDamageEffect: {
        attackerModifier: { condition: 'unconditional', multiplier: 1.2 },
      },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 200, atk: 0, def: 100, spa: 0, spd: 0, spe: 0 },
      maxHp: 200,
    };
    const move: CalcMove = { name: '', power: 80, type: 'Normal', category: 'Physical' };

    const noItem = calculateDamageV2(base, defender, move, {});
    const withItem = calculateDamageV2(withMask, defender, move, {});

    // お面ありでダメージが増加すること
    expect(withItem.maxDamage).toBeGreaterThan(noItem.maxDamage);
    // 1.2倍付近であること
    expect(withItem.maxDamage / noItem.maxDamage).toBeCloseTo(1.2, 1);
  });
});

/**
 * Phase 3: エンジン改修特性の統合テスト
 */
describe('Phase 3: エンジン改修特性', () => {
  // 共通ベースケース
  const baseAttacker: CalcPokemon = {
    level: 50,
    types: ['Normal'],
    stats: { hp: 200, atk: 150, def: 100, spa: 150, spd: 100, spe: 100 },
  };
  const baseDefender: CalcPokemon = {
    level: 50,
    types: ['Normal'],
    stats: { hp: 200, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
    maxHp: 200,
  };
  const basePhysicalMove: CalcMove = {
    name: 'tackle',
    power: 80,
    type: 'Normal',
    category: 'Physical',
  };
  const baseSpecialMove: CalcMove = {
    name: 'hyper-voice',
    power: 80,
    type: 'Normal',
    category: 'Special',
  };
  const baseContext: BattleContext = { isDoubleBattle: true };

  // ベースダメージ（特性・コンテキスト補正なし）
  const basePhysical = calculateDamageV2(baseAttacker, baseDefender, basePhysicalMove, baseContext);
  const baseSpecial = calculateDamageV2(baseAttacker, baseDefender, baseSpecialMove, baseContext);

  // --- ごりむちゅう (Gorilla Tactics) ---
  describe('ごりむちゅう (Gorilla Tactics)', () => {
    it('物理技でダメージが1.5倍になる', () => {
      const result = calculateDamageV2(
        { ...baseAttacker, ability: 'Gorilla Tactics' },
        baseDefender,
        basePhysicalMove,
        baseContext
      );
      expect(result.minDamage).toBeGreaterThan(basePhysical.minDamage);
      expect(result.maxDamage).toBeGreaterThan(basePhysical.maxDamage);
      // 攻撃力1.5倍によるダメージ増加を確認
      // floor(150 * 1.5) = 225 → 225/150 = 1.5倍
      expect(result.maxDamage / basePhysical.maxDamage).toBeCloseTo(1.5, 1);
    });

    it('特殊技では補正なし', () => {
      const result = calculateDamageV2(
        { ...baseAttacker, ability: 'Gorilla Tactics' },
        baseDefender,
        baseSpecialMove,
        baseContext
      );
      expect(result.maxDamage).toBe(baseSpecial.maxDamage);
    });
  });

  // --- はりきり (Hustle) ---
  describe('はりきり (Hustle)', () => {
    it('物理技でダメージが1.5倍になる', () => {
      const result = calculateDamageV2(
        { ...baseAttacker, ability: 'Hustle' },
        baseDefender,
        basePhysicalMove,
        baseContext
      );
      expect(result.minDamage).toBeGreaterThan(basePhysical.minDamage);
      expect(result.maxDamage / basePhysical.maxDamage).toBeCloseTo(1.5, 1);
    });

    it('特殊技では補正なし', () => {
      const result = calculateDamageV2(
        { ...baseAttacker, ability: 'Hustle' },
        baseDefender,
        baseSpecialMove,
        baseContext
      );
      expect(result.maxDamage).toBe(baseSpecial.maxDamage);
    });
  });

  // --- くさのけがわ (Grass Pelt) ---
  describe('くさのけがわ (Grass Pelt)', () => {
    it('グラスフィールド時に物理ダメージが減少する', () => {
      const result = calculateDamageV2(
        baseAttacker,
        { ...baseDefender, ability: 'Grass Pelt' },
        basePhysicalMove,
        { ...baseContext, field: 'grassy' }
      );
      expect(result.maxDamage).toBeLessThan(basePhysical.maxDamage);
    });

    it('グラスフィールドなしでは補正なし', () => {
      const result = calculateDamageV2(
        baseAttacker,
        { ...baseDefender, ability: 'Grass Pelt' },
        basePhysicalMove,
        baseContext
      );
      expect(result.maxDamage).toBe(basePhysical.maxDamage);
    });
  });

  // --- フラワーギフト (Flower Gift) ---
  describe('フラワーギフト (Flower Gift)', () => {
    it('flowerGiftActive時に物理攻撃ダメージが増加する', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, basePhysicalMove, {
        ...baseContext,
        flowerGiftActive: true,
      });
      expect(result.minDamage).toBeGreaterThan(basePhysical.minDamage);
      expect(result.maxDamage / basePhysical.maxDamage).toBeCloseTo(1.5, 1);
    });

    it('特殊技では攻撃側補正なし（防御側は特防1.5倍でダメージ減少）', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, baseSpecialMove, {
        ...baseContext,
        flowerGiftActive: true,
      });
      // 特殊技では攻撃補正なし + 特防1.5倍でダメージ減少
      expect(result.maxDamage).toBeLessThan(baseSpecial.maxDamage);
    });
  });

  // --- オーロラベール (Aurora Veil) ---
  describe('オーロラベール (Aurora Veil)', () => {
    it('物理技でダメージが減少する', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, basePhysicalMove, {
        ...baseContext,
        auroraVeil: true,
      });
      expect(result.maxDamage).toBeLessThan(basePhysical.maxDamage);
    });

    it('特殊技でダメージが減少する', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, baseSpecialMove, {
        ...baseContext,
        auroraVeil: true,
      });
      expect(result.maxDamage).toBeLessThan(baseSpecial.maxDamage);
    });

    it('急所時はオーロラベール無効', () => {
      const critMove: CalcMove = { ...basePhysicalMove, isCritical: true };
      const withVeil = calculateDamageV2(baseAttacker, baseDefender, critMove, {
        ...baseContext,
        auroraVeil: true,
      });
      const withoutVeil = calculateDamageV2(baseAttacker, baseDefender, critMove, baseContext);
      expect(withVeil.maxDamage).toBe(withoutVeil.maxDamage);
    });
  });

  // --- フレンドガード (Friend Guard) ---
  describe('フレンドガード (Friend Guard)', () => {
    it('ダメージが0.75倍になる', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, basePhysicalMove, {
        ...baseContext,
        friendGuardActive: true,
      });
      expect(result.maxDamage).toBeLessThan(basePhysical.maxDamage);
    });
  });

  // --- ダークオーラ (Dark Aura) ---
  describe('ダークオーラ (Dark Aura)', () => {
    const darkMove: CalcMove = {
      name: 'knock-off',
      power: 80,
      type: 'Dark',
      category: 'Physical',
    };
    const baseDark = calculateDamageV2(baseAttacker, baseDefender, darkMove, baseContext);

    it('悪技ダメージが増加する', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, darkMove, {
        ...baseContext,
        auraAbilities: ['Dark Aura'],
      });
      expect(result.maxDamage).toBeGreaterThan(baseDark.maxDamage);
    });

    it('非悪技では補正なし', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, basePhysicalMove, {
        ...baseContext,
        auraAbilities: ['Dark Aura'],
      });
      expect(result.maxDamage).toBe(basePhysical.maxDamage);
    });
  });

  // --- フェアリーオーラ (Fairy Aura) ---
  describe('フェアリーオーラ (Fairy Aura)', () => {
    const fairyMove: CalcMove = {
      name: 'moonblast',
      power: 80,
      type: 'Fairy',
      category: 'Special',
    };
    const baseFairy = calculateDamageV2(baseAttacker, baseDefender, fairyMove, baseContext);

    it('フェアリー技ダメージが増加する', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, fairyMove, {
        ...baseContext,
        auraAbilities: ['Fairy Aura'],
      });
      expect(result.maxDamage).toBeGreaterThan(baseFairy.maxDamage);
    });

    it('非フェアリー技では補正なし', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, basePhysicalMove, {
        ...baseContext,
        auraAbilities: ['Fairy Aura'],
      });
      expect(result.maxDamage).toBe(basePhysical.maxDamage);
    });
  });

  // --- オーラブレイク (Aura Break) ---
  describe('オーラブレイク (Aura Break)', () => {
    const darkMove: CalcMove = {
      name: 'knock-off',
      power: 80,
      type: 'Dark',
      category: 'Physical',
    };
    const baseDark = calculateDamageV2(baseAttacker, baseDefender, darkMove, baseContext);

    it('ダークオーラ + オーラブレイク時に悪技ダメージが減少する', () => {
      const result = calculateDamageV2(baseAttacker, baseDefender, darkMove, {
        ...baseContext,
        auraAbilities: ['Dark Aura', 'Aura Break'],
      });
      // 3072/4096 ≒ 0.75 なのでダメージ減少
      expect(result.maxDamage).toBeLessThan(baseDark.maxDamage);
    });
  });
});

/**
 * Phase 4-5: 技固有効果 + メカニクス
 */
describe('Phase 4-5: 技固有効果 + メカニクス', () => {
  // --- Body Press (ボディプレス) ---
  it('Body Press: 攻撃側のdef値でダメージ計算される', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Fighting'],
      stats: { hp: 175, atk: 100, def: 200, spa: 80, spd: 100, spe: 80 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 100, def: 120, spa: 100, spd: 100, spe: 100 },
      maxHp: 175,
    };
    const move: CalcMove = {
      name: 'Body Press',
      power: 80,
      type: 'Fighting',
      category: 'Physical',
      flags: { usesDefenseAsAttack: true },
    };

    const result = calculateDamageV2(attacker, defender, move, {});
    // def=200 を使うため高ダメージ
    expect(result.minDamage).toBe(152);
    expect(result.maxDamage).toBe(180);

    // フラグなしではatk=100を使うため低ダメージ
    const noFlag = calculateDamageV2(attacker, defender, { ...move, flags: undefined }, {});
    expect(noFlag.maxDamage).toBe(92);
  });

  // --- Foul Play (イカサマ) ---
  it('Foul Play: 防御側のatk値でダメージ計算される', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Dark'],
      stats: { hp: 175, atk: 80, def: 100, spa: 100, spd: 100, spe: 100 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 200, def: 120, spa: 100, spd: 100, spe: 100 },
      maxHp: 175,
    };
    const move: CalcMove = {
      name: 'Foul Play',
      power: 95,
      type: 'Dark',
      category: 'Physical',
      flags: { usesTargetAttack: true },
    };

    const result = calculateDamageV2(attacker, defender, move, {});
    // 防御側のatk=200を使うため高ダメージ
    expect(result.minDamage).toBe(90);
    expect(result.maxDamage).toBe(106);

    // フラグなしでは攻撃側のatk=80を使うため低ダメージ
    const noFlag = calculateDamageV2(attacker, defender, { ...move, flags: undefined }, {});
    expect(noFlag.maxDamage).toBe(43);
  });

  // --- Photon Geyser (フォトンゲイザー) ---
  it('Photon Geyser: atk > spa 時に物理技になる', () => {
    const atkHigher: CalcPokemon = {
      level: 50,
      types: ['Psychic'],
      stats: { hp: 175, atk: 180, def: 100, spa: 120, spd: 100, spe: 100 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 120, spe: 100 },
      maxHp: 175,
    };
    const move: CalcMove = {
      name: 'Photon Geyser',
      power: 100,
      type: 'Psychic',
      category: 'Special',
    };

    // atk(180) > spa(120) → 物理技として計算（def=100 を参照）
    const result = calculateDamageV2(atkHigher, defender, move, {});
    expect(result.minDamage).toBe(102);
    expect(result.maxDamage).toBe(121);

    // atk < spa のときは特殊技のまま（spd=120 を参照）
    const spaHigher: CalcPokemon = {
      ...atkHigher,
      stats: { hp: 175, atk: 120, def: 100, spa: 180, spd: 100, spe: 100 },
    };
    const resultSpecial = calculateDamageV2(spaHigher, defender, move, {});
    expect(resultSpecial.minDamage).toBe(85);
    expect(resultSpecial.maxDamage).toBe(102);
  });

  // --- Facade (からげんき) ---
  it('Facade: 状態異常時に威力2倍', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      status: 'burn',
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 100, def: 120, spa: 100, spd: 100, spe: 100 },
      maxHp: 175,
    };
    const move: CalcMove = {
      name: 'Facade',
      power: 70,
      type: 'Normal',
      category: 'Physical',
      damageEffect: {
        powerModifier: { condition: 'attacker_status_abnormal', multiplier: 2.0 },
      },
    };

    const withBurn = calculateDamageV2(attacker, defender, move, {});
    const noBurn = calculateDamageV2({ ...attacker, status: undefined }, defender, move, {});
    // やけど時: 威力2倍だがやけど0.5倍補正もある → 結果はほぼ同等
    expect(withBurn.minDamage).toBe(50);
    expect(noBurn.minDamage).toBe(51);
  });

  // --- Brine (しおみず) ---
  it('Brine: 防御側HP50%以下で威力2倍', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Water'],
      stats: { hp: 175, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 120, spe: 100 },
      maxHp: 175,
      currentHp: 80,
    };
    const move: CalcMove = {
      name: 'Brine',
      power: 65,
      type: 'Water',
      category: 'Special',
      damageEffect: {
        powerModifier: { condition: 'defender_hp_half_or_less', multiplier: 2.0 },
      },
    };

    const halfHp = calculateDamageV2(attacker, defender, move, {});
    const fullHp = calculateDamageV2(attacker, { ...defender, currentHp: 175 }, move, {});
    expect(halfHp.minDamage).toBe(93);
    expect(halfHp.maxDamage).toBe(109);
    expect(fullHp.maxDamage).toBe(55);
  });

  // --- Venoshock (ベノムショック) ---
  it('Venoshock: 防御側毒状態で威力2倍', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Poison'],
      stats: { hp: 175, atk: 100, def: 100, spa: 150, spd: 100, spe: 100 },
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 100, def: 100, spa: 100, spd: 120, spe: 100 },
      maxHp: 175,
      status: 'poison',
    };
    const move: CalcMove = {
      name: 'Venoshock',
      power: 65,
      type: 'Poison',
      category: 'Special',
      damageEffect: {
        powerModifier: { condition: 'defender_status_poison', multiplier: 2.0 },
      },
    };

    const poisoned = calculateDamageV2(attacker, defender, move, {});
    const notPoisoned = calculateDamageV2(attacker, { ...defender, status: undefined }, move, {});
    expect(poisoned.minDamage).toBe(93);
    expect(poisoned.maxDamage).toBe(109);
    expect(notPoisoned.maxDamage).toBe(55);
  });

  // --- Parental Bond (おやこあい) ---
  it('Parental Bond: 合計ダメージが1.25倍になる', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      ability: ABILITY_PARENTAL_BOND,
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 100, def: 120, spa: 100, spd: 100, spe: 100 },
      maxHp: 175,
    };
    const move: CalcMove = {
      name: 'Return',
      power: 102,
      type: 'Normal',
      category: 'Physical',
    };

    const pb = calculateDamageV2(attacker, defender, move, {});
    const normal = calculateDamageV2({ ...attacker, ability: undefined }, defender, move, {});
    // おやこあい: 1発目 + 2発目(0.25倍)
    expect(pb.minDamage).toBe(91);
    expect(pb.maxDamage).toBe(108);
    expect(normal.minDamage).toBe(73);
    expect(normal.maxDamage).toBe(87);
    // 合計 ≒ 通常の1.25倍
    expect(pb.maxDamage).toBeGreaterThan(normal.maxDamage);
  });

  // --- やけど補正 ---
  it('やけど補正: 物理技で0.5倍、こんじょうで無効化', () => {
    const attacker: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 150, def: 100, spa: 100, spd: 100, spe: 100 },
      status: 'burn',
    };
    const defender: CalcPokemon = {
      level: 50,
      types: ['Normal'],
      stats: { hp: 175, atk: 100, def: 120, spa: 100, spd: 100, spe: 100 },
      maxHp: 175,
    };
    const move: CalcMove = {
      name: 'Return',
      power: 102,
      type: 'Normal',
      category: 'Physical',
    };

    const burned = calculateDamageV2(attacker, defender, move, {});
    const noBurn = calculateDamageV2({ ...attacker, status: undefined }, defender, move, {});
    // やけどで物理ダメージが約半減
    expect(burned.minDamage).toBe(36);
    expect(burned.maxDamage).toBe(43);
    expect(noBurn.maxDamage).toBe(87);

    // こんじょう持ちはやけど補正なし + こんじょう1.5倍
    const gutsAttacker: CalcPokemon = {
      ...attacker,
      ability: ABILITY_GUTS,
    };
    const gutsBurned = calculateDamageV2(gutsAttacker, defender, move, {});
    expect(gutsBurned.minDamage).toBe(109);
    expect(gutsBurned.maxDamage).toBe(129);
    expect(gutsBurned.maxDamage).toBeGreaterThan(noBurn.maxDamage);
  });
});
