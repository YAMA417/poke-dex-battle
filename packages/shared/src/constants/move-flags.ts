import type { MoveFlags } from '../types/damage';
import { normalizeId, normalizedSetHas } from '../utils/normalize-id';

/** キバ技一覧（がんじょうあご対象） */
export const BITE_MOVES: Set<string> = new Set(
  [
    'Bite',
    'Crunch',
    'Fire Fang',
    'Ice Fang',
    'Thunder Fang',
    'Poison Fang',
    'Psychic Fangs',
    'Hyper Fang',
    'Fishious Rend',
    'Jaw Lock',
  ].map(normalizeId)
);

/** 波動技一覧（メガランチャー対象） */
export const AURA_MOVES: Set<string> = new Set(
  [
    'Aura Sphere',
    'Dark Pulse',
    'Dragon Pulse',
    'Heal Pulse',
    'Water Pulse',
    'Origin Pulse',
    'Terrain Pulse',
  ].map(normalizeId)
);

/** パンチ技一覧（てつのこぶし・パンチグローブ対象） */
export const PUNCH_MOVES: Set<string> = new Set(
  [
    'Bullet Punch',
    'Comet Punch',
    'Dizzy Punch',
    'Drain Punch',
    'Dynamic Punch',
    'Fire Punch',
    'Focus Punch',
    'Hammer Arm',
    'Ice Punch',
    'Mach Punch',
    'Mega Punch',
    'Meteor Mash',
    'Power-Up Punch',
    'Shadow Punch',
    'Sky Uppercut',
    'Thunder Punch',
    'Wicked Blow',
    'Surging Strikes',
    'Rage Fist',
    'Jet Punch',
  ].map(normalizeId)
);

/** 攻撃側の防御で計算する技（ボディプレス） */
export const USES_DEFENSE_AS_ATTACK_MOVES: Set<string> = new Set(['Body Press'].map(normalizeId));

/** 特殊技だが防御側の物理防御で計算する技 */
export const TARGETS_PHYSICAL_DEFENSE_MOVES: Set<string> = new Set(
  ['Psyshock', 'Psystrike', 'Secret Sword'].map(normalizeId)
);

/** 防御側の攻撃で計算する技（イカサマ） */
export const USES_TARGET_ATTACK_MOVES: Set<string> = new Set(['Foul Play'].map(normalizeId));

/** 反動技一覧（すてみ対象） */
export const RECOIL_MOVES: Set<string> = new Set(
  [
    'Brave Bird',
    'Double-Edge',
    'Flare Blitz',
    'Head Charge',
    'Head Smash',
    'High Jump Kick',
    'Jump Kick',
    'Light of Ruin',
    'Submission',
    'Take Down',
    'Volt Tackle',
    'Wild Charge',
    'Wood Hammer',
    'Wave Crash',
  ].map(normalizeId)
);

/**
 * 技名からフラグを自動判定する
 *
 * @param moveName - 技の英語名
 * @param shortDesc - Showdownデータの短縮説明（追加効果判定用）
 * @returns MoveFlags
 */
export function getMoveFlags(moveName: string, shortDesc?: string): MoveFlags {
  return {
    isPunchMove: normalizedSetHas(PUNCH_MOVES, moveName),
    isRecoilMove: normalizedSetHas(RECOIL_MOVES, moveName),
    isBiteMove: normalizedSetHas(BITE_MOVES, moveName),
    isAuraMove: normalizedSetHas(AURA_MOVES, moveName),
    hasSecondaryEffect: shortDesc?.includes('% chance') ?? false,
    usesDefenseAsAttack: normalizedSetHas(USES_DEFENSE_AS_ATTACK_MOVES, moveName),
    targetsPhysicalDefense: normalizedSetHas(TARGETS_PHYSICAL_DEFENSE_MOVES, moveName),
    usesTargetAttack: normalizedSetHas(USES_TARGET_ATTACK_MOVES, moveName),
  };
}
