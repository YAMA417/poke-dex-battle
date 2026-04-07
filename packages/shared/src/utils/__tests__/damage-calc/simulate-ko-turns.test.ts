import { describe, it, expect } from 'vitest';
import { simulateKoTurns, resolveRecoveryItem } from '../../damage-calc/simulate-ko-turns';
import {
  ITEM_LEFTOVERS,
  ITEM_BLACK_SLUDGE,
  ITEM_SITRUS_BERRY,
  CONFUSION_BERRIES,
} from '../../../constants/damage-calc-names';

describe('resolveRecoveryItem', () => {
  it('Leftovers を leftovers と判定する', () => {
    expect(resolveRecoveryItem(ITEM_LEFTOVERS, ['Normal'])).toBe('leftovers');
  });

  it('Black Sludge + 毒タイプ を black_sludge_poison と判定する', () => {
    expect(resolveRecoveryItem(ITEM_BLACK_SLUDGE, ['Poison', 'Dark'])).toBe('black_sludge_poison');
  });

  it('Black Sludge + 非毒タイプ を black_sludge_non_poison と判定する', () => {
    expect(resolveRecoveryItem(ITEM_BLACK_SLUDGE, ['Normal'])).toBe('black_sludge_non_poison');
  });

  it('Sitrus Berry を sitrus_berry と判定する', () => {
    expect(resolveRecoveryItem(ITEM_SITRUS_BERRY, ['Normal'])).toBe('sitrus_berry');
  });

  it('混乱実を confusion_berry と判定する', () => {
    for (const berry of CONFUSION_BERRIES) {
      expect(resolveRecoveryItem(berry, ['Normal'])).toBe('confusion_berry');
    }
  });

  it('その他のアイテムを none と判定する', () => {
    expect(resolveRecoveryItem('Choice Band', ['Normal'])).toBe('none');
    expect(resolveRecoveryItem(undefined, ['Normal'])).toBe('none');
  });
});

describe('simulateKoTurns', () => {
  it('回復なし: HP=200, damage=60 → 4確', () => {
    // Math.ceil(200 / 60) = 4
    expect(simulateKoTurns(200, 60, 'none')).toBe(4);
  });

  it('回復なし: HP=200, damage=200 → 1確', () => {
    expect(simulateKoTurns(200, 200, 'none')).toBe(1);
  });

  it('たべのこし: HP=200, damage=60 → 回復 Math.floor(200/16)=12/ターン', () => {
    // ターン1: 200 - 60 = 140, +12 = 152
    // ターン2: 152 - 60 = 92, +12 = 104
    // ターン3: 104 - 60 = 44, +12 = 56
    // ターン4: 56 - 60 = -4 → KO
    expect(simulateKoTurns(200, 60, 'leftovers')).toBe(4);
  });

  it('たべのこし: HP=200, damage=13 → 回復12とほぼ同じでInfinity', () => {
    // 実効ダメージ1/ターン → 200ターン以上 → 100ターン上限でInfinity
    expect(simulateKoTurns(200, 13, 'leftovers')).toBe(Infinity);
  });

  it('オボンの実: HP=200, maxDmg=120 → シミュレーション', () => {
    // ターン1: 200 - 120 = 80, 80 <= 100(200/2) → +50 = 130, itemUsed
    // ターン2: 130 - 120 = 10
    // ターン3: 10 - 120 = -110 → KO
    expect(simulateKoTurns(200, 120, 'sitrus_berry')).toBe(3);
  });

  it('オボンの実: HP=200, maxDmg=90 → シミュレーション', () => {
    // ターン1: 200 - 90 = 110, 110 > 100 → 回復なし
    // ターン2: 110 - 90 = 20, 20 <= 100 → +50 = 70, itemUsed
    // ターン3: 70 - 90 = -20 → KO
    expect(simulateKoTurns(200, 90, 'sitrus_berry')).toBe(3);
  });

  it('混乱実: HP=200, maxDmg=160 → シミュレーション（Gen8以降: HP 1/4以下で発動）', () => {
    // 発動条件: currentHp <= Math.floor(200/4) = 50
    // 回復量: Math.floor(200/3) = 66
    // ターン1: 200 - 160 = 40, 40 <= 50 → +66 = 106, itemUsed
    // ターン2: 106 - 160 = -54 → KO
    expect(simulateKoTurns(200, 160, 'confusion_berry')).toBe(2);
  });

  it('damage=0 → Infinity', () => {
    expect(simulateKoTurns(200, 0, 'none')).toBe(Infinity);
  });

  it('くろいヘドロ（毒タイプ）: HP=200, damage=60 → たべのこしと同じ', () => {
    // たべのこしと同じ回復（HP/16=12）
    expect(simulateKoTurns(200, 60, 'black_sludge_poison')).toBe(4);
  });

  it('くろいヘドロ（非毒タイプ）: HP=200, damage=60 → 毎ターンHP/8追加ダメージ', () => {
    // 追加ダメージ: Math.floor(200/8) = 25
    // ターン1: 200 - 60 - 25 = 115
    // ターン2: 115 - 60 - 25 = 30
    // ターン3: 30 - 60 = -30 → KO（ダメージで先にKO判定）
    expect(simulateKoTurns(200, 60, 'black_sludge_non_poison')).toBe(3);
  });
});
