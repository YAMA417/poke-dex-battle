'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchPokemon } from '@poke-dex-battle/shared';
import type { PokemonSpeciesData } from '@poke-dex-battle/shared';
import { X, Search } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
    Normal: 'bg-gray-400', Fire: 'bg-orange-500', Water: 'bg-blue-500',
    Electric: 'bg-yellow-400', Grass: 'bg-green-500', Ice: 'bg-cyan-300',
    Fighting: 'bg-red-700', Poison: 'bg-purple-500', Ground: 'bg-yellow-600',
    Flying: 'bg-indigo-300', Psychic: 'bg-pink-500', Bug: 'bg-lime-500',
    Rock: 'bg-yellow-800', Ghost: 'bg-purple-800', Dragon: 'bg-indigo-700',
    Dark: 'bg-gray-800', Steel: 'bg-gray-500', Fairy: 'bg-pink-300',
};

const TYPE_LABELS_JA: Record<string, string> = {
    Normal: 'ノーマル', Fire: 'ほのお', Water: 'みず', Electric: 'でんき',
    Grass: 'くさ', Ice: 'こおり', Fighting: 'かくとう', Poison: 'どく',
    Ground: 'じめん', Flying: 'ひこう', Psychic: 'エスパー', Bug: 'むし',
    Rock: 'いわ', Ghost: 'ゴースト', Dragon: 'ドラゴン', Dark: 'あく',
    Steel: 'はがね', Fairy: 'フェアリー',
};

interface PokemonSearchModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (species: PokemonSpeciesData) => void;
    disabledIds?: number[];
}

export function PokemonSearchModal({ open, onClose, onSelect, disabledIds = [] }: PokemonSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PokemonSpeciesData[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // モーダルを開いたとき初期リストを表示（上位20件）
    useEffect(() => {
        if (open) {
            setQuery('');
            setResults(searchPokemon('').slice(0, 20));
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const res = value.trim()
                ? searchPokemon(value).slice(0, 30)
                : searchPokemon('').slice(0, 20);
            setResults(res);
        }, 180);
    }, []);

    // ESCキーで閉じる
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* 背景オーバーレイ */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                {/* ヘッダー */}
                <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-gray-100">
                    <Search size={18} className="text-gray-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="ポケモン名で検索（日本語・英語）"
                        className="flex-1 text-sm outline-none placeholder:text-gray-400"
                    />
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* 結果リスト */}
                <div className="overflow-y-auto flex-1 py-2">
                    {results.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-10">該当するポケモンが見つかりません</p>
                    ) : (
                        <ul>
                            {results.map((sp) => {
                                const disabled = disabledIds.includes(sp.id);
                                return (
                                    <li key={sp.id}>
                                        <button
                                            disabled={disabled}
                                            onClick={() => { onSelect(sp); onClose(); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left
                        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            {/* スプライト */}
                                            {sp.spriteUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={sp.spriteUrl} alt={sp.nameJa} width={40} height={40} className="shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
                                            )}
                                            {/* 名前 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-gray-800">{sp.nameJa}</div>
                                                <div className="text-xs text-gray-400">{sp.name}</div>
                                            </div>
                                            {/* タイプバッジ */}
                                            <div className="flex gap-1 shrink-0">
                                                {sp.types.map((t) => (
                                                    <span
                                                        key={t}
                                                        className={`text-[10px] text-white px-1.5 py-0.5 rounded-full font-semibold ${TYPE_COLORS[t] ?? 'bg-gray-400'}`}
                                                    >
                                                        {TYPE_LABELS_JA[t] ?? t}
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
