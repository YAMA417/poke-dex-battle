'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { PokemonSpeciesData } from '@poke-dex-battle/shared';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';
import { POKEMON_TYPE_LABELS_JA } from '@poke-dex-battle/shared';
import { X, Search, Loader2 } from 'lucide-react';
import { useAllPokemon } from '@/hooks/useApiData';
import { toSpeciesData } from '@/lib/api-adapters';

interface PokemonSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (species: PokemonSpeciesData) => void;
  disabledIds?: number[];
  regulation?: string;
}

export function PokemonSearchModal({
  open,
  onClose,
  onSelect,
  disabledIds = [],
  regulation,
}: PokemonSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: rawPokemon, isLoading } = useAllPokemon(regulation);

  // API データを PokemonSpeciesData に変換（キャッシュ）
  const allPokemon = useMemo(() => {
    if (!rawPokemon) return [];
    return rawPokemon.map(toSpeciesData).filter((p): p is PokemonSpeciesData => p !== null);
  }, [rawPokemon]);

  // クライアント側フィルタ
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPokemon;
    return allPokemon.filter(
      (p) => p.nameJa.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [allPokemon, query]);

  // モーダルを開いたとき初期化
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  // ESCキーで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 pb-3 pt-5">
          <Search size={18} className="shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ポケモン名で検索（日本語・英語）"
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          <button
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-gray-100"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* 結果リスト */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400">読み込み中...</span>
            </div>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              該当するポケモンが見つかりません
            </p>
          ) : (
            <ul>
              {results.map((sp) => {
                const disabled = disabledIds.includes(sp.id);
                return (
                  <li key={sp.name}>
                    <button
                      disabled={disabled}
                      onClick={() => {
                        onSelect(sp);
                        onClose();
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-blue-50 ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      {/* スプライト */}
                      {sp.spriteUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sp.spriteUrl}
                          alt={sp.nameJa}
                          width={40}
                          height={40}
                          className="shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100" />
                      )}
                      {/* 名前 */}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-800">{sp.nameJa}</div>
                        <div className="text-xs text-gray-400">{sp.name}</div>
                      </div>
                      {/* タイプバッジ */}
                      <div className="flex shrink-0 gap-1">
                        {sp.types.map((t) => (
                          <span
                            key={t}
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white ${POKEMON_TYPE_COLORS[t] ?? 'bg-gray-400'}`}
                          >
                            {POKEMON_TYPE_LABELS_JA[t] ?? t}
                          </span>
                        ))}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
