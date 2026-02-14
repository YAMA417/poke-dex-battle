import type { MoveData, ShowdownMove } from "../types";

const movesById: Record<string, ShowdownMove> =
  require("../data/showdown/moves.json");

const learnsetsData: Record<string, string[]> =
  require("../data/showdown/learnsets.json");

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
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
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
 * ポケモン別の習得技一覧を取得
 */
export function getLearnset(pokemonName: string): string[] {
  const normalized = pokemonName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return learnsetsData[normalized] ?? [];
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
