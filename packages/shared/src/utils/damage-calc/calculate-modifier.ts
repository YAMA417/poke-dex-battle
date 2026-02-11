import { calcTypeEffectiveness } from "../../constants/types";
import type { BattleContext, CalcMove, CalcPokemon } from "../../types/damage";
import {
  calculateDefenderAbilityModifier,
  calculateDefenderItemModifier,
  calculateStab,
  calculateWeatherModifier,
} from "../damage-calc";
import { applyOtherModifiers } from "./apply-other-modifiers";

interface ModifierResult {
  minDamage: number;
  maxDamage: number;
}

/**
 * baseDamage後の全補正を公式順序で適用し、min/maxダメージを返す
 *
 * @param baseDamage - ベースダメージ
 * @param attacker - 攻撃側ポケモン
 * @param defender - 防御側ポケモン
 * @param move - 技情報
 * @param context - バトルコンテキスト
 * @returns { minDamage, maxDamage } のオブジェクト
 */
export function calculateModifier(
  baseDamage: number,
  attacker: CalcPokemon,
  defender: CalcPokemon,
  move: CalcMove,
  context: BattleContext,
): ModifierResult {
  let minDamage = baseDamage;
  let maxDamage = baseDamage;

  // 1. Targets (全体技補正) - BEFORE random
  if (context.isDoubleBattle && context.isSpreadMove) {
    minDamage = Math.floor(minDamage * 0.75);
    maxDamage = Math.floor(maxDamage * 0.75);
  }

  // 2. Weather (天候補正) - BEFORE random
  const weatherModifier = calculateWeatherModifier(
    move.type,
    context.weather || "none",
  );
  minDamage = Math.floor(minDamage * weatherModifier);
  maxDamage = Math.floor(maxDamage * weatherModifier);

  // 3. Critical (急所補正) - BEFORE random
  const criticalModifier = move.isCritical ? 1.5 : 1.0;
  minDamage = Math.floor(minDamage * criticalModifier);
  maxDamage = Math.floor(maxDamage * criticalModifier);

  // 4. Random (乱数: 0.85〜1.00) - ここで最小/最大が分岐
  minDamage = Math.floor(minDamage * 0.85);
  maxDamage = Math.floor(maxDamage * 1.0);

  // 5. STAB (タイプ一致補正) - AFTER random
  const stab = calculateStab(
    move.type,
    attacker.types,
    attacker.teraType,
    attacker.isTerastallized,
  );
  minDamage = Math.floor(minDamage * stab);
  maxDamage = Math.floor(maxDamage * stab);

  // 6. Type (タイプ相性) - AFTER random
  const typeEffectiveness = calcTypeEffectiveness(move.type, defender.types);
  minDamage = Math.floor(minDamage * typeEffectiveness);
  maxDamage = Math.floor(maxDamage * typeEffectiveness);

  // 7. "other" modifiers (ダメージ補正のみ) - AFTER Type
  // 壁: リフレクターと光の壁
  const otherModifiers: number[] = [];

  // リフレクター: 物理技で0.5倍（急所時は無視）
  if (context.reflect && move.category === "Physical" && !move.isCritical) {
    otherModifiers.push(0.5);
  }

  // ひかりのかべ: 特殊技で0.5倍（急所時は無視）
  if (context.lightScreen && move.category === "Special" && !move.isCritical) {
    otherModifiers.push(0.5);
  }

  // いのちのたま: ダメージ1.3倍
  if (attacker.item === "Life Orb") {
    otherModifiers.push(1.3);
  }

  // 防御側特性によるダメージ補正
  const defenderAbilityModifier = calculateDefenderAbilityModifier(
    defender.ability,
    typeEffectiveness,
    move.type,
    move.flags,
    defender.currentHp,
    defender.maxHp,
  );
  if (defenderAbilityModifier !== 1.0) {
    otherModifiers.push(defenderAbilityModifier);
  }

  // 防御側持ち物によるダメージ補正
  const defenderItemModifier = calculateDefenderItemModifier(
    defender.item,
    move.category,
  );
  if (defenderItemModifier !== 1.0) {
    otherModifiers.push(defenderItemModifier);
  }

  // 4096チェーンで補正を適用
  if (otherModifiers.length > 0) {
    minDamage = applyOtherModifiers(minDamage, otherModifiers);
    maxDamage = applyOtherModifiers(maxDamage, otherModifiers);
  }

  return { minDamage, maxDamage };
}
