'use client';

import { useMemo } from 'react';
import type { Move, MoveData, PokemonSpeciesData } from '@poke-dex-battle/shared';
import { getDuplicateMoveIds } from '@poke-dex-battle/shared';
import { useLearnset, useAllMoves } from '@/hooks/useApiData';
import { toMoveData } from '@/lib/api-adapters';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';
import { POKEMON_TYPE_LABELS_JA } from '@poke-dex-battle/shared';
import { Autocomplete } from '@/components/ui/autocomplete';
import { AlertTriangle } from 'lucide-react';

/**
 * Move slot editor component with search and selection.
 * Manages up to 4 move slots with duplicate detection.
 */

const MOVE_CAT_ICON: Record<string, string> = { Physical: '⚔️', Special: '🔮', Status: '💤' };

interface MoveSlotEditorProps {
  moves: Move[];
  species: PokemonSpeciesData;
  onChange: (moves: Move[]) => void;
}

export function MoveSlotEditor({ moves, species, onChange }: MoveSlotEditorProps) {
  // DB の pokemon.id をそのまま使用（ハイフン含む: "calyrex-shadow-rider" 等）
  const pokemonId = species.name;
  const { data: learnsetData } = useLearnset(pokemonId);
  const { data: allMovesRaw } = useAllMoves();

  // 全技の id→MoveData マップ
  const moveByIdMap = useMemo(() => {
    if (!allMovesRaw) return new Map<string, MoveData>();
    const map = new Map<string, MoveData>();
    for (const row of allMovesRaw) {
      const md = toMoveData(row);
      if (md) map.set(row.id, md);
    }
    return map;
  }, [allMovesRaw]);

  // 全技の name→MoveData マップ（表示名逆引き用）
  const moveByNameMap = useMemo(() => {
    if (!allMovesRaw) return new Map<string, MoveData>();
    const map = new Map<string, MoveData>();
    for (const row of allMovesRaw) {
      const md = toMoveData(row);
      if (md) {
        map.set(md.name, md);
        map.set(md.nameJa, md);
      }
    }
    return map;
  }, [allMovesRaw]);

  // learnset の技IDリストから MoveData 配列を構築
  const learnset = useMemo<MoveData[]>(() => {
    if (!learnsetData || moveByIdMap.size === 0) return [];
    const allMoveIds = [
      ...new Set([...(learnsetData.level ?? []), ...(learnsetData.machine ?? [])]),
    ];
    return allMoveIds.map((id) => moveByIdMap.get(id)).filter((m): m is MoveData => m != null);
  }, [learnsetData, moveByIdMap]);

  const dupMoveIds = getDuplicateMoveIds(moves);

  // learnset を Autocomplete の options 形式に変換
  const learnsetOptions = useMemo(
    () =>
      learnset.map((m) => ({
        label: m.nameJa,
        value: m.id.toString(),
        id: m.id,
      })),
    [learnset]
  );

  function selectMoveById(slot: number, moveIdStr: string) {
    const md = learnset.find((m) => m.id.toString() === moveIdStr);
    if (!md) return;
    selectMove(slot, md);
  }

  function selectMove(slot: number, md: MoveData) {
    const newMoves = [...moves];
    const move: Move = {
      id: md.id,
      name: md.name,
      nameJa: md.nameJa,
      type: md.type,
      category: md.category,
      power: md.power ?? undefined,
      accuracy: md.accuracy ?? undefined,
      pp: md.pp,
    };
    newMoves[slot] = move;
    onChange(newMoves);
  }

  function clearMove(slot: number) {
    const newMoves = [...moves];
    newMoves.splice(slot, 1);
    onChange(newMoves);
  }

  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((slot) => {
        const move = moves[slot];
        const isDup = move && dupMoveIds.has(move.id);
        return (
          <div key={slot} className="relative">
            {move ? (
              <div
                className={`flex items-center gap-2 rounded-lg border p-2 ${isDup ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}
              >
                <span className="text-xs">{MOVE_CAT_ICON[move.category]}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white ${POKEMON_TYPE_COLORS[move.type]}`}
                >
                  {POKEMON_TYPE_LABELS_JA[move.type] ?? move.type}
                </span>
                <span className="flex-1 text-sm font-semibold text-gray-800">
                  {moveByNameMap.get(move.name)?.nameJa ?? move.name}
                </span>
                {move.power && <span className="text-xs text-gray-400">威力{move.power}</span>}
                {isDup && <AlertTriangle size={14} className="text-amber-500" />}
                <button
                  type="button"
                  onClick={() => clearMove(slot)}
                  className="text-lg leading-none text-gray-300 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ) : (
              <Autocomplete
                options={learnsetOptions}
                onSelect={(value) => selectMoveById(slot, value)}
                placeholder={`技スロット ${slot + 1}（クリックで一覧表示）`}
                className="rounded-lg border-dashed text-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
