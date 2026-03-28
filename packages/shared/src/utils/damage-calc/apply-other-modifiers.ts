import { pokeRound } from './poke-round';

/**
 * "other"補正チェーンを適用（特性・持ち物など）
 * shadowtag.xyzと同じ方式: 4096ベースで補正を連鎖させてから最後にダメージに適用
 * 参考: https://shadowtag.xyz/
 */
export function applyOtherModifiers(baseDamage: number, modifiers: number[]): number {
  const INIT_VAL = 4096;
  let chain = INIT_VAL;

  // 補正を4096ベースで連鎖させる
  for (const modifier of modifiers) {
    if (modifier !== 1.0) {
      const modifier4096 = Math.floor(modifier * INIT_VAL);
      chain = Math.round((chain * modifier4096) / INIT_VAL);
    }
  }

  // 最後に五捨五超入で適用
  return pokeRound((baseDamage * chain) / INIT_VAL);
}
