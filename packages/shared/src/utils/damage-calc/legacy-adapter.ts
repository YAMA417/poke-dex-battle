import type {
  BattleContext,
  CalcMove,
  CalcPokemon,
  DamageCalculationInput,
  StatStage,
} from "../../types/damage";

/**
 * Convert DamageCalculationInput (legacy format) to new CalcPokemon format
 */
function convertAttacker(input: DamageCalculationInput): CalcPokemon {
  const { moveCategory, attackerLevel, attackerAttack, attackerTypes } = input;

  // 攻撃ステータスをmoveCategoryに応じてマッピング
  const stats = {
    hp: 100, // ダミー値（ダメージ計算には不要）
    atk: moveCategory === "Physical" ? attackerAttack : 100,
    def: 100,
    spa: moveCategory === "Special" ? attackerAttack : 100,
    spd: 100,
    spe: 100,
  };

  // 攻撃側のランク補正を変換
  const boosts = {
    atk:
      moveCategory === "Physical"
        ? (input.condition.attackerStatStages.attack as StatStage)
        : (0 as StatStage),
    def: 0 as StatStage,
    spa:
      moveCategory === "Special"
        ? (input.condition.attackerStatStages.specialAttack as StatStage)
        : (0 as StatStage),
    spd: 0 as StatStage,
    spe: 0 as StatStage,
  };

  return {
    level: attackerLevel,
    types: attackerTypes,
    stats,
    boosts,
    ability: input.condition.attackerAbility,
    item: input.condition.attackerItem,
    status: "none",
    teraType: input.attackerTeraType,
    isTerastallized: input.condition.attackerTerastallized,
  };
}

/**
 * Convert DamageCalculationInput (legacy format) to new CalcPokemon format for defender
 */
function convertDefender(input: DamageCalculationInput): CalcPokemon {
  const { moveCategory, defenderDefense, defenderTypes } = input;

  // 防御ステータスをmoveCategory に応じてマッピング
  const stats = {
    hp: input.defenderMaxHp || 100,
    atk: 100,
    def: moveCategory === "Physical" ? defenderDefense : 100,
    spa: 100,
    spd: moveCategory === "Special" ? defenderDefense : 100,
    spe: 100,
  };

  // 防御側のランク補正を変換
  const boosts = {
    atk: 0 as StatStage,
    def:
      moveCategory === "Physical"
        ? (input.condition.defenderStatStages.defense as StatStage)
        : (0 as StatStage),
    spa: 0 as StatStage,
    spd:
      moveCategory === "Special"
        ? (input.condition.defenderStatStages.specialDefense as StatStage)
        : (0 as StatStage),
    spe: 0 as StatStage,
  };

  return {
    level: 50, // ダミー値（実数値入力なので不要）
    types: defenderTypes,
    stats,
    boosts,
    ability: input.condition.defenderAbility,
    item: input.condition.defenderItem,
    status: "none",
    currentHp: input.defenderCurrentHp,
    maxHp: input.defenderMaxHp || 100,
  };
}

/**
 * Convert DamageCalculationInput (legacy format) to new CalcMove format
 */
function convertMove(input: DamageCalculationInput): CalcMove {
  return {
    name: "",
    power: input.movePower,
    type: input.moveType,
    category: input.moveCategory,
    isCritical: input.condition.isCriticalHit,
    flags: input.moveFlags,
  };
}

/**
 * Convert DamageCalculationInput (legacy format) to new BattleContext format
 */
function convertContext(input: DamageCalculationInput): BattleContext {
  return {
    weather: input.condition.weather,
    field: input.condition.field,
    isDoubleBattle: input.condition.isDoubleBattle,
    isSpreadMove: input.condition.isSpreadMove,
    isHelpingHand: input.condition.isHelpingHand,
    // reflect と lightScreen は旧APIでは未対応のため undefined
    reflect: undefined,
    lightScreen: undefined,
  };
}

/**
 * 旧形式 DamageCalculationInput を新形式に変換
 * 戻り値に attacker, defender, move, context を含む
 */
export function convertLegacyInput(input: DamageCalculationInput) {
  return {
    attacker: convertAttacker(input),
    defender: convertDefender(input),
    move: convertMove(input),
    context: convertContext(input),
  };
}
