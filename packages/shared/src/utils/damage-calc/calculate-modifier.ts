import {
  ABILITY_GUTS,
  ABILITY_MOLD_BREAKER,
  ABILITY_SNIPER,
  ABILITY_TERAVOLT,
  ABILITY_TINTED_LENS,
  ABILITY_TURBOBLAZE,
  ITEM_LIFE_ORB,
} from '../../constants/damage-calc-names';
import { getTypeResistBerryType } from '../../constants/item-type-map';
import { calcTypeEffectiveness } from '../../constants/types';
import type { BattleContext, CalcMove, CalcPokemon } from '../../types/damage';
import type { ModifierRule } from '../../types/damage-effect';
import { isPokemonType } from '../../types/pokemon';
import {
  calculateDefenderAbilityModifier,
  calculateDefenderItemModifier,
  calculateFieldModifier,
  calculateStab,
  calculateWeatherModifier,
} from '../damage-calc';
import { abilityIs, itemIs, moveIs } from '../normalize-id';
import { applyOtherModifiers } from './apply-other-modifiers';
import { evaluateDefenderModifier } from './apply-damage-effect';

interface ModifierResult {
  minDamage: number;
  maxDamage: number;
  stab: number;
  typeEffectiveness: number;
  weatherModifier: number;
  fieldModifier: number;
}

/**
 * baseDamage後の全補正を公式順序で適用し、min/maxダメージを返す
 *
 * damageEffect が設定されている場合はそれを使い、
 * 設定されていない場合は旧来の文字列比較にフォールバックする。
 */
