'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { usePartyStore } from '@/hooks/use-party-store';
import { PartyCard } from '@/components/party/PartyCard';

export default function PartiesPage() {
  const { parties, deleteParty, duplicateParty } = usePartyStore();
  const [query, setQuery] = useState('');

  const handleDelete = useCallback((id: string) => {
    deleteParty(id);
  }, [deleteParty]);

  const handleDuplicate = useCallback((id: string) => {
    duplicateParty(id);
  }, [duplicateParty]);

  const filtered = parties.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.regulation.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      {/* ヘッダー */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">パーティ管理</h2>
          <p className="text-sm text-gray-400 mt-0.5">{parties.length} パーティ登録中</p>
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
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pokemon-blue bg-white"
        />
      </div>

      {/* パーティ一覧 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">
            {query ? '一致するパーティが見つかりません' : 'パーティがまだありません'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {query ? '別のキーワードで試してください' : '右下の「＋」ボタンから新しいパーティを作成しましょう'}
          </p>
          {!query && (
            <Link
              href="/parties/new"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-pokemon-blue text-white font-semibold hover:bg-blue-700 transition-all shadow hover:shadow-lg"
            >
              <Plus size={18} /> 最初のパーティを作成
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-pokemon-blue text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 flex items-center justify-center transition-all z-40"
        aria-label="新規パーティ作成"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}


