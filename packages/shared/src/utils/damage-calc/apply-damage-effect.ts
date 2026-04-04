/**
 * damageEffect JSONルールの汎用解釈関数群
 *
 * DB の damage_effect JSONB カラムに格納されたルールを評価し、
 * 適切な補正倍率を返す。
 */
import type { ModifierRule, PowerModifierRule } from '../../types/damage-effect';
import type { BattleContext, CalcMove, CalcPokemon, MoveFlags } from '../../types/damage';
import type { PokemonType } from '../../types/pokemon';

// ---------------------------------------------------------------------------
// 技の威力補正ルール評価
// ---------------------------------------------------------------------------

/**
 * 技の powerModifier ルールを評価し、補正後の威力を返す
 */
export function applyPowerModifierRule(
  power: number,
  rule: PowerModifierRule,
  context: BattleContext,
  attacker: CalcPokemon,
  defender: CalcPokemon
): number {
  switch (rule.condition) {
    case 'weather_active':
      if (context.weather && context.weather !== 'none') {
        return Math.floor(power * rule.multiplier);
      }
      break;

    case 'weather_weakening':
      if (context.weather && rule.weathers.includes(context.weather)) {
        return Math.floor(power * rule.multiplier);
      }
      break;

    case 'field_boost':
      if (context.field === rule.field) {
        return Math.floor(power * rule.multiplier);
      }
      break;

    case 'field_weakening':
      if (context.field === rule.field) {
        return Math.floor(power * rule.multiplier);
      }
      break;

    case 'defender_has_item':
      if (defender.item) {
        return Math.floor(power * rule.multiplier);
      }
      break;

    case 'attacker_no_item':
      if (!attacker.item) {
        return Math.floor(power * rule.multiplier);
      }
      break;

    case 'tera_blast':
    case 'super_effective_boost':
      // calculate-modifier.ts 側で個別処理するため、ここでは何もしない
      break;
  }
  return power;
}

// ---------------------------------------------------------------------------
// 攻撃側・防御側の補正ルール評価
// ---------------------------------------------------------------------------

/**
 * MoveFlags のフラグ名からフラグ値を取得
 */
function getMoveFlag(flags: MoveFlags | undefined, flagName: string): boolean {
  if (!flags) return false;
  return !!(flags as Record<keyof MoveFlags, unknown>)[flagName as keyof MoveFlags];
}

/**
 * 攻撃側の ModifierRule を評価し、補正倍率を返す
 * 該当しない場合は 1.0 を返す
 */
export function evaluateAttackerModifier(
  rule: ModifierRule,
  move: CalcMove,
  context: BattleContext,
  typeEffectiveness?: number
): number {
  switch (rule.condition) {
    case 'move_flag':
      if (getMoveFlag(move.flags, rule.flag)) return rule.multiplier;
      break;

    case 'move_type':
      if (move.type === rule.type) return rule.multiplier;
      break;

    case 'move_type_in':
      if (rule.types.includes(move.type)) return rule.multiplier;
      break;

    case 'move_category':
      if (move.category === rule.category) return rule.multiplier;
      break;

    case 'move_power_lte':
      if (move.power <= rule.threshold) return rule.multiplier;
      break;

    case 'super_effective':
      if (typeEffectiveness !== undefined && typeEffectiveness > 1) return rule.multiplier;
      break;

    case 'unconditional':
      return rule.multiplier;

    case 'weather_and_type':
      if (context.weather === rule.weather && rule.types.includes(move.type)) {
        return rule.multiplier;
      }
      break;

    case 'not_very_effective_boost':
    case 'critical_boost':
      // calculate-modifier.ts 側で個別処理するため、ここでは何もしない
      break;
  }
  return 1.0;
}

/**
 * 防御側の ModifierRule を評価し、補正倍率を返す
 * 該当しない場合は 1.0 を返す
 */
export function evaluateDefenderModifier(
  rule: ModifierRule,
  typeEffectiveness: number,
  moveType: PokemonType,
  moveFlags?: MoveFlags,
  currentHp?: number,
  maxHp?: number,
  moveCategory?: 'Physical' | 'Special'
): number {
  switch (rule.condition) {
    case 'full_hp':
      if (currentHp && maxHp && currentHp === maxHp) return rule.multiplier;
      break;

    case 'super_effective':
      if (typeEffectiveness > 1) return rule.multiplier;
      break;

    case 'move_flag':
      if (getMoveFlag(moveFlags, rule.flag)) return rule.multiplier;
      break;

    case 'move_type':
      if (moveType === rule.type) return rule.multiplier;
      break;

    case 'move_type_in':
      if (rule.types.includes(moveType)) return rule.multiplier;
      break;

    case 'move_type_super_effective':
      // 半減実: 対応タイプかつ効果抜群（またはノーマル技のチランのみ）
      if (moveType === rule.type && (typeEffectiveness > 1 || rule.type === 'Normal')) {
        return rule.multiplier;
      }
      break;

    case 'move_category':
      if (moveCategory === rule.category) return rule.multiplier;
      break;

    case 'unconditional':
      return rule.multiplier;
  }
  return 1.0;
}
