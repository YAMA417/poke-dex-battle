import type { PokemonType } from './pokemon';

/** 天候 */
export type Weather = 'none' | 'sun' | 'rain' | 'sandstorm' | 'snow';

/** フィールド */
export type Field = 'none' | 'electric' | 'grassy' | 'misty' | 'psychic';

/** 能力ランク（-6〜+6） */
export type StatStage = -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 特性の種類（Phase 1: 基本10個） */
export type Ability =
  // 攻撃側
  | 'Technician' // テクニシャン
  | 'Iron Fist' // てつのこぶし
  | 'Reckless' // すてみ
  | 'Huge Power' // ちからもち
  | 'Pure Power' // ヨガパワー（ちからもちと同じ効果）
  // 防御側
  | 'Multiscale' // マルチスケイル
  | 'Solid Rock' // ハードロック
  | 'Filter' // フィルター
  | 'Fluffy' // もふもふ
  | 'Thick Fat'; // あついしぼう

/**
 * ダメージ計算用のポケモン型（新エンジン）
 * 実数値ベースで統一
 */
export interface CalcPokemon {
  level: number;
  types: PokemonType[];
  stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  boosts?: {
    atk?: StatStage;
    def?: StatStage;
    spa?: StatStage;
    spd?: StatStage;
    spe?: StatStage;
  };
  ability?: string;
  item?: string;
  status?: 'burn' | 'none';
  currentHp?: number;
  maxHp?: number;
  teraType?: PokemonType;
  isTerastallized?: boolean;
}

/**
 * ダメージ計算用の技型（新エンジン）
 */
export interface CalcMove {
  name: string;
  power: number;
  type: PokemonType;
  category: 'Physical' | 'Special';
  isCritical?: boolean;
  flags?: MoveFlags;
}

/**
 * ダメージ計算用のバトルコンテキスト（新エンジン）
 */
export interface BattleContext {
  weather?: Weather;
  field?: Field;
  isDoubleBattle?: boolean;
  isSpreadMove?: boolean;
  isHelpingHand?: boolean;
  reflect?: boolean;
  lightScreen?: boolean;
  // 場の全特性（わざわいシリーズ等の場に影響する特性を含む）
  allAttackerSideAbilities?: string[];
  allDefenderSideAbilities?: string[];
}

/** 持ち物の種類（Phase 1: 基本10個） */
export type Item =
  | 'Choice Band' // こだわりハチマキ
  | 'Choice Specs' // こだわりメガネ
  | 'Life Orb' // いのちのたま
  | 'Expert Belt' // たつじんのおび
  | 'Muscle Band' // ちからのハチマキ
  | 'Wise Glasses' // ものしりメガネ
  | 'Eviolite' // しんかのきせき
  | 'Assault Vest' // とつげきチョッキ
  | 'Normal Gem' // ノーマルジュエル
  | 'Punching Glove'; // パンチグローブ

/** 技の分類（特性判定用） */
export interface MoveFlags {
  isPunchMove?: boolean; // パンチ技か
  isRecoilMove?: boolean; // 反動技か
  isContactMove?: boolean; // 接触技か
  isBiteMove?: boolean; // キバ技か（がんじょうあご用）
  isAuraMove?: boolean; // 波動技か（メガランチャー用）
  hasSecondaryEffect?: boolean; // 追加効果ありか（ちからずく用）
  // 特殊ステータス参照
  usesDefenseAsAttack?: boolean; // 攻撃側の防御で計算（ボディプレス）
  targetsPhysicalDefense?: boolean; // 特殊技だが防御側の物理防御で計算（サイコショック等）
  usesTargetAttack?: boolean; // 防御側の攻撃で計算（イカサマ）
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
