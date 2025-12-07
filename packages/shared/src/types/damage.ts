import type { PokemonType } from "./pokemon";

/** 天候 */
export type Weather = "none" | "sun" | "rain" | "sandstorm" | "snow";

/** フィールド */
export type Field = "none" | "electric" | "grassy" | "misty" | "psychic";

/** 能力ランク（-6〜+6） */
export type StatStage = -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 能力ランクの状態 */
export interface StatStages {
  attack: StatStage;
  defense: StatStage;
  specialAttack: StatStage;
  specialDefense: StatStage;
  speed: StatStage;
}

/** バトル状況 */
export interface BattleCondition {
  weather: Weather;
  field: Field;
  attackerStatStages: StatStages;
  defenderStatStages: StatStages;
  // ダブルバトル用
  isDoubleBattle?: boolean;
  isSpreadMove?: boolean; // 全体技かどうか
  isHelpingHand?: boolean; // てだすけ使用中か
  // その他の状態
  isCriticalHit?: boolean;
  attackerTerastallized?: boolean; // テラスタル使用中か
  attackerAbility?: string;
  defenderAbility?: string;
  attackerItem?: string;
  defenderItem?: string;
}

/** ダメージ計算の入力 */
export interface DamageCalculationInput {
  // 技情報
  movePower: number;
  moveType: PokemonType;
  moveCategory: "Physical" | "Special";

  // 攻撃側
  attackerLevel: number;
  attackerAttack: number; // 物理攻撃 or 特殊攻撃の実数値
  attackerTypes: PokemonType[]; // タイプ一致判定用
  attackerTeraType?: PokemonType; // テラスタイプ

  // 防御側
  defenderDefense: number; // 物理防御 or 特殊防御の実数値
  defenderTypes: PokemonType[]; // タイプ相性判定用

  // バトル状況
  condition: BattleCondition;
}

/** ダメージ計算結果 */
export interface DamageResult {
  // ダメージ範囲（乱数込み）
  minDamage: number;
  maxDamage: number;

  // 割合（%）
  minPercent: number;
  maxPercent: number;

  // 確定数（何発で倒せるか）
  guaranteed: number; // 最大ダメージでの確定数
  possible: number; // 最小ダメージでの確定数

  // デバッグ用の詳細情報
  details?: {
    baseDamage: number;
    typeEffectiveness: number;
    stab: number;
    weatherModifier: number;
    criticalModifier: number;
    randomModifier: [number, number]; // [0.85, 1.00]
  };
}
