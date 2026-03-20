'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePartyStore } from '@/hooks/use-party-store';
import { useAllPokemon, useAllItems } from '@/hooks/useApiData';
import { toSpeciesData, toItemData } from '@/lib/api-adapters';
import type { PokemonSpeciesData } from '@poke-dex-battle/shared';
import { POKEMON_TYPE_LABELS_JA } from '@poke-dex-battle/shared';
import { ActualStatsDisplay } from '@/components/pokemon/ActualStatsDisplay';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';
import { NATURE_JA } from '@/components/pokemon/NatureSelector';
import { ChevronLeft, Edit, Trash2, Copy, Download } from 'lucide-react';

export default function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getParty, deleteParty, duplicateParty } = usePartyStore();
  const party = getParty(id);

  // API経由でアイテムデータを取得し、英語名→日本語名のMapを構築
  const { data: allItemsRaw } = useAllItems();
  const itemNameJaMap = useMemo(() => {
    if (!allItemsRaw) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const row of allItemsRaw) {
      const item = toItemData(row);
      if (item) map.set(item.name, item.nameJa);
    }
    return map;
  }, [allItemsRaw]);

  // API経由で全ポケモンデータを取得し、名前→種族データのMapを構築
  const { data: allPokemonRaw } = useAllPokemon();
  const allPokemonByName = useMemo(() => {
    if (!allPokemonRaw) return new Map<string, PokemonSpeciesData>();
    const map = new Map<string, PokemonSpeciesData>();
    for (const row of allPokemonRaw) {
      const sp = toSpeciesData(row);
      if (sp) {
        map.set(sp.nameJa, sp);
        map.set(sp.name, sp);
      }
    }
    return map;
  }, [allPokemonRaw]);

  if (!party) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-5xl">😵</div>
        <p className="mb-4 text-gray-500">パーティが見つかりません</p>
        <Link href="/parties" className="text-sm text-pokemon-blue hover:underline">
          ← 一覧へ戻る
        </Link>
      </div>
    );
  }

  function handleDelete() {
    if (confirm(`「${party?.name ?? 'パーティ'}」を削除しますか？`)) {
      deleteParty(id);
      router.push('/parties');
    }
  }

  function handleDuplicate() {
    const copy = duplicateParty(id);
    if (copy) router.push(`/parties/${copy.id}`);
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-start gap-3">
        <Link
          href="/parties"
          className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold text-gray-800">{party.name}</h2>
          <p className="text-sm text-gray-400">
            {party.regulation === 'SV' ? 'スカーレット・バイオレット' : 'チャンピオンズ'}
            {' · '}更新{new Date(party.updatedAt).toLocaleDateString('ja-JP')}
          </p>
          {party.memo && (
            <p className="mt-1 inline-block rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-500">
              {party.memo}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleDuplicate}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="複製"
          >
            <Copy size={18} />
          </button>
          <Link
            href={`/parties/${id}/edit`}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-pokemon-blue"
            title="編集"
          >
            <Edit size={18} />
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="削除"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* ポケモングリッド */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {party.pokemons.map((pk) => {
          const species = allPokemonByName.get(pk.speciesName) ?? null;
          return (
            <div
              key={pk.id}
              className="space-y-3 rounded-2xl bg-white p-4 shadow transition-shadow hover:shadow-md"
            >
              {/* ポケモン名・アイコン */}
              <div className="flex items-center gap-3">
                {species?.spriteUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={species.spriteUrl}
                    alt={species.nameJa}
                    width={56}
                    height={56}
                    className="h-14 w-14 object-contain"
                  />
                )}
                <div className="min-w-0">
                  <div className="font-bold text-gray-800">
                    {pk.nickname ? `${pk.nickname}` : (species?.nameJa ?? pk.speciesName)}
                  </div>
                  {pk.nickname && <div className="text-xs text-gray-400">{species?.nameJa}</div>}
                  <div className="mt-1 flex gap-1">
                    {species?.types.map((t) => (
                      <span
                        key={t}
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white ${POKEMON_TYPE_COLORS[t] ?? 'bg-gray-400'}`}
                      >
                        {POKEMON_TYPE_LABELS_JA[t] ?? t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {/* テラスタイプ・特性・持ち物・性格 */}
              <div className="grid grid-cols-4 gap-1 text-center text-[11px] text-gray-500">
                <div className="rounded-lg bg-gray-50 px-1 py-1">
                  <div className="font-bold text-gray-700">テラス</div>
                  <div
                    className={`mt-0.5 inline-block rounded-full px-1 py-0.5 text-[10px] text-white ${POKEMON_TYPE_COLORS[pk.teraType] ?? 'bg-gray-400'}`}
                  >
                    {POKEMON_TYPE_LABELS_JA[pk.teraType] ?? pk.teraType}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-1 py-1">
                  <div className="font-bold text-gray-700">特性</div>
                  <div className="truncate">
                    {species?.abilities.find((a) => a.name === pk.ability)?.nameJa ?? pk.ability}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-1 py-1">
                  <div className="font-bold text-gray-700">持ち物</div>
                  <div className="truncate">
                    {pk.item ? (itemNameJaMap.get(pk.item) ?? pk.item) : 'なし'}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-1 py-1">
                  <div className="font-bold text-gray-700">性格</div>
                  <div>{NATURE_JA[pk.nature] ?? pk.nature}</div>
                </div>
              </div>
              {/* 技 */}
              <div className="space-y-1">
                {pk.moves.slice(0, 4).map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${POKEMON_TYPE_COLORS[m.type] ?? 'bg-gray-300'}`}
                      title={POKEMON_TYPE_LABELS_JA[m.type] ?? m.type}
                    />
                    {m.nameJa ?? m.name}
                    {m.power && (
                      <span className="ml-auto tabular-nums text-gray-400">威力{m.power}</span>
                    )}
                  </div>
                ))}
                {pk.moves.length === 0 && <div className="text-xs text-gray-300">技未設定</div>}
              </div>
              {/* 実数値 */}
              {species && (
                <ActualStatsDisplay
                  pokemon={pk}
                  baseStats={species.baseStats}
                  showEvContribution={true}
                />
              )}
            </div>
          );
        })}
        {party.pokemons.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-12 text-center text-gray-400">
            <div className="mb-2 text-4xl">🥚</div>
            <p className="text-sm">まだポケモンが登録されていません</p>
            <Link
              href={`/parties/${id}/edit`}
              className="mt-3 text-sm text-pokemon-blue hover:underline"
            >
              編集して追加 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
