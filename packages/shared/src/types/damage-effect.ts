import type { PokemonType } from './pokemon';

// === 技の威力補正ルール ===

/** 技の威力補正条件 */
export type PowerModifierRule =
  | { condition: 'weather_active'; multiplier: number }
  | { condition: 'weather_weakening'; weathers: string[]; multiplier: number }
  | { condition: 'field_boost'; field: string; multiplier: number }
  | { condition: 'field_weakening'; field: string; multiplier: number }
  | { condition: 'defender_has_item'; multiplier: number }
  | { condition: 'attacker_no_item'; multiplier: number }
  | { condition: 'tera_blast' }
  | { condition: 'super_effective_boost'; multiplier: number };

// === 連続技情報 ===

export interface MultiHitFixed {
  type: 'fixed';
  min: number;
  max: number;
}

export interface MultiHitEscalating {
  type: 'escalating';
  powers: number[];
}

export type MultiHitInfo = MultiHitFixed | MultiHitEscalating;

// === 特性・アイテムのダメージ補正ルール ===

/** 攻撃側・防御側の補正条件 */
export type ModifierRule =
  | { condition: 'move_flag'; flag: string; multiplier: number }
  | { condition: 'move_type'; type: PokemonType; multiplier: number }
  | { condition: 'move_type_in'; types: PokemonType[]; multiplier: number }
  | { condition: 'move_type_super_effective'; type: PokemonType; multiplier: number }
  | { condition: 'move_category'; category: 'Physical' | 'Special'; multiplier: number }
  | { condition: 'move_power_lte'; threshold: number; multiplier: number }
  | { condition: 'super_effective'; multiplier: number }
  | { condition: 'full_hp'; multiplier: number }
  | { condition: 'unconditional'; multiplier: number }
  | { condition: 'weather_and_type'; weather: string; types: PokemonType[]; multiplier: number }
  | { condition: 'not_very_effective_boost'; multiplier: number }
  | { condition: 'critical_boost'; multiplier: number };

// === damage_effect カラムの型 ===

/**
 * 技・特性・アイテムの damage_effect JSONB カラムの型定義
 *
 * 技の例:
 *   Weather Ball: { powerModifier: { condition: 'weather_active', multiplier: 2.0 } }
 *   Bullet Seed:  { multiHit: { type: 'fixed', min: 2, max: 5 } }
 *   Triple Kick:  { multiHit: { type: 'escalating', powers: [10, 20, 30] } }
 *
 * 特性の例:
 *   Iron Fist:    { attackerModifier: { condition: 'move_flag', flag: 'isPunch', multiplier: 1.2 } }
 *   Thick Fat:    { defenderModifiers: [{ condition: 'move_type_in', types: ['Fire','Ice'], multiplier: 0.5 }] }
 *
 * アイテムの例:
 *   Choice Band:  { attackerModifier: { condition: 'move_category', category: 'Physical', multiplier: 1.5 } }
 *   Occa Berry:   { defenderModifiers: [{ condition: 'move_type_super_effective', type: 'Fire', multiplier: 0.5 }] }
 */
export interface DamageEffect {
  /** 技の威力補正（技専用） */
  powerModifier?: PowerModifierRule;
  /** 攻撃側の単一補正 */
  attackerModifier?: ModifierRule;
  /** 防御側の補正（複数条件対応: もふもふ等） */
  defenderModifiers?: ModifierRule[];
  /** 連続技情報（技専用） */
  multiHit?: MultiHitInfo;
  /** ダメージ計算UIでの表示ロール */
  role?: 'attacker' | 'defender';
  /** グルーピング表示用（同一groupは1行にまとめ） */
  group?: string | null;
  /** UIに表示するサブテキスト（例: "攻撃 x1.5"） */
  label?: string;
}
