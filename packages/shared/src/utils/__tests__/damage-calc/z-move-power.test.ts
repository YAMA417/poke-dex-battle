import { describe, expect, it } from 'vitest';
import { getZMovePower } from '../../damage-calc/z-move-power';

/**
 * Z技威力変換テーブルテスト
 */
describe('getZMovePower', () => {
  it('威力55以下 → 100', () => {
    expect(getZMovePower(40)).toBe(100);
    expect(getZMovePower(55)).toBe(100);
  });

  it('威力56-60 → 120', () => {
    expect(getZMovePower(56)).toBe(120);
    expect(getZMovePower(60)).toBe(120);
  });

  it('威力61-70 → 130', () => {
    expect(getZMovePower(65)).toBe(130);
    expect(getZMovePower(70)).toBe(130);
  });

  it('威力71-80 → 140', () => {
    expect(getZMovePower(75)).toBe(140);
    expect(getZMovePower(80)).toBe(140);
  });

  it('威力81-90 → 175', () => {
    expect(getZMovePower(85)).toBe(175);
    expect(getZMovePower(90)).toBe(175);
  });

  it('威力91-100 → 180', () => {
    expect(getZMovePower(95)).toBe(180);
    expect(getZMovePower(100)).toBe(180);
  });

  it('威力101-110 → 185', () => {
    expect(getZMovePower(105)).toBe(185);
    expect(getZMovePower(110)).toBe(185);
  });

  it('威力111-125 → 190', () => {
    expect(getZMovePower(120)).toBe(190);
    expect(getZMovePower(125)).toBe(190);
  });

  it('威力126-130 → 195', () => {
    expect(getZMovePower(126)).toBe(195);
    expect(getZMovePower(130)).toBe(195);
  });

  it('威力140以上 → 200', () => {
    expect(getZMovePower(140)).toBe(200);
    expect(getZMovePower(250)).toBe(200);
  });
});
