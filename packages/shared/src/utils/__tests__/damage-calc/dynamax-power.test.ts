import { describe, expect, it } from 'vitest';
import { getDynamaxMovePower } from '../../damage-calc/dynamax-power';

/**
 * ダイマックス技威力変換テーブルテスト
 */
describe('getDynamaxMovePower', () => {
  it('威力40以下 → 90', () => {
    expect(getDynamaxMovePower(30)).toBe(90);
    expect(getDynamaxMovePower(40)).toBe(90);
  });

  it('威力41-50 → 100', () => {
    expect(getDynamaxMovePower(45)).toBe(100);
    expect(getDynamaxMovePower(50)).toBe(100);
  });

  it('威力51-60 → 110', () => {
    expect(getDynamaxMovePower(55)).toBe(110);
    expect(getDynamaxMovePower(60)).toBe(110);
  });

  it('威力61-70 → 120', () => {
    expect(getDynamaxMovePower(65)).toBe(120);
    expect(getDynamaxMovePower(70)).toBe(120);
  });

  it('威力71-100 → 130', () => {
    expect(getDynamaxMovePower(80)).toBe(130);
    expect(getDynamaxMovePower(100)).toBe(130);
  });

  it('威力101-140 → 140', () => {
    expect(getDynamaxMovePower(120)).toBe(140);
    expect(getDynamaxMovePower(140)).toBe(140);
  });

  it('威力150以上 → 150', () => {
    expect(getDynamaxMovePower(150)).toBe(150);
    expect(getDynamaxMovePower(250)).toBe(150);
  });
});
