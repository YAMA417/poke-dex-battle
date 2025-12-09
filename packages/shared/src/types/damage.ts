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

/** 特性の種類（Phase 1: 基本10個） */
export type Ability =
  // 攻撃側
  | "Technician" // テクニシャン
  | "Iron Fist" // てつのこぶし
  | "Reckless" // すてみ
  | "Huge Power" // ちからもち
  | "Pure Power" // ヨガパワー（ちからもちと同じ効果）
  // 防御側
  | "Multiscale" // マルチスケイル
  | "Solid Rock" // ハードロック
  | "Filter" // フィルター
  | "Fluffy" // もふもふ
  | "Thick Fat"; // あついしぼう

/** 持ち物の種類（Phase 1: 基本10個） */
export type Item =
  | "Choice Band" // こだわりハチマキ
  | "Choice Specs" // こだわりメガネ
  | "Life Orb" // いのちのたま
  | "Expert Belt" // たつじんのおび
  | "Muscle Band" // ちからのハチマキ
  | "Wise Glasses" // ものしりメガネ
  | "Eviolite" // しんかのきせき
  | "Assault Vest" // とつげきチョッキ
  | "Normal Gem" // ノーマルジュエル
  | "Punching Glove"; // パンチグローブ

/** 技の分類（特性判定用） */
export interface MoveFlags {
  isPunchMove?: boolean; // パンチ技か
  isRecoilMove?: boolean; // 反動技か
  isContactMove?: boolean; // 接触技か
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
  // 技の分類
  moveFlags?: MoveFlags;

  // 防御側
  defenderCurrentHp?: number;
  defenderMaxHp?: number;
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
