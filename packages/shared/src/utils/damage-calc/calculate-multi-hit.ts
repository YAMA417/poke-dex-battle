import type { CalcMove, DamageResult, MultiHitPerHit } from '../../types/damage';
import type { MultiHitInfo } from '../../types/damage-effect';
import { simulateKoTurns, resolveRecoveryItem } from './simulate-ko-turns';

/**
 * 連続技のダメージを計算する
 *
 * - fixed型: singleHitCalc を1回呼び、min/max を hitCount 倍して合算
 * - escalating型: 各回で power を差し替えて singleHitCalc を呼び、合算
 */
export function calculateMultiHitDamage(
  singleHitCalc: (move: CalcMove) => DamageResult,
  move: CalcMove,
  multiHit: MultiHitInfo,
  hitCount: number,
  defenderMaxHp: number,
  defenderItem?: string,
  defenderTypes?: string[]
): DamageResult {
  if (multiHit.type === 'fixed') {
    return calculateFixedMultiHit(
      singleHitCalc,
      move,
      hitCount,
      defenderMaxHp,
      defenderItem,
      defenderTypes
    );
  }

  return calculateEscalatingMultiHit(
    singleHitCalc,
    move,
    multiHit.powers,
    hitCount,
    defenderMaxHp,
    defenderItem,
    defenderTypes
  );
}

/** fixed型: 同じ威力を hitCount 回繰り返す */
function calculateFixedMultiHit(
  singleHitCalc: (move: CalcMove) => DamageResult,
  move: CalcMove,
  hitCount: number,
  defenderMaxHp: number,
  defenderItem?: string,
  defenderTypes?: string[]
): DamageResult {
  const singleResult = singleHitCalc(move);

  const totalMinDamage = singleResult.minDamage * hitCount;
  const totalMaxDamage = singleResult.maxDamage * hitCount;
  const totalMinPercent = Math.round((totalMinDamage / defenderMaxHp) * 100 * 10) / 10;
  const totalMaxPercent = Math.round((totalMaxDamage / defenderMaxHp) * 100 * 10) / 10;

  // perHit: 同じ結果を hitCount 回分格納
  const perHitEntry: MultiHitPerHit = {
    minDamage: singleResult.minDamage,
    maxDamage: singleResult.maxDamage,
    minPercent: singleResult.minPercent,
    maxPercent: singleResult.maxPercent,
  };
  const perHit = Array.from({ length: hitCount }, () => perHitEntry);

  const recovery = resolveRecoveryItem(defenderItem, defenderTypes ?? []);
  return {
    minDamage: totalMinDamage,
    maxDamage: totalMaxDamage,
    minPercent: totalMinPercent,
    maxPercent: totalMaxPercent,
    guaranteed: simulateKoTurns(defenderMaxHp, totalMaxDamage, recovery),
    possible: simulateKoTurns(defenderMaxHp, totalMinDamage, recovery),
    multiHit: { perHit },
    details: singleResult.details,
  };
}

/** escalating型: 各回で power を差し替えて個別計算 */
function calculateEscalatingMultiHit(
  singleHitCalc: (move: CalcMove) => DamageResult,
  move: CalcMove,
  powers: number[],
  hitCount: number,
  defenderMaxHp: number,
  defenderItem?: string,
  defenderTypes?: string[]
): DamageResult {
  const effectiveCount = Math.min(hitCount, powers.length);
  const perHit: MultiHitPerHit[] = [];
  let totalMinDamage = 0;
  let totalMaxDamage = 0;

  for (let i = 0; i < effectiveCount; i++) {
    const hitMove: CalcMove = { ...move, power: powers[i] };
    const hitResult = singleHitCalc(hitMove);

    perHit.push({
      minDamage: hitResult.minDamage,
      maxDamage: hitResult.maxDamage,
      minPercent: hitResult.minPercent,
      maxPercent: hitResult.maxPercent,
    });

    totalMinDamage += hitResult.minDamage;
    totalMaxDamage += hitResult.maxDamage;
  }

  const totalMinPercent = Math.round((totalMinDamage / defenderMaxHp) * 100 * 10) / 10;
  const totalMaxPercent = Math.round((totalMaxDamage / defenderMaxHp) * 100 * 10) / 10;

  const recovery = resolveRecoveryItem(defenderItem, defenderTypes ?? []);
  return {
    minDamage: totalMinDamage,
    maxDamage: totalMaxDamage,
    minPercent: totalMinPercent,
    maxPercent: totalMaxPercent,
    guaranteed: simulateKoTurns(defenderMaxHp, totalMaxDamage, recovery),
    possible: simulateKoTurns(defenderMaxHp, totalMinDamage, recovery),
    multiHit: { perHit },
    details: undefined,
  };
}
