'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Users, Gamepad2 } from 'lucide-react';
import { usePartyStore } from '@/hooks/use-party-store';
import { PartyCard } from '@/components/party/PartyCard';

export default function PartiesPage() {
  const { parties, deleteParty, duplicateParty } = usePartyStore();
  const [query, setQuery] = useState('');

  const handleDelete = useCallback(
    (id: string) => {
      deleteParty(id);
    },
    [deleteParty]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateParty(id);
    },
    [duplicateParty]
  );

  const filtered = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.regulation.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 pb-24">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <span className="inline-flex items-center justify-center rounded-lg bg-pokemon-blue/10 p-1.5">
              <Users className="h-5 w-5 text-pokemon-blue" />
            </span>
            パーティ管理
          </h2>
          <p className="mt-0.5 text-sm text-gray-400">{parties.length} パーティ登録中</p>
        </div>
      </div>

      {/* 検索バー */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="パーティ名・レギュレーションで絞り込み"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-pokemon-blue"
        />
      </div>

      {/* パーティ一覧 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4">
            <Gamepad2 className="mx-auto h-16 w-16 text-gray-300" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-600">
            {query ? '一致するパーティが見つかりません' : 'パーティがまだありません'}
          </h3>
          <p className="mb-6 text-sm text-gray-400">
            {query
              ? '別のキーワードで試してください'
              : '右下の「＋」ボタンから新しいパーティを作成しましょう'}
          </p>
          {!query && (
            <Link
              href="/parties/new"
              className="flex items-center gap-2 rounded-xl bg-pokemon-blue px-6 py-3 font-semibold text-white shadow transition-all hover:bg-blue-700 hover:shadow-lg"
            >
              <Plus size={18} /> 最初のパーティを作成
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* FAB: 新規作成 */}
      <Link
        href="/parties/new"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-pokemon-blue text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        aria-label="新規パーティ作成"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}
