import { calcTypeEffectiveness } from '../../constants/types';
import type { BattleContext, CalcMove, CalcPokemon } from '../../types/damage';

/**
 * 技の基礎威力に威力系補正を適用する
 *
 * @param move - 技情報
 * @param attacker - 攻撃側ポケモン
 * @param defender - 防御側ポケモン
 * @param context - バトルコンテキスト
 * @returns 補正済みの最終威力
 */
export function resolveBasePower(
  move: CalcMove,
  attacker: CalcPokemon,
  defender: CalcPokemon,
  context: BattleContext
): number {
  let power = move.power;

  // === 天候依存の技威力変動 ===

  // ウェザーボール (Weather Ball): 天候時に威力2倍
  if (move.name === 'Weather Ball' && context.weather && context.weather !== 'none') {
    power *= 2;
  }

  // ソーラービーム/ソーラーブレード: 雨/砂嵐/雪で威力半減
  if (
    (move.name === 'Solar Beam' || move.name === 'Solar Blade') &&
    context.weather &&
    (context.weather === 'rain' || context.weather === 'sandstorm' || context.weather === 'snow')
  ) {
    power = Math.floor(power * 0.5);
  }

  // === フィールド依存の技威力変動 ===

  // グラスフィールド: じしん・じならし・マグニチュードの威力0.5倍
  if (
    context.field === 'grassy' &&
    (move.name === 'Earthquake' || move.name === 'Bulldoze' || move.name === 'Magnitude')
  ) {
    power = Math.floor(power * 0.5);
  }

  // === てだすけ ===

  // てだすけ: 技の威力を1.5倍
  if (context.isHelpingHand) {
    power = Math.floor(power * 1.5);
  }

  // === 攻撃側特性による威力補正 ===

  // テクニシャン: 威力60以下の技が1.5倍
  if (attacker.ability === 'Technician' && move.power <= 60) {
    power = Math.floor(power * 1.5);
  }

  // てつのこぶし: パンチ技が1.2倍
  if (attacker.ability === 'Iron Fist' && move.flags?.isPunchMove) {
    power = Math.floor(power * 1.2);
  }

  // すてみ: 反動技が1.2倍
  if (attacker.ability === 'Reckless' && move.flags?.isRecoilMove) {
    power = Math.floor(power * 1.2);
  }

  // がんじょうあご (Strong Jaw): キバ技1.5倍
  if (attacker.ability === 'Strong Jaw' && move.flags?.isBiteMove) {
    power = Math.floor(power * 1.5);
  }

  // メガランチャー (Mega Launcher): 波動技1.5倍
  if (attacker.ability === 'Mega Launcher' && move.flags?.isAuraMove) {
    power = Math.floor(power * 1.5);
  }

  // ちからずく (Sheer Force): 追加効果のある技1.3倍
  if (attacker.ability === 'Sheer Force' && move.flags?.hasSecondaryEffect) {
    power = Math.floor(power * 1.3);
  }

  // はがねつかい (Steelworker): 鋼タイプ技1.5倍
  if (attacker.ability === 'Steelworker' && move.type === 'Steel') {
    power = Math.floor(power * 1.5);
  }

  // === 持ち物による威力補正 ===

  // たつじんのおび: 効果抜群で1.2倍
  const typeEffectiveness = calcTypeEffectiveness(move.type, defender.types);
  if (attacker.item === 'Expert Belt' && typeEffectiveness > 1) {
    power = Math.floor(power * 1.2);
  }

  // ノーマルジュエル: ノーマルタイプ1.3倍
  if (attacker.item === 'Normal Gem' && move.type === 'Normal') {
    power = Math.floor(power * 1.3);
  }

  // パンチグローブ: パンチ技1.1倍
  if (attacker.item === 'Punching Glove' && move.flags?.isPunchMove) {
    power = Math.floor(power * 1.1);
  }

  return power;
}
