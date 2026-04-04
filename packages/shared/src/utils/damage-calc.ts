import {
  ABILITY_ADAPTABILITY,
  ABILITY_FILTER,
  ABILITY_FLUFFY,
  ABILITY_HUGE_POWER,
  ABILITY_ICE_SCALES,
  ABILITY_IRON_FIST,
  ABILITY_MULTISCALE,
  ABILITY_PURE_POWER,
  ABILITY_RECKLESS,
  ABILITY_SHADOW_SHIELD,
  ABILITY_SOLID_ROCK,
  ABILITY_TECHNICIAN,
  ABILITY_THICK_FAT,
  ITEM_ASSAULT_VEST,
  ITEM_CHOICE_BAND,
  ITEM_CHOICE_SPECS,
  ITEM_EVIOLITE,
  ITEM_EXPERT_BELT,
  ITEM_LIFE_ORB,
  ITEM_MUSCLE_BAND,
  ITEM_NORMAL_GEM,
  ITEM_PUNCHING_GLOVE,
  ITEM_WISE_GLASSES,
} from '../constants/damage-calc-names';
import type { Field, MoveFlags, StatStage, Weather } from '../types/damage';
import type { PokemonType, TeraType } from '../types/pokemon';
import { abilityIs, itemIs } from './normalize-id';

/**
 * 能力ランクから補正倍率を取得
 * ランク補正: https://wiki.xn--rckteqa2e.com/wiki/%E8%83%BD%E5%8A%9B%E5%A4%89%E5%8C%96
 */
export function getStatStageMultiplier(stage: StatStage): number {
  const multipliers: Record<StatStage, number> = {
    '-6': 2 / 8,
    '-5': 2 / 7,
    '-4': 2 / 6,
    '-3': 2 / 5,
    '-2': 2 / 4,
    '-1': 2 / 3,
    '0': 2 / 2,
    '1': 3 / 2,
    '2': 4 / 2,
    '3': 5 / 2,
    '4': 6 / 2,
    '5': 7 / 2,
    '6': 8 / 2,
  };
  return multipliers[stage];
}

/**
 * タイプ一致補正 (STAB) を計算
 * 第9世代: テラスタル考慮（ステラ対応含む）
 */
export function calculateStab(
  moveType: PokemonType,
  attackerTypes: PokemonType[],
  attackerTeraType?: TeraType,
  isTerastallized?: boolean,
  attackerAbility?: string,
  isStellarBoostUsed?: boolean
): number {
  const isAdaptability = abilityIs(attackerAbility, ABILITY_ADAPTABILITY);

  if (isTerastallized && attackerTeraType) {
    // ステラテラスタル
    if (attackerTeraType === 'Stellar') {
      if (isStellarBoostUsed) {
        // ブースト使用済み: 元タイプ一致なら通常STAB、不一致は1.0
        return attackerTypes.includes(moveType) ? 1.5 : 1.0;
      }
      // ブースト未使用: 元タイプ一致2.0、不一致1.2（適応力不発）
      return attackerTypes.includes(moveType) ? 2.0 : 1.2;
    }

    // 通常テラスタル
    if (attackerTeraType === moveType) {
      if (attackerTypes.includes(moveType)) {
        return isAdaptability ? 2.25 : 2.0;
      }
      return isAdaptability ? 2.0 : 1.5;
    }
    // テラタイプ不一致だが元タイプ一致 → 通常STAB（適応力不発）
    if (attackerTypes.includes(moveType)) {
      return 1.5;
    }
    return 1.0;
  }

  // 非テラスタル時
  if (attackerTypes.includes(moveType)) {
    return isAdaptability ? 2.0 : 1.5;
  }
  return 1.0;
}

/**
 * 攻撃側の特性による補正を計算
 */
export function calculateAttackerAbilityModifier(
  ability: string | undefined,
  movePower: number,
  moveFlags?: MoveFlags
): number {
  if (!ability) return 1.0;

  // テクニシャン: 威力60以下の技が1.5倍
  if (abilityIs(ability, ABILITY_TECHNICIAN)) {
    return movePower <= 60 ? 1.5 : 1.0;
  }

  // てつのこぶし: パンチ技が1.2倍
  if (abilityIs(ability, ABILITY_IRON_FIST)) {
    return moveFlags?.isPunchMove ? 1.2 : 1.0;
  }

  // すてみ: 反動技が1.2倍
  if (abilityIs(ability, ABILITY_RECKLESS)) {
    return moveFlags?.isRecoilMove ? 1.2 : 1.0;
  }

  // ちからもち / ヨガパワー: 物理攻撃が2倍（実数値に適用済みと想定）
  // 注: この特性は攻撃の実数値に適用されるため、ここでは1.0を返す
  // UI側で攻撃実数値を入力する際に考慮する
  if (abilityIs(ability, ABILITY_HUGE_POWER) || abilityIs(ability, ABILITY_PURE_POWER)) {
    return 1.0;
  }

  return 1.0;
}

/**
 * 防御側の特性による補正を計算
 */
