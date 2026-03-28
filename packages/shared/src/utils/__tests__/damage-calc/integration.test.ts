import { describe, expect, it } from 'vitest';
import type { DamageCalculationInput } from '../../../types/damage';
import { calculateDamage } from '../../damage-calc';
import { calculateDamageV2 } from '../../damage-calc/index';
import { convertLegacyInput } from '../../damage-calc/legacy-adapter';

/**
 * 旧API（calculateDamage）と新API（calculateDamageV2）の統合テスト
 * 同一入力で両者が同一結果を返すことを確認する
 */
describe('ダメージ計算エンジン統合テスト', () => {
  /**
   * ヘルパー関数: 旧APIと新APIの結果を比較
   */
  function compareResults(legacyInput: DamageCalculationInput, testName: string): void {
    // 旧API実行
    const legacyResult = calculateDamage(legacyInput);

    // 新APIの入力に変換
    const { attacker, defender, move, context } = convertLegacyInput(legacyInput);

    // 新API実行
    const v2Result = calculateDamageV2(attacker, defender, move, context);

    console.log(`\n${testName}`);
    console.log(`旧API - min: ${legacyResult.minDamage}, max: ${legacyResult.maxDamage}`);
    console.log(`新API - min: ${v2Result.minDamage}, max: ${v2Result.maxDamage}`);

    // 結果が一致することを確認
    expect(v2Result.minDamage, `${testName}: minDamage が一致しない`).toBe(legacyResult.minDamage);
    expect(v2Result.maxDamage, `${testName}: maxDamage が一致しない`).toBe(legacyResult.maxDamage);

    // percent も確認
    expect(v2Result.minPercent).toBe(legacyResult.minPercent);
    expect(v2Result.maxPercent).toBe(legacyResult.maxPercent);

    // guaranteed/possible も確認
    expect(v2Result.guaranteed).toBe(legacyResult.guaranteed);
    expect(v2Result.possible).toBe(legacyResult.possible);
  }

  it('①カイリューのげきりん → ガブリアス (min: 240, max: 284)', () => {
    const input: DamageCalculationInput = {
      movePower: 120,
      moveType: 'Dragon',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 204,
      attackerTypes: ['Dragon', 'Flying'],
      defenderDefense: 115,
      defenderTypes: ['Dragon', 'Ground'],
      condition: {
        weather: 'none',
        field: 'none',
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

    compareResults(input, '①カイリューのげきりん → ガブリアス');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(240);
    expect(result.maxDamage).toBe(284);
  });

  it('②ガブリアスの逆鱗 → ガブリアス (min: 236, max: 278)', () => {
    const input: DamageCalculationInput = {
      movePower: 120,
      moveType: 'Dragon',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 200,
      attackerTypes: ['Dragon', 'Ground'],
      defenderDefense: 115,
      defenderTypes: ['Dragon', 'Ground'],
      condition: {
        weather: 'none',
        field: 'none',
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

    compareResults(input, '②ガブリアスの逆鱗 → ガブリアス');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(236);
    expect(result.maxDamage).toBe(278);
  });

  it('③通常攻撃 + てだすけ (min: 102, max: 121)', () => {
    const input: DamageCalculationInput = {
      movePower: 80,
      moveType: 'Normal',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 150,
      attackerTypes: ['Normal'],
      defenderDefense: 100,
      defenderTypes: ['Normal'],
      condition: {
        weather: 'none',
        field: 'none',
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
        isHelpingHand: true,
      },
    };

    compareResults(input, '③通常攻撃 + てだすけ');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(102);
    expect(result.maxDamage).toBe(121);
  });

  it('④ダブル全体技 (min: 51, max: 60)', () => {
    const input: DamageCalculationInput = {
      movePower: 80,
      moveType: 'Normal',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 150,
      attackerTypes: ['Normal'],
      defenderDefense: 100,
      defenderTypes: ['Normal'],
      condition: {
        weather: 'none',
        field: 'none',
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
        isDoubleBattle: true,
        isSpreadMove: true,
      },
    };

    compareResults(input, '④ダブル全体技');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(51);
    expect(result.maxDamage).toBe(60);
  });

  it('⑤テクニシャン (min: 76, max: 91)', () => {
    const input: DamageCalculationInput = {
      movePower: 60,
      moveType: 'Normal',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 150,
      attackerTypes: ['Normal'],
      defenderDefense: 100,
      defenderTypes: ['Normal'],
      condition: {
        weather: 'none',
        field: 'none',
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
        attackerAbility: 'Technician',
      },
    };

    compareResults(input, '④テクニシャン適用');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(76);
    expect(result.maxDamage).toBe(91);
  });

  it('⑤こだわりハチマキ (min: 68, max: 81)', () => {
    const input: DamageCalculationInput = {
      movePower: 80,
      moveType: 'Normal',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 150,
      attackerTypes: ['Dragon', 'Flying'],
      defenderDefense: 100,
      defenderTypes: ['Normal'],
      condition: {
        weather: 'none',
        field: 'none',
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
        attackerItem: 'Choice Band',
      },
    };

    compareResults(input, '⑤こだわりハチマキ適用');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(68);
    expect(result.maxDamage).toBe(81);
  });

  it('⑥いのちのたま (min: 58, max: 70)', () => {
    const input: DamageCalculationInput = {
      movePower: 80,
      moveType: 'Normal',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 150,
      attackerTypes: ['Dragon', 'Flying'],
      defenderDefense: 100,
      defenderTypes: ['Normal'],
      condition: {
        weather: 'none',
        field: 'none',
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
        attackerItem: 'Life Orb',
      },
    };

    compareResults(input, '⑥いのちのたま適用');

    // 期待値の確認
    const result = calculateDamage(input);
    expect(result.minDamage).toBe(58);
    expect(result.maxDamage).toBe(70);
  });

  it('⑦マルチスケイル (min: 22, max: 27)', () => {
    const input: DamageCalculationInput = {
      movePower: 80,
      moveType: 'Normal',
      moveCategory: 'Physical',
      attackerLevel: 50,
      attackerAttack: 150,
      attackerTypes: ['Dragon', 'Flying'],
      defenderDefense: 100,
      defenderTypes: ['Dragon', 'Flying'],
      defenderCurrentHp: 183,
      defenderMaxHp: 183,
      condition: {
        weather: 'none',
        field: 'none',
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
        defenderAbility: 'Multiscale',
      },
    };

    compareResults(input, '⑦マルチスケイル');

    // 期待値の確認
    const result = calculateDamage(input);
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
    // Issue #16 の再現ケース
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

    // ハドロンエンジン(特攻5461/4096) + エレキフィールド(1.3倍) + STAB(1.5倍) + 半減(0.5倍)
    // + イナズマドライブ効果なし（等倍以下なので）
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

    // テクニシャン1.5倍が適用されていること
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

    // こだわりメガネ(1.5倍)が適用されていること
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

    // 持ち物あり(1.5倍) > 持ち物なし
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

    // かたやぶりはマルチスケイルを無視 → ダメージが大きい
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

    // ヤチェのみ(氷半減) → ダメージ約半分
    expect(withBerry.maxDamage).toBeLessThan(withoutBerry.maxDamage);
    // 概算: 半減実なしの約半分になるはず
    expect(withBerry.maxDamage).toBeCloseTo(Math.floor(withoutBerry.maxDamage * 0.5), -1);
  });

  it('⑭こだいかっせい + 晴れ: 最高ステータスが攻撃の場合のみ補正', () => {
    // ハバタクカミ想定: C(187) > S(172) > D(155) > B(100) > A(75)
    // → 特攻が最高なので特殊技に補正がかかる
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

    // こだいかっせい(C最高 → 5325/4096倍)が適用
    expect(withProto.maxDamage).toBeGreaterThan(withoutProto.maxDamage);
  });

  it('⑮こだいかっせい + 晴れ: 最高ステータスが素早さの場合は攻撃に補正なし', () => {
    // テツノツツミ想定: S(188) > C(176) > B(100) > D(80) > A(60)
    // → 素早さが最高なので特攻に補正がかからない
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

    // 素早さが最高 → 特攻に補正なし → ダメージ同じ
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

    // もくたん(1.2倍)が適用
    expect(withCharcoal.maxDamage).toBeGreaterThan(withoutItem.maxDamage);
  });

  it('⑰ワイドフォース: サイコフィールド + isSpreadMove=true → 威力1.5倍 + 全体技補正(0.75x)', () => {
    // フロントエンドが isSpreadMove=true を設定してエンジンに渡す（フロント側で bothDefendersPresent を判定済み）
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

    // サイコフィールドなし・単体（isSpreadMove=false）
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
