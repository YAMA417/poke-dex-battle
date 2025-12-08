import { calcTypeEffectiveness } from "../constants/types";
import type {
  DamageCalculationInput,
  DamageResult,
  MoveFlags,
  StatStage,
  Weather,
} from "../types/damage";
import type { PokemonType } from "../types/pokemon";

/**
 * Pokemon-style rounding: round to nearest integer, rounding DOWN at 0.5
 * 第5世代以降のダメージ計算で使用される丸め処理
 * 例: 142.5 → 142, 142.6 → 143, 142.4 → 142
 */
function pokeRound(value: number): number {
  const decimal = value - Math.floor(value);
  if (decimal < 0.5) {
    return Math.floor(value);
  } else if (decimal > 0.5) {
    return Math.ceil(value);
  } else {
    // Exactly 0.5: round down
    return Math.floor(value);
  }
}

/**
 * 能力ランクから補正倍率を取得
 * ランク補正: https://wiki.xn--rckteqa2e.com/wiki/%E8%83%BD%E5%8A%9B%E5%A4%89%E5%8C%96
 */
export function getStatStageMultiplier(stage: StatStage): number {
  const multipliers: Record<StatStage, number> = {
    "-6": 2 / 8,
    "-5": 2 / 7,
    "-4": 2 / 6,
    "-3": 2 / 5,
    "-2": 2 / 4,
    "-1": 2 / 3,
    "0": 2 / 2,
    "1": 3 / 2,
    "2": 4 / 2,
    "3": 5 / 2,
    "4": 6 / 2,
    "5": 7 / 2,
    "6": 8 / 2,
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
  isTerastallized?: boolean
): number {
  // テラスタル使用時
  if (isTerastallized && attackerTeraType) {
    // テラスタイプと技タイプが一致
    if (attackerTeraType === moveType) {
      // 元のタイプにも含まれていた場合は2.0倍、そうでなければ1.5倍
      return attackerTypes.includes(moveType) ? 2.0 : 1.5;
    }
    // テラスタイプと不一致の場合は補正なし
    return 1.0;
  }

  // 通常時: 元のタイプと一致すれば1.5倍
  return attackerTypes.includes(moveType) ? 1.5 : 1.0;
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

  switch (ability) {
    case "Technician": // テクニシャン: 威力60以下の技が1.5倍
      return movePower <= 60 ? 1.5 : 1.0;

    case "Iron Fist": // てつのこぶし: パンチ技が1.2倍
      return moveFlags?.isPunchMove ? 1.2 : 1.0;

    case "Reckless": // すてみ: 反動技が1.2倍
      return moveFlags?.isRecoilMove ? 1.2 : 1.0;

    case "Huge Power": // ちからもち: 物理攻撃が2倍（実数値に適用済みと想定）
    case "Pure Power": // ヨガパワー: 物理攻撃が2倍（実数値に適用済みと想定）
      // 注: この特性は攻撃の実数値に適用されるため、ここでは1.0を返す
      // UI側で攻撃実数値を入力する際に考慮する
      return 1.0;

    default:
      return 1.0;
  }
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
  maxHp?: number
): number {
  if (!ability) return 1.0;

  switch (ability) {
    case "Multiscale": // マルチスケイル: HP満タン時ダメージ0.5倍
      if (currentHp && maxHp && currentHp === maxHp) {
        return 0.5;
      }
      return 1.0;

    case "Solid Rock": // ハードロック: 効果抜群を0.75倍
    case "Filter": // フィルター: 効果抜群を0.75倍
      return typeEffectiveness > 1 ? 0.75 : 1.0;

    case "Fluffy": // もふもふ: 接触技0.5倍、炎技2倍
      if (moveFlags?.isContactMove) return 0.5;
      if (moveType === "Fire") return 2.0;
      return 1.0;

    case "Thick Fat": // あついしぼう: 炎・氷技を0.5倍
      return moveType === "Fire" || moveType === "Ice" ? 0.5 : 1.0;

    default:
      return 1.0;
  }
}

/**
 * 攻撃側の持ち物による補正を計算
 */
export function calculateAttackerItemModifier(
  item: string | undefined,
  moveCategory: "Physical" | "Special",
  typeEffectiveness: number,
  moveType: PokemonType
): number {
  if (!item) return 1.0;

  switch (item) {
    case "Choice Band": // こだわりハチマキ: 物理攻撃1.5倍
      return moveCategory === "Physical" ? 1.5 : 1.0;

    case "Choice Specs": // こだわりメガネ: 特殊攻撃1.5倍
      return moveCategory === "Special" ? 1.5 : 1.0;

    case "Life Orb": // いのちのたま: 全ての技1.3倍
      return 1.3;

    case "Expert Belt": // たつじんのおび: 効果抜群1.2倍
      return typeEffectiveness > 1 ? 1.2 : 1.0;

    case "Muscle Band": // ちからのハチマキ: 物理攻撃1.1倍
      return moveCategory === "Physical" ? 1.1 : 1.0;

    case "Wise Glasses": // ものしりメガネ: 特殊攻撃1.1倍
      return moveCategory === "Special" ? 1.1 : 1.0;

    case "Normal Gem": // ノーマルジュエル: ノーマルタイプ1.3倍（1回のみ）
      return moveType === "Normal" ? 1.3 : 1.0;

    case "Punching Glove": // パンチグローブ: パンチ技1.1倍
      // 注: パンチ技かどうかはmoveFlagsで判定する必要がある
      // ここでは簡易的に1.0を返す（後でcalculateDamageで処理）
      return 1.0;

    default:
      return 1.0;
  }
}

/**
 * 防御側の持ち物による補正を計算
 */
export function calculateDefenderItemModifier(
  item: string | undefined,
  moveCategory: "Physical" | "Special"
): number {
  if (!item) return 1.0;

  switch (item) {
    case "Eviolite": // しんかのきせき: 防御・特防1.5倍（実数値に適用済みと想定）
      // 注: この持ち物は防御/特防の実数値に適用されるため、ここでは1.0を返す
      // UI側で防御実数値を入力する際に考慮する
      return 1.0;

    case "Assault Vest": // とつげきチョッキ: 特防1.5倍（実数値に適用済みと想定）
      // 注: この持ち物は特防の実数値に適用されるため、ここでは1.0を返す
      // UI側で防御実数値を入力する際に考慮する
      return 1.0;

    default:
      return 1.0;
  }
}

/**
 * 天候補正を計算
 */
export function calculateWeatherModifier(
  moveType: PokemonType,
  weather: Weather
): number {
  if (weather === "sun") {
    if (moveType === "Fire") return 1.5;
    if (moveType === "Water") return 0.5;
  }
  if (weather === "rain") {
    if (moveType === "Water") return 1.5;
    if (moveType === "Fire") return 0.5;
  }
  return 1.0;
}

/**
 * "other"補正チェーンを適用（特性・持ち物など）
 * shadowtag.xyzと同じ方式: 4096ベースで補正を連鎖させてから最後にダメージに適用
 * 参考: https://shadowtag.xyz/
 */
function applyOtherModifiers(baseDamage: number, modifiers: number[]): number {
  const INIT_VAL = 4096;
  let chain = INIT_VAL;

  // 補正を4096ベースで連鎖させる
  for (const modifier of modifiers) {
    if (modifier !== 1.0) {
      const modifier4096 = Math.floor(modifier * INIT_VAL);
      chain = Math.round((chain * modifier4096) / INIT_VAL);
    }
  }

  // 最後に五捨五超入で適用
  return pokeRound((baseDamage * chain) / INIT_VAL);
}

/**
 * 基本ダメージを計算（乱数・その他補正を除く）
 */
export function calculateBaseDamage(input: DamageCalculationInput): number {
  const {
    movePower,
    attackerLevel,
    attackerAttack,
    defenderDefense,
    moveCategory,
    condition,
    moveType,
    moveFlags,
  } = input;

  // タイプ相性（威力補正で使用）
  const typeEffectiveness = calcTypeEffectiveness(moveType, input.defenderTypes);

  // ===================
  // 【1】威力補正を適用
  // ===================
  let finalPower = movePower;

  // てだすけ: 技の威力を1.5倍
  if (condition.isHelpingHand) {
    finalPower = Math.floor(finalPower * 1.5);
  }

  // テクニシャン: 威力60以下の技が1.5倍
  if (condition.attackerAbility === "Technician" && movePower <= 60) {
    finalPower = Math.floor(finalPower * 1.5);
  }

  // てつのこぶし: パンチ技が1.2倍
  if (condition.attackerAbility === "Iron Fist" && moveFlags?.isPunchMove) {
    finalPower = Math.floor(finalPower * 1.2);
  }

  // すてみ: 反動技が1.2倍
  if (condition.attackerAbility === "Reckless" && moveFlags?.isRecoilMove) {
    finalPower = Math.floor(finalPower * 1.2);
  }

  // たつじんのおび: 効果抜群で1.2倍
  if (condition.attackerItem === "Expert Belt" && typeEffectiveness > 1) {
    finalPower = Math.floor(finalPower * 1.2);
  }

  // ノーマルジュエル: ノーマルタイプ1.3倍
  if (condition.attackerItem === "Normal Gem" && moveType === "Normal") {
    finalPower = Math.floor(finalPower * 1.3);
  }

  // パンチグローブ: パンチ技1.1倍
  if (condition.attackerItem === "Punching Glove" && moveFlags?.isPunchMove) {
    finalPower = Math.floor(finalPower * 1.1);
  }

  // ===================
  // 【2】攻撃補正を適用
  // ===================
  let finalAttack = attackerAttack;

  // 能力ランク補正
  const attackStage =
    moveCategory === "Physical"
      ? condition.attackerStatStages.attack
      : condition.attackerStatStages.specialAttack;

  const attackMultiplier = getStatStageMultiplier(attackStage);
  const effectiveAttack = Math.floor(finalAttack * attackMultiplier);

  // 急所の場合は能力ダウンを無視
  finalAttack =
    condition.isCriticalHit && attackStage < 0
      ? finalAttack
      : effectiveAttack;

  // こだわりハチマキ/メガネ: 攻撃を1.5倍
  if (
    (condition.attackerItem === "Choice Band" && moveCategory === "Physical") ||
    (condition.attackerItem === "Choice Specs" && moveCategory === "Special")
  ) {
    finalAttack = Math.floor(finalAttack * 1.5);
  }

  // ちからのハチマキ/ものしりメガネ: 攻撃を1.1倍
  if (
    (condition.attackerItem === "Muscle Band" && moveCategory === "Physical") ||
    (condition.attackerItem === "Wise Glasses" && moveCategory === "Special")
  ) {
    finalAttack = Math.floor(finalAttack * 1.1);
  }

  // ===================
  // 【3】防御補正を適用
  // ===================
  let finalDefense = defenderDefense;

  const defenseStage =
    moveCategory === "Physical"
      ? condition.defenderStatStages.defense
      : condition.defenderStatStages.specialDefense;

  const defenseMultiplier = getStatStageMultiplier(defenseStage);
  const effectiveDefense = Math.floor(finalDefense * defenseMultiplier);

  // 急所の場合は能力アップを無視
  finalDefense =
    condition.isCriticalHit && defenseStage > 0
      ? finalDefense
      : effectiveDefense;

  // ===================
  // 【4】ダメージ計算式
  // ===================
  // ((レベル × 2 ÷ 5 + 2) × 技威力 × 攻撃 ÷ 防御) ÷ 50 + 2
  const levelFactor = Math.floor((attackerLevel * 2) / 5) + 2;
  const damage = Math.floor(
    Math.floor(
      Math.floor((levelFactor * finalPower * finalAttack) / finalDefense) / 50
    ) + 2
  );

  return damage;
}

/**
 * 全補正を適用してダメージを計算
 */
export function calculateDamage(input: DamageCalculationInput): DamageResult {
  const baseDamage = calculateBaseDamage(input);

  // タイプ一致補正
  const stab = calculateStab(
    input.moveType,
    input.attackerTypes,
    input.attackerTeraType,
    input.condition.attackerTerastallized
  );

  // タイプ相性
  const typeEffectiveness = calcTypeEffectiveness(
    input.moveType,
    input.defenderTypes
  );

  // 天候補正
  const weatherModifier = calculateWeatherModifier(
    input.moveType,
    input.condition.weather
  );

  // 急所補正
  const criticalModifier = input.condition.isCriticalHit ? 1.5 : 1.0;

  // ダメージ補正のみ（威力・攻撃補正はcalculateBaseDamageで適用済み）

  // いのちのたま: ダメージ補正
  let lifeOrbModifier = 1.0;
  if (input.condition.attackerItem === "Life Orb") {
    lifeOrbModifier = 1.3;
  }

  // 防御側の特性によるダメージ補正
  const defenderAbilityModifier = calculateDefenderAbilityModifier(
    input.condition.defenderAbility,
    typeEffectiveness,
    input.moveType,
    input.moveFlags,
    input.defenderCurrentHp,
    input.defenderMaxHp
  );

  // 防御側の持ち物によるダメージ補正
  const defenderItemModifier = calculateDefenderItemModifier(
    input.condition.defenderItem,
    input.moveCategory
  );

  // ダブルバトル補正（全体技は0.75倍）
  const spreadModifier =
    input.condition.isDoubleBattle && input.condition.isSpreadMove ? 0.75 : 1.0;

  // 【正しいダメージ計算順序】
  // 第5世代以降の公式: base × Targets × Weather × Critical × random × STAB × Type × other
  // 参考: https://bulbapedia.bulbagarden.net/wiki/Damage

  let minDamage = baseDamage;
  let maxDamage = baseDamage;

  // 1. Targets (全体技補正) - BEFORE random
  minDamage = Math.floor(minDamage * spreadModifier);
  maxDamage = Math.floor(maxDamage * spreadModifier);

  // 2. Weather (天候補正) - BEFORE random
  minDamage = Math.floor(minDamage * weatherModifier);
  maxDamage = Math.floor(maxDamage * weatherModifier);

  // 3. Critical (急所補正) - BEFORE random
  minDamage = Math.floor(minDamage * criticalModifier);
  maxDamage = Math.floor(maxDamage * criticalModifier);

  // 4. Random (乱数: 0.85〜1.00) - ここで最小/最大が分岐
  minDamage = Math.floor(minDamage * 0.85);
  maxDamage = Math.floor(maxDamage * 1.0);

  // 5. STAB (タイプ一致補正) - AFTER random
  minDamage = Math.floor(minDamage * stab);
  maxDamage = Math.floor(maxDamage * stab);

  // 6. Type (タイプ相性) - AFTER random
  minDamage = Math.floor(minDamage * typeEffectiveness);
  maxDamage = Math.floor(maxDamage * typeEffectiveness);

  // 7. "other" modifiers (ダメージ補正のみ) - AFTER Type
  // 威力・攻撃補正はすでにcalculateBaseDamageで適用済み
  const otherModifiers = [
    lifeOrbModifier,
    defenderAbilityModifier,
    defenderItemModifier,
  ];
  minDamage = applyOtherModifiers(minDamage, otherModifiers);
  maxDamage = applyOtherModifiers(maxDamage, otherModifiers);

  // 防御側のHPを仮定（後でUI側で上書き可能）
  const defenderHp = input.defenderMaxHp || 100; // ダミー値

  return {
    minDamage,
    maxDamage,
    minPercent: Math.round((minDamage / defenderHp) * 100 * 10) / 10,
    maxPercent: Math.round((maxDamage / defenderHp) * 100 * 10) / 10,
    guaranteed: maxDamage > 0 ? Math.ceil(defenderHp / maxDamage) : Infinity,
    possible: minDamage > 0 ? Math.ceil(defenderHp / minDamage) : Infinity,
    details: {
      baseDamage,
      typeEffectiveness,
      stab,
      weatherModifier,
      criticalModifier,
      randomModifier: [0.85, 1.0],
    },
  };
}
