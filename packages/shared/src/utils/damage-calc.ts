import type { Field, MoveFlags, StatStage, Weather } from '../types/damage';
import type { PokemonType } from '../types/pokemon';
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
 * 第9世代: テラスタル考慮
 */
export function calculateStab(
  moveType: PokemonType,
  attackerTypes: PokemonType[],
  attackerTeraType?: PokemonType,
  isTerastallized?: boolean,
  attackerAbility?: string
): number {
  const isAdaptability = abilityIs(attackerAbility, 'Adaptability');

  // テラスタル使用時
  if (isTerastallized && attackerTeraType) {
    // テラスタイプと技タイプが一致
    if (attackerTeraType === moveType) {
      // 元のタイプにも含まれていた場合: 通常2.0倍、適応力2.25倍
      if (attackerTypes.includes(moveType)) {
        return isAdaptability ? 2.25 : 2.0;
      }
      // 元のタイプと不一致: 通常1.5倍、適応力2.0倍
      return isAdaptability ? 2.0 : 1.5;
    }
    // テラスタイプと不一致の場合は補正なし
    return 1.0;
  }

  // 通常時: 元のタイプと一致すれば 通常1.5倍、適応力2.0倍
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
  if (abilityIs(ability, 'Technician')) {
    return movePower <= 60 ? 1.5 : 1.0;
  }

  // てつのこぶし: パンチ技が1.2倍
  if (abilityIs(ability, 'Iron Fist')) {
    return moveFlags?.isPunchMove ? 1.2 : 1.0;
  }

  // すてみ: 反動技が1.2倍
  if (abilityIs(ability, 'Reckless')) {
    return moveFlags?.isRecoilMove ? 1.2 : 1.0;
  }

  // ちからもち / ヨガパワー: 物理攻撃が2倍（実数値に適用済みと想定）
  // 注: この特性は攻撃の実数値に適用されるため、ここでは1.0を返す
  // UI側で攻撃実数値を入力する際に考慮する
  if (abilityIs(ability, 'Huge Power') || abilityIs(ability, 'Pure Power')) {
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
  if (abilityIs(ability, 'Multiscale') || abilityIs(ability, 'Shadow Shield')) {
    if (currentHp && maxHp && currentHp === maxHp) {
      return 0.5;
    }
    return 1.0;
  }

  // ハードロック / フィルター: 効果抜群を0.75倍
  if (abilityIs(ability, 'Solid Rock') || abilityIs(ability, 'Filter')) {
    return typeEffectiveness > 1 ? 0.75 : 1.0;
  }

  // もふもふ: 接触技0.5倍、炎技2倍
  if (abilityIs(ability, 'Fluffy')) {
    if (moveFlags?.isContactMove) return 0.5;
    if (moveType === 'Fire') return 2.0;
    return 1.0;
  }

  // あついしぼう: 炎・氷技を0.5倍
  if (abilityIs(ability, 'Thick Fat')) {
    return moveType === 'Fire' || moveType === 'Ice' ? 0.5 : 1.0;
  }

  // こおりのりんぷん: 特殊ダメージ0.5倍
  if (abilityIs(ability, 'Ice Scales')) {
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
  if (itemIs(item, 'Choice Band')) {
    return moveCategory === 'Physical' ? 1.5 : 1.0;
  }

  // こだわりメガネ: 特殊攻撃1.5倍
  if (itemIs(item, 'Choice Specs')) {
    return moveCategory === 'Special' ? 1.5 : 1.0;
  }

  // いのちのたま: 全ての技1.3倍
  if (itemIs(item, 'Life Orb')) {
    return 1.3;
  }

  // たつじんのおび: 効果抜群1.2倍
  if (itemIs(item, 'Expert Belt')) {
    return typeEffectiveness > 1 ? 1.2 : 1.0;
  }

  // ちからのハチマキ: 物理攻撃1.1倍
  if (itemIs(item, 'Muscle Band')) {
    return moveCategory === 'Physical' ? 1.1 : 1.0;
  }

  // ものしりメガネ: 特殊攻撃1.1倍
  if (itemIs(item, 'Wise Glasses')) {
    return moveCategory === 'Special' ? 1.1 : 1.0;
  }

  // ノーマルジュエル: ノーマルタイプ1.3倍（1回のみ）
  if (itemIs(item, 'Normal Gem')) {
    return moveType === 'Normal' ? 1.3 : 1.0;
  }

  // パンチグローブ: パンチ技1.1倍
  // 注: パンチ技かどうかはmoveFlagsで判定する必要がある
  // ここでは簡易的に1.0を返す（後でcalculateDamageで処理）
  if (itemIs(item, 'Punching Glove')) {
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
  if (itemIs(item, 'Eviolite')) {
    return 1.0;
  }

  // とつげきチョッキ: 特防1.5倍（実数値に適用済みと想定）
  // 注: この持ち物は特防の実数値に適用されるため、ここでは1.0を返す
  // UI側で防御実数値を入力する際に考慮する
  if (itemIs(item, 'Assault Vest')) {
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
