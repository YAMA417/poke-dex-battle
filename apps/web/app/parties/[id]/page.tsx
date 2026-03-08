'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePartyStore } from '@/hooks/use-party-store';
import { ExportImportPanel } from '@/components/party/ExportImportPanel';
import { getPokemonByName } from '@poke-dex-battle/shared';
import { ActualStatsDisplay } from '@/components/pokemon/ActualStatsDisplay';
import { ChevronLeft, Edit, Trash2, Copy, Download } from 'lucide-react';

const TYPE_COLOR: Record<string, string> = {
    Normal: 'bg-gray-400', Fire: 'bg-orange-500', Water: 'bg-blue-500', Electric: 'bg-yellow-400',
    Grass: 'bg-green-500', Ice: 'bg-cyan-300', Fighting: 'bg-red-700', Poison: 'bg-purple-500',
    Ground: 'bg-yellow-600', Flying: 'bg-indigo-300', Psychic: 'bg-pink-500', Bug: 'bg-lime-500',
    Rock: 'bg-yellow-800', Ghost: 'bg-purple-800', Dragon: 'bg-indigo-700', Dark: 'bg-gray-800',
    Steel: 'bg-gray-500', Fairy: 'bg-pink-300',
};

export default function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { getParty, deleteParty, duplicateParty, exportParty } = usePartyStore();
    const party = getParty(id);

    if (!party) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">😵</div>
                <p className="text-gray-500 mb-4">パーティが見つかりません</p>
                <Link href="/parties" className="text-pokemon-blue hover:underline text-sm">← 一覧へ戻る</Link>
            </div>
        );
    }

    function handleDelete() {
        if (confirm(`「${party!.name}」を削除しますか？`)) {
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
            <div className="flex items-start gap-3 flex-wrap">
                <Link href="/parties" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
                    <ChevronLeft size={20} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-800 truncate">{party.name}</h2>
                    <p className="text-sm text-gray-400">
                        {party.regulation === 'SV' ? 'スカーレット・バイオレット' : 'チャンピオンズ'}
                        {' · '}更新{new Date(party.updatedAt).toLocaleDateString('ja-JP')}
                    </p>
                    {party.memo && <p className="text-sm text-gray-500 mt-1 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">{party.memo}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={handleDuplicate} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="複製">
                        <Copy size={18} />
                    </button>
                    <Link href={`/parties/${id}/edit`} className="p-2 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-pokemon-blue transition-colors" title="編集">
                        <Edit size={18} />
                    </Link>
                    <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="削除">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* ポケモングリッド */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {party.pokemons.map((pk) => {
                    const species = getPokemonByName(pk.speciesName);
                    return (
                        <div key={pk.id} className="bg-white rounded-2xl shadow p-4 space-y-3 hover:shadow-md transition-shadow">
                            {/* ポケモン名・アイコン */}
                            <div className="flex items-center gap-3">
                                {species?.spriteUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={species.spriteUrl} alt={species.nameJa} width={56} height={56} className="w-14 h-14 object-contain" />
                                )}
                                <div className="min-w-0">
                                    <div className="font-bold text-gray-800">
                                        {pk.nickname ? `${pk.nickname}` : species?.nameJa ?? pk.speciesName}
                                    </div>
                                    {pk.nickname && <div className="text-xs text-gray-400">{species?.nameJa}</div>}
                                    <div className="flex gap-1 mt-1">
                                        {species?.types.map((t) => (
                                            <span key={t} className={`text-[10px] text-white px-1.5 py-0.5 rounded-full font-semibold ${TYPE_COLOR[t] ?? 'bg-gray-400'}`}>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* テラスタイプ・持ち物・性格 */}
                            <div className="grid grid-cols-3 gap-1 text-center text-[11px] text-gray-500">
                                <div className="bg-gray-50 rounded-lg px-1 py-1">
                                    <div className="font-bold text-gray-700">テラス</div>
                                    <div className={`text-[10px] text-white px-1 py-0.5 rounded-full inline-block mt-0.5 ${TYPE_COLOR[pk.teraType] ?? 'bg-gray-400'}`}>{pk.teraType}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg px-1 py-1">
                                    <div className="font-bold text-gray-700">持ち物</div>
                                    <div className="truncate">{pk.item ?? 'なし'}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg px-1 py-1">
                                    <div className="font-bold text-gray-700">性格</div>
                                    <div>{pk.nature}</div>
                                </div>
                            </div>
                            {/* 技 */}
                            <div className="space-y-1">
                                {pk.moves.slice(0, 4).map((m, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_COLOR[m.type] ?? 'bg-gray-300'}`} />
                                        {m.name}
                                        {m.power && <span className="text-gray-400 ml-auto tabular-nums">威力{m.power}</span>}
                                    </div>
                                ))}
                                {pk.moves.length === 0 && <div className="text-xs text-gray-300">技未設定</div>}
                            </div>
                            {/* 実数値 */}
                            {species && (
                                <ActualStatsDisplay pokemon={pk} baseStats={species.baseStats} showEvContribution={true} />
                            )}
                        </div>
                    );
                })}
                {party.pokemons.length === 0 && (
                    <div className="col-span-full flex flex-col items-center py-12 text-center text-gray-400">
                        <div className="text-4xl mb-2">🥚</div>
                        <p className="text-sm">まだポケモンが登録されていません</p>
                        <Link href={`/parties/${id}/edit`} className="mt-3 text-sm text-pokemon-blue hover:underline">編集して追加 →</Link>
                    </div>
                )}
            </div>

            {/* エクスポートパネル */}
            <div className="border-t pt-4">
                <ExportImportPanel
                    onExport={() => exportParty(id)}
                    onImport={() => { }}
                    label="このパーティ"
                />
            </div>
        </div>
    );
}