export function calculateModifier(
  baseDamage: number,
  attacker: CalcPokemon,
  defender: CalcPokemon,
  move: CalcMove,
  context: BattleContext
): ModifierResult {
  let minDamage = baseDamage;
  let maxDamage = baseDamage;

  // 1. Targets (全体技補正)
  if (context.isDoubleBattle && context.isSpreadMove) {
    minDamage = Math.floor(minDamage * 0.75);
    maxDamage = Math.floor(maxDamage * 0.75);
  }

  // 2. Weather (天候補正)
  const weatherModifier = calculateWeatherModifier(move.type, context.weather || 'none');
  minDamage = Math.floor(minDamage * weatherModifier);
  maxDamage = Math.floor(maxDamage * weatherModifier);

  // 2.5. Field (フィールド補正)
  const fieldModifier = calculateFieldModifier(move.type, context.field || 'none');
  minDamage = Math.floor(minDamage * fieldModifier);
  maxDamage = Math.floor(maxDamage * fieldModifier);

  // 3. Critical (急所補正)
  let criticalModifier = 1.0;
  if (move.isCritical) {
    const sniperEffect = attacker.abilityDamageEffect?.attackerModifier;
    const isSniperByEffect = sniperEffect?.condition === 'critical_boost';
    const isSniperByName = !isSniperByEffect && abilityIs(attacker.ability, ABILITY_SNIPER);
    criticalModifier = isSniperByEffect || isSniperByName ? 2.25 : 1.5;
  }
  minDamage = Math.floor(minDamage * criticalModifier);
  maxDamage = Math.floor(maxDamage * criticalModifier);

  // 4. Random (乱数: 0.85〜1.00)
  minDamage = Math.floor(minDamage * 0.85);
  maxDamage = Math.floor(maxDamage * 1.0);

  // 5. STAB (タイプ一致補正)
  const stab = calculateStab(
    move.type,
    attacker.types,
    attacker.teraType,
    attacker.isTerastallized,
    attacker.ability,
    attacker.isStellarBoostUsed
  );
  minDamage = Math.floor(minDamage * stab);
  maxDamage = Math.floor(maxDamage * stab);

  // 6. Type (タイプ相性)
  const defenderEffectiveTypes =
    defender.isTerastallized && defender.teraType && isPokemonType(defender.teraType)
      ? [defender.teraType]
      : defender.types;
  let typeEffectiveness = calcTypeEffectiveness(move.type, defenderEffectiveTypes);

  // ステラテラバースト
  const isTeraBlast = move.damageEffect?.powerModifier?.condition === 'tera_blast';
  if (isTeraBlast && attacker.isTerastallized && attacker.teraType === 'Stellar') {
    typeEffectiveness = 1.0;
  } else if (
    !isTeraBlast &&
    moveIs(move.name, 'Tera Blast') &&
    attacker.isTerastallized &&
    attacker.teraType === 'Stellar'
  ) {
    typeEffectiveness = 1.0;
  }

  // 色眼鏡 (Tinted Lens)
  const tintedEffect = attacker.abilityDamageEffect?.attackerModifier;
  const isTintedByEffect = tintedEffect?.condition === 'not_very_effective_boost';
  const isTintedByName = !isTintedByEffect && abilityIs(attacker.ability, ABILITY_TINTED_LENS);
  const effectiveTypeMultiplier =
    (isTintedByEffect || isTintedByName) && typeEffectiveness < 1
      ? typeEffectiveness * 2
      : typeEffectiveness;

  minDamage = Math.floor(minDamage * effectiveTypeMultiplier);
  maxDamage = Math.floor(maxDamage * effectiveTypeMultiplier);

  // 6.5 イナズマドライブ / アクセルブレイク
  const isSuperEffBoost = move.damageEffect?.powerModifier?.condition === 'super_effective_boost';
  if (isSuperEffBoost && typeEffectiveness > 1) {
    minDamage = Math.floor((minDamage * 5461) / 4096);
    maxDamage = Math.floor((maxDamage * 5461) / 4096);
  } else if (
    !isSuperEffBoost &&
    (moveIs(move.name, 'Electro Drift') || moveIs(move.name, 'Collision Course')) &&
    typeEffectiveness > 1
  ) {
    minDamage = Math.floor((minDamage * 5461) / 4096);
    maxDamage = Math.floor((maxDamage * 5461) / 4096);
  }

  // 6.6 半減実
  if (defender.itemDamageEffect?.defenderModifiers) {
    const defItemModifiers = defender.itemDamageEffect.defenderModifiers;
    if (Array.isArray(defItemModifiers)) {
      for (const rule of defItemModifiers) {
        const berryMod = evaluateDefenderModifier(
          rule as ModifierRule,
          typeEffectiveness,
          move.type,
          move.flags,
          undefined,
          undefined,
          move.category
        );
        if (berryMod !== 1.0) {
          minDamage = Math.floor(minDamage * berryMod);
          maxDamage = Math.floor(maxDamage * berryMod);
          break;
        }
      }
    }
  } else {
    // フォールバック: 文字列比較
    const resistBerryType = getTypeResistBerryType(defender.item);
    const berryActivates = typeEffectiveness > 1 || resistBerryType === 'Normal';
    if (resistBerryType && resistBerryType === move.type && berryActivates) {
      minDamage = Math.floor(minDamage * 0.5);
      maxDamage = Math.floor(maxDamage * 0.5);
    }
  }

  // 7. "other" modifiers
  const otherModifiers: number[] = [];

  // リフレクター/ひかりのかべ
  const screenModifier = context.isDoubleBattle ? 2732 / 4096 : 0.5;
  if (context.reflect && move.category === 'Physical' && !move.isCritical) {
    otherModifiers.push(screenModifier);
  }
  if (context.lightScreen && move.category === 'Special' && !move.isCritical) {
    otherModifiers.push(screenModifier);
  }

  // オーロラベール (Aurora Veil): 物理・特殊両方に壁補正（急所で無効）
  if (context.auroraVeil && !move.isCritical) {
    otherModifiers.push(screenModifier);
  }

  // いのちのたま等（unconditional条件のアイテムはダメージ補正段階で適用）
  if (attacker.itemDamageEffect?.attackerModifier) {
    const mod = attacker.itemDamageEffect.attackerModifier as ModifierRule;
    if (mod.condition === 'unconditional') {
      otherModifiers.push(mod.multiplier);
    }
  } else if (itemIs(attacker.item, ITEM_LIFE_ORB)) {
    otherModifiers.push(1.3);
  }

  // フレンドガード (Friend Guard): 味方の特性でダメージ0.75倍
  if (context.friendGuardActive) {
    otherModifiers.push(0.75);
  }

  // ダークオーラ / フェアリーオーラ / オーラブレイク
  const auras = context.auraAbilities ?? [];
  const hasDarkAura = auras.includes('Dark Aura');
  const hasFairyAura = auras.includes('Fairy Aura');
  const hasAuraBreak = auras.includes('Aura Break');

  if (hasDarkAura && move.type === 'Dark') {
    otherModifiers.push(hasAuraBreak ? 3072 / 4096 : 5448 / 4096);
  }
  if (hasFairyAura && move.type === 'Fairy') {
    otherModifiers.push(hasAuraBreak ? 3072 / 4096 : 5448 / 4096);
  }

  // やけど: 物理技かつこんじょう以外 → 0.5倍
  if (
    attacker.status === 'burn' &&
    move.category === 'Physical' &&
    !abilityIs(attacker.ability, ABILITY_GUTS)
  ) {
    otherModifiers.push(0.5);
  }

  // かたやぶり系
  const isMoldBreaker =
    abilityIs(attacker.ability, ABILITY_MOLD_BREAKER) ||
    abilityIs(attacker.ability, ABILITY_TURBOBLAZE) ||
    abilityIs(attacker.ability, ABILITY_TERAVOLT);

  // 防御側特性によるダメージ補正
  if (!isMoldBreaker) {
    if (defender.abilityDamageEffect?.defenderModifiers) {
      const defAbilityModifiers = defender.abilityDamageEffect.defenderModifiers;
      if (Array.isArray(defAbilityModifiers)) {
        for (const rule of defAbilityModifiers) {
          const mod = evaluateDefenderModifier(
            rule as ModifierRule,
            typeEffectiveness,
            move.type,
            move.flags,
            defender.currentHp,
            defender.maxHp,
            move.category
          );
          if (mod !== 1.0) {
            otherModifiers.push(mod);
            break;
          }
        }
      }
    } else {
      // フォールバック: 文字列比較
      const defenderAbilityModifier = calculateDefenderAbilityModifier(
        defender.ability,
        typeEffectiveness,
        move.type,
        move.flags,
        defender.currentHp,
        defender.maxHp,
        move.category
      );
      if (defenderAbilityModifier !== 1.0) {
        otherModifiers.push(defenderAbilityModifier);
      }
    }
  }

  // 防御側持ち物によるダメージ補正（フォールバックのみ、damageEffect はdefenderModifiersで処理済み）
  if (!defender.itemDamageEffect) {
    const defenderItemModifier = calculateDefenderItemModifier(defender.item, move.category);
    if (defenderItemModifier !== 1.0) {
      otherModifiers.push(defenderItemModifier);
    }
  }

  // 4096チェーンで補正を適用
  if (otherModifiers.length > 0) {
    minDamage = applyOtherModifiers(minDamage, otherModifiers);
    maxDamage = applyOtherModifiers(maxDamage, otherModifiers);
  }

  return {
    minDamage,
    maxDamage,
    stab,
    typeEffectiveness,
    weatherModifier,
    fieldModifier,
  };
}
