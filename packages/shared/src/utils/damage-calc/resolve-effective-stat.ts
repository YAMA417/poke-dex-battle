import type { BattleContext, CalcMove, CalcPokemon } from "../../types/damage";
import { getStatStageMultiplier } from "../damage-calc";

/**
 * 攻撃側の実効ステータスを計算
 * ランク補正・急所・やけど・持ち物・特性を考慮
 *
 * @param attacker - 攻撃側ポケモン
 * @param move - 技情報
 * @param context - バトルコンテキスト（天候/フィールド判定用）
 * @param opponentAbility - 防御側の特性（わざわいシリーズ用）
 * @returns 実効攻撃力
 */
export function resolveEffectiveAttack(
  attacker: CalcPokemon,
  move: CalcMove,
  context?: BattleContext,
  opponentAbility?: string,
): number {
  // 物理か特殊かで使用するステータスを選択
  const isPhysical = move.category === "Physical";
  const baseStat = isPhysical ? attacker.stats.atk : attacker.stats.spa;
  const stage = isPhysical
    ? (attacker.boosts?.atk ?? 0)
    : (attacker.boosts?.spa ?? 0);

  // ランク補正を計算
  const multiplier = getStatStageMultiplier(stage);

  // 急所の場合は能力ダウンを無視（負のランクを適用しない）
  const effectiveAttack =
    move.isCritical && stage < 0 ? baseStat : Math.floor(baseStat * multiplier);

  let finalAttack = effectiveAttack;

  // === 特性によるステータス補正 ===

  // ひひいろのこどう (Orichalcum Pulse): 晴れ時に物理攻撃 5461/4096倍
  if (attacker.ability === "Orichalcum Pulse" && isPhysical && context?.weather === "sun") {
    finalAttack = Math.floor(finalAttack * 5461 / 4096);
  }

  // ハドロンエンジン (Hadron Engine): エレキフィールド時に特攻 5461/4096倍
  if (attacker.ability === "Hadron Engine" && !isPhysical && context?.field === "electric") {
    finalAttack = Math.floor(finalAttack * 5461 / 4096);
  }

  // サンパワー (Solar Power): 晴れ時に特攻1.5倍
  if (attacker.ability === "Solar Power" && !isPhysical && context?.weather === "sun") {
    finalAttack = Math.floor(finalAttack * 1.5);
  }

  // === わざわいシリーズ（場にいるポケモンの特性が相手側全体に影響） ===
  // 防御側サイドの全特性をチェック（味方含む）
  const defenderSideAbilities = context?.allDefenderSideAbilities ?? [];
  const hasDefenderSideAbility = (name: string) =>
    defenderSideAbilities.includes(name) || opponentAbility === name;

  // わざわいのうつわ (Tablets of Ruin): 相手の物理攻撃 0.75倍
  if (hasDefenderSideAbility("Tablets of Ruin") && isPhysical) {
    finalAttack = Math.floor(finalAttack * 0.75);
  }

  // わざわいのおふだ (Vessel of Ruin): 相手の特攻 0.75倍
  if (hasDefenderSideAbility("Vessel of Ruin") && !isPhysical) {
    finalAttack = Math.floor(finalAttack * 0.75);
  }

  // === 持ち物によるステータス補正 ===

  // こだわりハチマキ/メガネ: 攻撃を1.5倍
  if (
    (attacker.item === "Choice Band" && isPhysical) ||
    (attacker.item === "Choice Specs" && !isPhysical)
  ) {
    finalAttack = Math.floor(finalAttack * 1.5);
  }

  // ちからのハチマキ/ものしりメガネ: 攻撃を1.1倍
  if (
    (attacker.item === "Muscle Band" && isPhysical) ||
    (attacker.item === "Wise Glasses" && !isPhysical)
  ) {
    finalAttack = Math.floor(finalAttack * 1.1);
  }

  // やけど: 物理攻撃を0.5倍
  if (attacker.status === "burn" && isPhysical) {
    finalAttack = Math.floor(finalAttack * 0.5);
  }

  return finalAttack;
}

/**
 * 防御側の実効ステータスを計算
 * ランク補正・急所・天候・特性・持ち物を考慮
 *
 * @param defender - 防御側ポケモン
 * @param move - 技情報
 * @param opponentAbility - 攻撃側の特性（わざわいシリーズ用）
 * @param context - バトルコンテキスト（天候判定用）
 * @returns 実効防御力
 */
export function resolveEffectiveDefense(
  defender: CalcPokemon,
  move: CalcMove,
  opponentAbility?: string,
  context?: BattleContext,
): number {
  // 物理か特殊かで使用するステータスを選択
  // サイコショック等: 特殊技だが物理防御を参照
  const isPhysical = move.category === "Physical";
  const usesPhysicalDef = isPhysical || (move.flags?.targetsPhysicalDefense ?? false);
  const baseStat = usesPhysicalDef ? defender.stats.def : defender.stats.spd;
  const stage = usesPhysicalDef
    ? (defender.boosts?.def ?? 0)
    : (defender.boosts?.spd ?? 0);

  // ランク補正を計算
  const multiplier = getStatStageMultiplier(stage);

  // 急所の場合は能力アップを無視（正のランクを適用しない）
  const effectiveDefense =
    move.isCritical && stage > 0 ? baseStat : Math.floor(baseStat * multiplier);

  let finalDefense = effectiveDefense;

  // === 天候による防御補正 ===

  // 砂嵐: 岩タイプの特防1.5倍
  if (!usesPhysicalDef && context?.weather === "sandstorm" && defender.types.includes("Rock")) {
    finalDefense = Math.floor(finalDefense * 1.5);
  }

  // 雪: 氷タイプの防御1.5倍
  if (usesPhysicalDef && context?.weather === "snow" && defender.types.includes("Ice")) {
    finalDefense = Math.floor(finalDefense * 1.5);
  }

  // === わざわいシリーズ（場にいるポケモンの特性が相手側全体に影響） ===
  // 攻撃側サイドの全特性をチェック（味方含む）
  const attackerSideAbilities = context?.allAttackerSideAbilities ?? [];
  const hasAttackerSideAbility = (name: string) =>
    attackerSideAbilities.includes(name) || opponentAbility === name;

  // わざわいのつるぎ (Sword of Ruin): 相手の物理防御 0.75倍
  if (hasAttackerSideAbility("Sword of Ruin") && usesPhysicalDef) {
    finalDefense = Math.floor(finalDefense * 0.75);
  }

  // わざわいのたま (Beads of Ruin): 相手の特防 0.75倍
  if (hasAttackerSideAbility("Beads of Ruin") && !usesPhysicalDef) {
    finalDefense = Math.floor(finalDefense * 0.75);
  }

  // === 持ち物による防御補正 ===

  // しんかのきせき (Eviolite): 防御・特防1.5倍
  if (defender.item === "Eviolite") {
    finalDefense = Math.floor(finalDefense * 1.5);
  }

  // とつげきチョッキ (Assault Vest): 特防1.5倍
  if (defender.item === "Assault Vest" && !usesPhysicalDef) {
    finalDefense = Math.floor(finalDefense * 1.5);
  }

  return finalDefense;
}
