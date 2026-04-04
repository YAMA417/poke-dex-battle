'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Move, MoveData, PokemonSpeciesData } from '@poke-dex-battle/shared';
import { getDuplicateMoveIds } from '@poke-dex-battle/shared';
import { useLearnset, useAllMoves } from '@/hooks/useApiData';
import { toMoveData } from '@/lib/api-adapters';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';
import { POKEMON_TYPE_LABELS_JA } from '@poke-dex-battle/shared';
import { MoveFilteredSelect } from '@/components/move/MoveFilteredSelect';
import { AlertTriangle, Plus, Swords, Sparkles, ShieldHalf, X } from 'lucide-react';

/**
 * 技スロットエディター。最大4枠の技を検索・選択・削除できる。
 * 空スロットはプレースホルダーボタン表示。クリックで編集モードに切り替わる。
 */

/** カテゴリに対応する Lucide アイコンを返す */
function MoveCategoryIcon({ category }: { category: string }): React.ReactNode {
  const iconProps = {
    size: 14,
    className: 'shrink-0 text-muted-foreground',
    'aria-hidden': true as const,
  };
  switch (category) {
    case 'Physical':
      return <Swords {...iconProps} />;
    case 'Special':
      return <Sparkles {...iconProps} />;
    case 'Status':
      return <ShieldHalf {...iconProps} />;
    default:
      return null;
  }
}

interface MoveSlotEditorProps {
  moves: Move[];
  species: PokemonSpeciesData;
  onChange: (moves: Move[]) => void;
}

export function MoveSlotEditor({ moves, species, onChange }: MoveSlotEditorProps): React.ReactNode {
  // 編集中のスロット番号（null=どのスロットも編集していない）
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  // DB の pokemon.id をそのまま使用（ハイフン含む: "calyrex-shadow-rider" 等）
  const pokemonId = species.name;
  const { data: learnsetData } = useLearnset(pokemonId);
  const { data: allMovesRaw } = useAllMoves();

  // 習得可能技の ID リスト（数値配列）
  const learnableMoves = learnsetData?.moves ?? null;

  // 全技の name→MoveData マップ
  const moveByNameMap2 = useMemo(() => {
    if (!allMovesRaw) return new Map<string, MoveData>();
    const map = new Map<string, MoveData>();
    for (const row of allMovesRaw) {
      const md = toMoveData(row);
      if (md) map.set(row.name, md);
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

  const dupMoveIds = getDuplicateMoveIds(moves);

  const selectMove = useCallback(
    (slot: number, md: MoveData) => {
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
      // 技を選択したら編集モードを解除
      setActiveSlot(null);
    },
    [moves, onChange]
  );

  /** MoveFilteredSelect の onSelect コールバックを生成 */
  const handleSlotSelect = useCallback(
    (slot: number) => (name: string) => {
      const md = moveByNameMap2.get(name);
      if (md) selectMove(slot, md);
    },
    [moveByNameMap2, selectMove]
  );

  const clearMove = useCallback(
    (slot: number) => {
      const newMoves = [...moves];
      newMoves.splice(slot, 1);
      onChange(newMoves);
      // 削除したスロットが編集中だった場合はリセット
      if (activeSlot === slot) {
        setActiveSlot(null);
      }
    },
    [moves, onChange, activeSlot]
  );

  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((slot) => {
        const move = moves[slot];
        const isDup = move ? dupMoveIds.has(move.id) : false;
        const isEditing = activeSlot === slot;

        return (
          <div key={slot} className="relative">
            {move ? (
              /* 選択済みスロット */
              <div
                className={`flex items-center gap-2 rounded-lg border p-2 ${isDup ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'border-border bg-muted'}`}
              >
                <MoveCategoryIcon category={move.category} />
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white ${POKEMON_TYPE_COLORS[move.type]}`}
                >
                  {POKEMON_TYPE_LABELS_JA[move.type] ?? move.type}
                </span>
                <span className="flex-1 text-sm font-semibold text-foreground">
                  {moveByNameMap.get(move.name)?.nameJa ?? move.name}
                </span>
                {move.power != null && move.power > 0 && (
                  <span className="text-xs text-muted-foreground">威力{move.power}</span>
                )}
                {isDup && (
                  <AlertTriangle size={14} className="text-amber-500" aria-label="重複した技" />
                )}
                <button
                  type="button"
                  onClick={() => clearMove(slot)}
                  aria-label={`${moveByNameMap.get(move.name)?.nameJa ?? move.name}を削除`}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ) : isEditing ? (
              /* 編集中スロット: フィルター + Autocomplete */
              <MoveFilteredSelect
                learnableMoves={learnableMoves}
                allMoves={allMovesRaw ?? []}
                onSelect={handleSlotSelect(slot)}
                collapsible={false}
                placeholder={`技スロット ${slot + 1}`}
                aria-label={`技スロット ${slot + 1}`}
                className="rounded-lg border border-input p-2 text-sm"
              />
            ) : (
              /* 空スロット: プレースホルダーボタン */
              <button
                type="button"
                onClick={() => setActiveSlot(slot)}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-input p-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
                aria-label={`技スロット ${slot + 1} に技を追加`}
              >
                <Plus size={14} aria-hidden="true" />
                <span>技を追加</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
