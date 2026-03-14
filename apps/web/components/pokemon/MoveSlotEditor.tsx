'use client';

import { useState, useEffect } from 'react';
import type { Move, MoveData, PokemonSpeciesData } from '@poke-dex-battle/shared';
import { getLearnset, getMoveByName, getDuplicateMoveIds } from '@poke-dex-battle/shared';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';
import { POKEMON_TYPE_LABELS_JA } from '@poke-dex-battle/shared';
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
    const [learnset, setLearnset] = useState<MoveData[]>([]);
    const [moveSearch, setMoveSearch] = useState<string[]>(['', '', '', '']);
    const [moveResults, setMoveResults] = useState<MoveData[][]>([[], [], [], []]);

    const dupMoveIds = getDuplicateMoveIds(moves);

    useEffect(() => {
        const fetchedMoves = getLearnset(species.name)
            .map((moveName) => getMoveByName(moveName))
            .filter((m): m is MoveData => m !== null);
        setLearnset(fetchedMoves);
    }, [species.name]);

    function handleMoveSearch(slot: number, query: string) {
        const next = [...moveSearch];
        next[slot] = query;
        setMoveSearch(next);
        if (!query.trim()) {
            const nextRes = [...moveResults];
            nextRes[slot] = [];
            setMoveResults(nextRes);
            return;
        }
        const filtered = learnset
            .filter((m) => m.nameJa.includes(query) || m.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8);
        const nextRes = [...moveResults];
        nextRes[slot] = filtered;
        setMoveResults(nextRes);
    }

    function selectMove(slot: number, md: MoveData) {
        const newMoves = [...moves];
        const move: Move = {
            id: md.id,
            name: md.name,
            type: md.type,
            category: md.category,
            power: md.power ?? undefined,
            accuracy: md.accuracy ?? undefined,
            pp: md.pp,
        };
        newMoves[slot] = move;
        onChange(newMoves);
        const nextSearch = [...moveSearch];
        nextSearch[slot] = '';
        setMoveSearch(nextSearch);
        const nextRes = [...moveResults];
        nextRes[slot] = [];
        setMoveResults(nextRes);
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
                            <div className={`flex items-center gap-2 p-2 rounded-lg border ${isDup ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                                <span className="text-xs">{MOVE_CAT_ICON[move.category]}</span>
                                <span className={`text-[10px] text-white px-1.5 py-0.5 rounded-full font-semibold ${POKEMON_TYPE_COLORS[move.type]}`}>
                                    {POKEMON_TYPE_LABELS_JA[move.type] ?? move.type}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 flex-1">{getMoveByName(move.name)?.nameJa ?? move.name}</span>
                                {move.power && <span className="text-xs text-gray-400">威力{move.power}</span>}
                                {isDup && <AlertTriangle size={14} className="text-amber-500" />}
                                <button
                                    type="button"
                                    onClick={() => clearMove(slot)}
                                    className="text-gray-300 hover:text-red-400 text-lg leading-none"
                                >×</button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={moveSearch[slot]}
                                    onChange={(e) => handleMoveSearch(slot, e.target.value)}
                                    placeholder={`技スロット ${slot + 1} を検索...`}
                                    className="w-full text-sm border border-dashed border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pokemon-blue focus:border-solid"
                                />
                                {moveResults[slot].length > 0 && (
                                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                        {moveResults[slot].map((md) => (
                                            <button
                                                key={md.id}
                                                type="button"
                                                onClick={() => selectMove(slot, md)}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors text-left"
                                            >
                                                <span className="text-xs">{MOVE_CAT_ICON[md.category]}</span>
                                                <span className={`text-[10px] text-white px-1.5 py-0.5 rounded-full font-semibold ${POKEMON_TYPE_COLORS[md.type]}`}>
                                                    {POKEMON_TYPE_LABELS_JA[md.type] ?? md.type}
                                                </span>
                                                <span className="text-sm font-medium text-gray-800 flex-1">{md.nameJa}</span>
                                                {md.power && <span className="text-xs text-gray-400">威力{md.power}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
