import {
  ITEM_LEFTOVERS,
  ITEM_BLACK_SLUDGE,
  ITEM_SITRUS_BERRY,
  CONFUSION_BERRIES,
} from '../../constants/damage-calc-names';
import { itemIs } from '../normalize-id';

/** 回復アイテムの種類 */
export type RecoveryType =
  | 'leftovers'
  | 'black_sludge_poison'
  | 'black_sludge_non_poison'
  | 'sitrus_berry'
  | 'confusion_berry'
  | 'none';

/** 無限ループ防止の上限ターン数 */
const MAX_TURNS = 100;

/**
 * 防御側のアイテム名とタイプから回復種別を判定する
 */
export function resolveRecoveryItem(
  itemName: string | undefined,
  defenderTypes: string[]
): RecoveryType {
  if (!itemName) return 'none';

  if (itemIs(itemName, ITEM_LEFTOVERS)) return 'leftovers';

  if (itemIs(itemName, ITEM_BLACK_SLUDGE)) {
    return defenderTypes.includes('Poison') ? 'black_sludge_poison' : 'black_sludge_non_poison';
  }

  if (itemIs(itemName, ITEM_SITRUS_BERRY)) return 'sitrus_berry';

  for (const berry of CONFUSION_BERRIES) {
    if (itemIs(itemName, berry)) return 'confusion_berry';
  }

  return 'none';
}

/**
 * 確定数をシミュレーションで算出する
 *
 * 毎ターンのダメージと回復アイテムの効果を考慮し、
 * KOまでに必要なターン数を返す。
 *
 * @param maxHp - 防御側の最大HP
 * @param damagePerTurn - 1ターンあたりのダメージ
 * @param recovery - 回復アイテムの種別
 * @returns KOまでのターン数（倒せない場合はInfinity）
 */
export function simulateKoTurns(
  maxHp: number,
  damagePerTurn: number,
  recovery: RecoveryType
): number {
  // ダメージ0以下は倒せない
  if (damagePerTurn <= 0) return Infinity;

  // 回復なしの高速パス
  if (recovery === 'none') {
    return Math.ceil(maxHp / damagePerTurn);
  }

  let currentHp = maxHp;
  let turn = 0;
  let itemUsed = false;

  while (turn < MAX_TURNS) {
    turn++;

    // ダメージ適用
    currentHp -= damagePerTurn;

    // くろいヘドロ（非毒）: 追加ダメージ
    if (recovery === 'black_sludge_non_poison') {
      currentHp -= Math.floor(maxHp / 8);
    }

    // KO判定
    if (currentHp <= 0) return turn;

    // 回復判定
    switch (recovery) {
      case 'leftovers':
      case 'black_sludge_poison':
        currentHp = Math.min(maxHp, currentHp + Math.floor(maxHp / 16));
        break;

      case 'sitrus_berry':
        if (!itemUsed && currentHp <= Math.floor(maxHp / 2)) {
          currentHp += Math.floor(maxHp / 4);
          itemUsed = true;
        }
        break;

      case 'confusion_berry':
        if (!itemUsed && currentHp <= Math.floor(maxHp / 4)) {
          currentHp += Math.floor(maxHp / 3);
          itemUsed = true;
        }
        break;

      case 'black_sludge_non_poison':
        // ダメージは上で処理済み、回復なし
        break;
    }
  }

  // 上限到達: 倒せない
  return Infinity;
}
