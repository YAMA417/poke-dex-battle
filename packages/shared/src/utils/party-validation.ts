import type { Stats, Move } from '../types/pokemon';
import { MAX_EV_TOTAL, MAX_EV_PER_STAT } from '../types/party';

/** バリデーション結果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 努力値の合計・各ステータス上限をバリデーション
 */
export function validateEvs(evs: Stats): ValidationResult {
  const errors: string[] = [];

  const total =
    evs.hp + evs.attack + evs.defense + evs.specialAttack + evs.specialDefense + evs.speed;

  if (total > MAX_EV_TOTAL) {
    errors.push(`努力値の合計が上限（${MAX_EV_TOTAL}）を超えています（現在: ${total}）`);
  }

  const statLabels: { key: keyof Stats; label: string }[] = [
    { key: 'hp', label: 'HP' },
    { key: 'attack', label: '攻撃' },
    { key: 'defense', label: '防御' },
    { key: 'specialAttack', label: '特攻' },
    { key: 'specialDefense', label: '特防' },
    { key: 'speed', label: '素早さ' },
  ];

  for (const { key, label } of statLabels) {
    if (evs[key] < 0) {
      errors.push(`${label}の努力値は0以上である必要があります`);
    }
    if (evs[key] > MAX_EV_PER_STAT) {
      errors.push(`${label}の努力値が上限（${MAX_EV_PER_STAT}）を超えています`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * EV合計を計算するユーティリティ
 */
export function calcEvTotal(evs: Stats): number {
  return evs.hp + evs.attack + evs.defense + evs.specialAttack + evs.specialDefense + evs.speed;
}

/**
 * 残りEVポイントを計算
 */
export function calcEvRemaining(evs: Stats): number {
  return MAX_EV_TOTAL - calcEvTotal(evs);
}

/**
 * 特定ステータスのEVをクランプして返す（合計510制限を考慮）
 */
export function clampEv(currentEvs: Stats, targetStat: keyof Stats, newValue: number): number {
  const clampedToStat = Math.max(0, Math.min(MAX_EV_PER_STAT, newValue));
  const otherTotal = calcEvTotal(currentEvs) - currentEvs[targetStat];
  const maxForStat = Math.min(MAX_EV_PER_STAT, MAX_EV_TOTAL - otherTotal);
  return Math.min(clampedToStat, Math.max(0, maxForStat));
}

/**
 * 技の重複チェック（同じ技IDが複数ある場合 true）
 */
export function checkMoveDuplicates(moves: Move[]): boolean {
  const validMoves = moves.filter((m) => m.id > 0);
  const ids = validMoves.map((m) => m.id);
  return new Set(ids).size !== ids.length;
}

/**
 * 重複している技のIDセットを返す
 */
export function getDuplicateMoveIds(moves: Move[]): Set<number> {
  const validMoves = moves.filter((m) => m.id > 0);
  const idCount = new Map<number, number>();
  for (const m of validMoves) {
    idCount.set(m.id, (idCount.get(m.id) ?? 0) + 1);
  }
  const duplicates = new Set<number>();
  for (const [id, count] of idCount) {
    if (count > 1) duplicates.add(id);
  }
  return duplicates;
}

/**
 * JSONインポート時の基本バリデーション
 * 最低限のスキーマ検証のみ実施
 */
export function validatePartyImport(json: unknown): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(json)) {
    errors.push('インポートデータはパーティの配列である必要があります');
    return { valid: false, errors };
  }

  json.forEach((item, i) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`[${i}] パーティデータの形式が不正です`);
      return;
    }
    const party = item as Record<string, unknown>;
    if (typeof party['name'] !== 'string' || party['name'].trim() === '') {
      errors.push(`[${i}] パーティ名が不正です`);
    }
    if (!Array.isArray(party['pokemons'])) {
      errors.push(`[${i}] ポケモンリストが不正です`);
    }
  });

  return { valid: errors.length === 0, errors };
}
