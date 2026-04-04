import { getTypeBoostingItemType } from '../../constants/item-type-map';
import { calcTypeEffectiveness } from '../../constants/types';
import type { BattleContext, CalcMove, CalcPokemon } from '../../types/damage';
import type { ModifierRule } from '../../types/damage-effect';
import { abilityIs, itemIs, moveIs } from '../normalize-id';
import { applyPowerModifierRule, evaluateAttackerModifier } from './apply-damage-effect';

/**
 * 技の基礎威力に威力系補正を適用する
 *
 * damageEffect が設定されている場合はそれを使い、
 * 設定されていない場合は旧来の文字列比較にフォールバックする。
 */
export function resolveBasePower(
  move: CalcMove,
  attacker: CalcPokemon,
  defender: CalcPokemon,
  context: BattleContext
): number {
  let power = move.power;

  // === 技固有の威力補正 ===
  if (move.damageEffect?.powerModifier) {
    // damageEffect ベース
    power = applyPowerModifierRule(
      power,
      move.damageEffect.powerModifier,
      context,
      attacker,
      defender
    );
  } else {
    // フォールバック: 文字列比較
    if (moveIs(move.name, 'Weather Ball') && context.weather && context.weather !== 'none') {
      power *= 2;
    }
    if (
      (moveIs(move.name, 'Solar Beam') || moveIs(move.name, 'Solar Blade')) &&
      context.weather &&
      (context.weather === 'rain' || context.weather === 'sandstorm' || context.weather === 'snow')
    ) {
      power = Math.floor(power * 0.5);
    }
    if (
      context.field === 'grassy' &&
      (moveIs(move.name, 'Earthquake') ||
        moveIs(move.name, 'Bulldoze') ||
        moveIs(move.name, 'Magnitude'))
    ) {
      power = Math.floor(power * 0.5);
    }
    if (moveIs(move.name, 'Knock Off') && defender.item) {
      power = Math.floor(power * 1.5);
    }
    if (moveIs(move.name, 'Expanding Force') && context.field === 'psychic') {
      power = Math.floor(power * 1.5);
    }
    if (moveIs(move.name, 'Rising Voltage') && context.field === 'electric') {
      power *= 2;
    }
    if (moveIs(move.name, 'Acrobatics') && !attacker.item) {
      power *= 2;
    }
  }

  // === てだすけ ===
  if (context.isHelpingHand) {
    power = Math.floor(power * 1.5);
  }

  // === 攻撃側特性による威力補正 ===
  if (attacker.abilityDamageEffect?.attackerModifier) {
    const typeEff = calcTypeEffectiveness(move.type, defender.types);
    const multiplier = evaluateAttackerModifier(
      attacker.abilityDamageEffect.attackerModifier as ModifierRule,
      move,
      context,
      typeEff
    );
    if (multiplier !== 1.0) {
      power = Math.floor(power * multiplier);
    }
  } else if (attacker.ability) {
    // フォールバック: 文字列比較
    if (abilityIs(attacker.ability, 'Technician') && move.power <= 60) {
      power = Math.floor(power * 1.5);
    }
    if (abilityIs(attacker.ability, 'Iron Fist') && move.flags?.isPunchMove) {
      power = Math.floor(power * 1.2);
    }
    if (abilityIs(attacker.ability, 'Reckless') && move.flags?.isRecoilMove) {
      power = Math.floor(power * 1.2);
    }
    if (abilityIs(attacker.ability, 'Strong Jaw') && move.flags?.isBiteMove) {
      power = Math.floor(power * 1.5);
    }
    if (abilityIs(attacker.ability, 'Mega Launcher') && move.flags?.isAuraMove) {
      power = Math.floor(power * 1.5);
    }
    if (abilityIs(attacker.ability, 'Sheer Force') && move.flags?.hasSecondaryEffect) {
      power = Math.floor(power * 1.3);
    }
    if (abilityIs(attacker.ability, 'Steelworker') && move.type === 'Steel') {
      power = Math.floor(power * 1.5);
    }
    if (
      abilityIs(attacker.ability, 'Sand Force') &&
      context.weather === 'sandstorm' &&
      (move.type === 'Rock' || move.type === 'Ground' || move.type === 'Steel')
    ) {
      power = Math.floor(power * 1.3);
    }
  }

  // === 持ち物による威力補正 ===
  if (attacker.itemDamageEffect?.attackerModifier) {
    const typeEff = calcTypeEffectiveness(move.type, defender.types);
    const multiplier = evaluateAttackerModifier(
      attacker.itemDamageEffect.attackerModifier as ModifierRule,
      move,
      context,
      typeEff
    );
    if (multiplier !== 1.0) {
      power = Math.floor(power * multiplier);
    }
  } else if (attacker.item) {
    // フォールバック: 文字列比較
    const typeEffectiveness = calcTypeEffectiveness(move.type, defender.types);
    if (itemIs(attacker.item, 'Expert Belt') && typeEffectiveness > 1) {
      power = Math.floor(power * 1.2);
    }
    if (itemIs(attacker.item, 'Normal Gem') && move.type === 'Normal') {
      power = Math.floor(power * 1.3);
    }
    if (itemIs(attacker.item, 'Punching Glove') && move.flags?.isPunchMove) {
      power = Math.floor(power * 1.1);
    }
    const boostedType = getTypeBoostingItemType(attacker.item);
    if (boostedType && move.type === boostedType) {
      power = Math.floor(power * 1.2);
    }
  }

  return power;
}
