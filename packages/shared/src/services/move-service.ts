import type { MoveData, ShowdownLearnsetEntry, ShowdownMove, ShowdownSpecies } from '../types';

const movesById: Record<string, ShowdownMove> = require('../data/showdown/moves.json');

const learnsetsData: Record<
  string,
  ShowdownLearnsetEntry
> = require('../data/showdown/learnsets.json');

const speciesById: Record<string, ShowdownSpecies> = require('../data/showdown/species.json');

// ルックアップ用 Map を構築
const movesByName = new Map<string, ShowdownMove>();
const movesByJaName = new Map<string, ShowdownMove>();

for (const move of Object.values(movesById)) {
  movesByName.set(move.name.toLowerCase(), move);
  movesByJaName.set(move.nameJa, move);
}

/**
 * ShowdownMove → MoveData に変換
 */
function transformToMoveData(move: ShowdownMove): MoveData {
  return {
    id: move.num,
    name: move.name,
    nameJa: move.nameJa,
    type: move.type,
    category: move.category,
    power: move.basePower || null,
    accuracy: move.accuracy === true ? null : move.accuracy,
    pp: move.pp,
    priority: move.priority,
    target: move.target,
    shortDesc: move.shortDesc || undefined,
  };
}

/**
 * 技名またはIDから技を検索
 */
function findMove(query: string): ShowdownMove | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // ID（Showdown形式）で検索
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byId = movesById[normalized];
  if (byId) return byId;

  // 英語名で検索
  const byName = movesByName.get(trimmed.toLowerCase());
  if (byName) return byName;

  // 日本語名で検索
  const byJa = movesByJaName.get(trimmed);
  if (byJa) return byJa;

  return null;
}

/**
 * 技名またはIDから技データを取得
 */
export function getMoveByName(name: string): MoveData | null {
  const move = findMove(name);
  if (!move) return null;
  return transformToMoveData(move);
}

/**
 * ポケモン名（日本語 or 英語）からShowdown IDを解決
 */
function resolveSpeciesId(pokemonName: string): string | null {
  const trimmed = pokemonName.trim();
  if (!trimmed) return null;

  // Showdown ID で直接ヒット
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (speciesById[normalized]) return normalized;

  // 日本語名 or 英語名から検索
  for (const species of Object.values(speciesById)) {
    if (species.nameJa === trimmed || species.name.toLowerCase() === trimmed.toLowerCase()) {
      return species.id;
    }
  }

  return null;
}

/**
 * フォーム違いの場合、ベースフォームのIDを取得
 * 例: zamazentacrowned → zamazenta
 */
function resolveBaseSpeciesId(speciesId: string): string | null {
  const species = speciesById[speciesId];
  if (!species) return null;

  // num が同じでIDが異なるベースフォームを探す
  for (const [id, s] of Object.entries(speciesById)) {
    if (s.num === species.num && id !== speciesId && id.length < speciesId.length) {
      return id;
    }
  }
  return null;
}

/**
 * フォーム + ベースフォームの learnset を合成して返す
 */
function getMergedLearnset(speciesId: string): ShowdownLearnsetEntry | null {
  const entry = learnsetsData[speciesId];
  const baseId = resolveBaseSpeciesId(speciesId);
  const baseEntry = baseId ? learnsetsData[baseId] : null;

  if (!entry && !baseEntry) return null;
  if (!baseEntry) return entry;
  if (!entry) return baseEntry;

  // フォーム固有の技 + ベースフォームの技を合成
  return {
    level: [...new Set([...entry.level, ...baseEntry.level])],
    machine: [...new Set([...entry.machine, ...baseEntry.machine])],
  };
}

/**
 * ポケモン別の習得技一覧を取得（レベル技 + わざマシン）
 */
export function getLearnset(pokemonName: string): string[] {
  const speciesId = resolveSpeciesId(pokemonName);
  if (!speciesId) return [];
  const entry = getMergedLearnset(speciesId);
  if (!entry) return [];
  return [...new Set([...entry.level, ...entry.machine])];
}

/**
 * ポケモン別のレベル技一覧を取得
 */
export function getLevelMoves(pokemonName: string): string[] {
  const speciesId = resolveSpeciesId(pokemonName);
  if (!speciesId) return [];
  return getMergedLearnset(speciesId)?.level ?? [];
}

/**
 * ポケモン別のわざマシン技一覧を取得
 */
export function getMachineMoves(pokemonName: string): string[] {
  const speciesId = resolveSpeciesId(pokemonName);
  if (!speciesId) return [];
  return getMergedLearnset(speciesId)?.machine ?? [];
}

/**
 * 全技データを取得
 */
export function getAllMoves(): ReadonlyArray<ShowdownMove> {
  return Object.values(movesById);
}

/**
 * 全技の名前一覧を取得
 */
export function getAllMoveNames(): Array<{
  id: string;
  name: string;
  nameJa: string;
}> {
  return Object.values(movesById).map((move) => ({
    id: move.id,
    name: move.name,
    nameJa: move.nameJa,
  }));
}
