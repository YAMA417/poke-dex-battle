import { ABILITY_SKILL_LINK, ITEM_LOADED_DICE } from '../../constants/damage-calc-names';
import type { MultiHitInfo } from '../../types/damage-effect';

/**
 * 連続技のヒット数範囲
 */
export interface HitCountRange {
  min: number;
  max: number;
  defaultCount: number;
}

/**
 * 連続技のヒット数有効範囲を解決する
 *
 * - fixed型:
 *   - スキルリンク特性: min=max=multiHit.max（強制max）
 *   - いかさまダイス: min=4, max=multiHit.max（ただしmultiHit.max < 4 の場合は制限なし）
 *   - それ以外: min=multiHit.min, max=multiHit.max
 * - escalating型:
 *   - 常に min=1, max=powers.length（いかさまダイスの影響なし）
 * - defaultCount は常に max
 */
export function resolveHitCountRange(
  multiHit: MultiHitInfo,
  ability?: string,
  item?: string
): HitCountRange {
  if (multiHit.type === 'escalating') {
    const max = multiHit.powers.length;
    return { min: 1, max, defaultCount: max };
  }

  // fixed型
  const isSkillLink = ability === ABILITY_SKILL_LINK;
  const isLoadedDice = item === ITEM_LOADED_DICE;

  if (isSkillLink) {
    // スキルリンク: 常にmax回
    return {
      min: multiHit.max,
      max: multiHit.max,
      defaultCount: multiHit.max,
    };
  }

  if (isLoadedDice && multiHit.max >= 4) {
    // いかさまダイス: min=4に制限（max < 4 の場合は影響なし）
    return {
      min: 4,
      max: multiHit.max,
      defaultCount: multiHit.max,
    };
  }

  return {
    min: multiHit.min,
    max: multiHit.max,
    defaultCount: multiHit.max,
  };
}
