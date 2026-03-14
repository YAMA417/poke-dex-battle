'use client';

import Link from 'next/link';
import { Copy, Trash2, Edit, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import type { Party } from '@poke-dex-battle/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';

const REGULATION_LABELS: Record<string, string> = {
  SV: 'スカーレット・バイオレット',
  Champions: 'チャンピオンズ',
};

interface PartyCardProps {
  party: Party;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PartyCard({ party, onDuplicate, onDelete }: PartyCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // パーティの主なタイプを抽出してグラデーション背景を生成
  const primaryType = party.pokemons[0]?.teraType ?? 'Normal';
  const gradientFrom = POKEMON_TYPE_COLORS[primaryType] ?? 'bg-blue-400';

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      {/* カラーアクセントバー */}
      <div className={`h-1.5 w-full ${gradientFrom}`} />

      <div className="p-4">
        {/* ヘッダー */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/parties/${party.id}`}
              className="block truncate font-bold text-gray-800 transition-colors hover:text-pokemon-blue"
            >
              {party.name}
            </Link>
            <span className="mt-0.5 block text-[11px] text-gray-400">
              {REGULATION_LABELS[party.regulation] ?? party.regulation}
            </span>
          </div>
          {/* メニュー */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                  <Link
                    href={`/parties/${party.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Edit size={14} /> 編集
                  </Link>
                  <button
                    onClick={() => {
                      onDuplicate(party.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Copy size={14} /> 複製
                  </button>
                  <button
                    onClick={() => {
                      setDeleteDialogOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={14} /> 削除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ポケモンアイコン6枠 */}
        <div className="mb-3 grid grid-cols-6 gap-1">
          {Array.from({ length: 6 }).map((_, i) => {
            const pk = party.pokemons[i];
            return (
              <div
                key={i}
                className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
              >
                {pk?.speciesId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pk.speciesId}.png`}
                    alt={pk.speciesName}
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xl text-gray-200">?</span>
                )}
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">{party.pokemons.length}/6 匹</span>
          <span className="text-[11px] text-gray-400">
            {new Date(party.updatedAt).toLocaleDateString('ja-JP')}
          </span>
        </div>

        {/* メモ (任意) */}
        {party.memo && (
          <p className="mt-2 line-clamp-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] text-gray-500">
            {party.memo}
          </p>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>パーティを削除しますか？</DialogTitle>
            <DialogDescription>
              「{party.name}」を削除します。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose className="rounded-lg border border-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50">
              キャンセル
            </DialogClose>
            <button
              onClick={() => {
                onDelete(party.id);
                setDeleteDialogOpen(false);
              }}
              className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600"
            >
              削除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
