import { describe, expect, it } from 'vitest';
import {
  ABILITY_MULTISCALE,
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
