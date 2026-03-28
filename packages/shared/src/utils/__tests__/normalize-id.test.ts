import { describe, it, expect } from 'vitest';
import { normalizeId, abilityIs, itemIs, moveIs, normalizedSetHas } from '../normalize-id';

describe('normalizeId', () => {
  it('PokeAPIスラッグを正規化する', () => {
    expect(normalizeId('hadron-engine')).toBe('hadronengine');
    expect(normalizeId('choice-band')).toBe('choiceband');
    expect(normalizeId('power-up-punch')).toBe('poweruppunch');
  });

  it('Title Caseを正規化する', () => {
    expect(normalizeId('Hadron Engine')).toBe('hadronengine');
    expect(normalizeId('Choice Band')).toBe('choiceband');
    expect(normalizeId('Power-Up Punch')).toBe('poweruppunch');
  });

  it('Showdown ID（既に正規化済み）はそのまま返す', () => {
    expect(normalizeId('hadronengine')).toBe('hadronengine');
    expect(normalizeId('choiceband')).toBe('choiceband');
  });

  it('空文字・null・undefinedを処理する', () => {
    expect(normalizeId('')).toBe('');
    expect(normalizeId(null)).toBe('');
    expect(normalizeId(undefined)).toBe('');
  });

  it('前置詞を含む名前も正しく処理する', () => {
    expect(normalizeId('Tablets of Ruin')).toBe('tabletsofruin');
    expect(normalizeId('tablets-of-ruin')).toBe('tabletsofruin');
  });
});

describe('abilityIs', () => {
  it('スラッグとTitle Caseを一致させる', () => {
    expect(abilityIs('hadron-engine', 'Hadron Engine')).toBe(true);
    expect(abilityIs('orichalcum-pulse', 'Orichalcum Pulse')).toBe(true);
    expect(abilityIs('tablets-of-ruin', 'Tablets of Ruin')).toBe(true);
  });

  it('不一致の場合はfalseを返す', () => {
    expect(abilityIs('hadron-engine', 'Solar Power')).toBe(false);
  });

  it('undefinedに対応する', () => {
    expect(abilityIs(undefined, 'Hadron Engine')).toBe(false);
  });
});

describe('itemIs', () => {
  it('スラッグとTitle Caseを一致させる', () => {
    expect(itemIs('choice-band', 'Choice Band')).toBe(true);
    expect(itemIs('life-orb', 'Life Orb')).toBe(true);
    expect(itemIs('assault-vest', 'Assault Vest')).toBe(true);
  });

  it('undefinedに対応する', () => {
    expect(itemIs(undefined, 'Choice Band')).toBe(false);
  });
});

describe('moveIs', () => {
  it('スラッグとTitle Caseを一致させる', () => {
    expect(moveIs('weather-ball', 'Weather Ball')).toBe(true);
    expect(moveIs('solar-beam', 'Solar Beam')).toBe(true);
    expect(moveIs('power-up-punch', 'Power-Up Punch')).toBe(true);
  });

  it('undefinedに対応する', () => {
    expect(moveIs(undefined, 'Weather Ball')).toBe(false);
  });
});

describe('normalizedSetHas', () => {
  const testSet = new Set(['poweruppunch', 'thunderpunch', 'firepunch']);

  it('正規化済みSetに対してスラッグ形式で検索できる', () => {
    expect(normalizedSetHas(testSet, 'power-up-punch')).toBe(true);
    expect(normalizedSetHas(testSet, 'thunder-punch')).toBe(true);
  });

  it('Title Case形式で検索できる', () => {
    expect(normalizedSetHas(testSet, 'Power-Up Punch')).toBe(true);
    expect(normalizedSetHas(testSet, 'Fire Punch')).toBe(true);
  });

  it('存在しない値はfalseを返す', () => {
    expect(normalizedSetHas(testSet, 'ice-punch')).toBe(false);
  });

  it('undefinedに対応する', () => {
    expect(normalizedSetHas(testSet, undefined)).toBe(false);
  });
});