export function calculateDefenderAbilityModifier(
  ability: string | undefined,
  typeEffectiveness: number,
  moveType: PokemonType,
  moveFlags?: MoveFlags,
  currentHp?: number,
  maxHp?: number,
  moveCategory?: 'Physical' | 'Special'
): number {
  if (!ability) return 1.0;

  // マルチスケイル / ファントムガード: HP満タン時ダメージ0.5倍
  if (abilityIs(ability, ABILITY_MULTISCALE) || abilityIs(ability, ABILITY_SHADOW_SHIELD)) {
    if (currentHp && maxHp && currentHp === maxHp) {
      return 0.5;
    }
    return 1.0;
  }

  // ハードロック / フィルター: 効果抜群を0.75倍
  if (abilityIs(ability, ABILITY_SOLID_ROCK) || abilityIs(ability, ABILITY_FILTER)) {
    return typeEffectiveness > 1 ? 0.75 : 1.0;
  }

  // もふもふ: 接触技0.5倍、炎技2倍
  if (abilityIs(ability, ABILITY_FLUFFY)) {
    if (moveFlags?.isContactMove) return 0.5;
    if (moveType === 'Fire') return 2.0;
    return 1.0;
  }

  // あついしぼう: 炎・氷技を0.5倍
  if (abilityIs(ability, ABILITY_THICK_FAT)) {
    return moveType === 'Fire' || moveType === 'Ice' ? 0.5 : 1.0;
  }

  // こおりのりんぷん: 特殊ダメージ0.5倍
  if (abilityIs(ability, ABILITY_ICE_SCALES)) {
    return moveCategory === 'Special' ? 0.5 : 1.0;
  }

  return 1.0;
}

/**
 * 攻撃側の持ち物による補正を計算
 */
export function calculateAttackerItemModifier(
  item: string | undefined,
  moveCategory: 'Physical' | 'Special',
  typeEffectiveness: number,
  moveType: PokemonType
): number {
  if (!item) return 1.0;

  // こだわりハチマキ: 物理攻撃1.5倍
  if (itemIs(item, ITEM_CHOICE_BAND)) {
    return moveCategory === 'Physical' ? 1.5 : 1.0;
  }

  // こだわりメガネ: 特殊攻撃1.5倍
  if (itemIs(item, ITEM_CHOICE_SPECS)) {
    return moveCategory === 'Special' ? 1.5 : 1.0;
  }

  // いのちのたま: 全ての技1.3倍
  if (itemIs(item, ITEM_LIFE_ORB)) {
    return 1.3;
  }

  // たつじんのおび: 効果抜群1.2倍
  if (itemIs(item, ITEM_EXPERT_BELT)) {
    return typeEffectiveness > 1 ? 1.2 : 1.0;
  }

  // ちからのハチマキ: 物理攻撃1.1倍
  if (itemIs(item, ITEM_MUSCLE_BAND)) {
    return moveCategory === 'Physical' ? 1.1 : 1.0;
  }

  // ものしりメガネ: 特殊攻撃1.1倍
  if (itemIs(item, ITEM_WISE_GLASSES)) {
    return moveCategory === 'Special' ? 1.1 : 1.0;
  }

  // ノーマルジュエル: ノーマルタイプ1.3倍（1回のみ）
  if (itemIs(item, ITEM_NORMAL_GEM)) {
    return moveType === 'Normal' ? 1.3 : 1.0;
  }

  // パンチグローブ: パンチ技1.1倍
  // 注: パンチ技かどうかはmoveFlagsで判定する必要がある
  // ここでは簡易的に1.0を返す（後でcalculateDamageで処理）
  if (itemIs(item, ITEM_PUNCHING_GLOVE)) {
    return 1.0;
  }

  return 1.0;
}

/**
 * 防御側の持ち物による補正を計算
 */
export function calculateDefenderItemModifier(
  item: string | undefined,
  _moveCategory: 'Physical' | 'Special'
): number {
  if (!item) return 1.0;

  // しんかのきせき: 防御・特防1.5倍（実数値に適用済みと想定）
  // 注: この持ち物は防御/特防の実数値に適用されるため、ここでは1.0を返す
  // UI側で防御実数値を入力する際に考慮する
  if (itemIs(item, ITEM_EVIOLITE)) {
    return 1.0;
  }

  // とつげきチョッキ: 特防1.5倍（実数値に適用済みと想定）
  // 注: この持ち物は特防の実数値に適用されるため、ここでは1.0を返す
  // UI側で防御実数値を入力する際に考慮する
  if (itemIs(item, ITEM_ASSAULT_VEST)) {
    return 1.0;
  }

  return 1.0;
}

/**
 * 天候補正を計算
 */
export function calculateWeatherModifier(moveType: PokemonType, weather: Weather): number {
  if (weather === 'sun') {
    if (moveType === 'Fire') return 1.5;
    if (moveType === 'Water') return 0.5;
  }
  if (weather === 'rain') {
    if (moveType === 'Water') return 1.5;
    if (moveType === 'Fire') return 0.5;
  }
  return 1.0;
}

/**
 * フィールド補正を計算
 */
export function calculateFieldModifier(moveType: PokemonType, field: Field): number {
  switch (field) {
    case 'electric':
      return moveType === 'Electric' ? 1.3 : 1.0;
    case 'grassy':
      return moveType === 'Grass' ? 1.3 : 1.0;
    case 'psychic':
      return moveType === 'Psychic' ? 1.3 : 1.0;
    case 'misty':
      return moveType === 'Dragon' ? 0.5 : 1.0;
    default:
      return 1.0;
  }
}

// V2 API re-export
export { calculateDamageV2 } from './damage-calc/index';
