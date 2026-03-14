'use client';

import { use } from 'react';
import Link from 'next/link';
import { usePartyStore } from '@/hooks/use-party-store';
import { PartyWizard } from '@/components/party/PartyWizard';
import { ChevronLeft } from 'lucide-react';

export default function EditPartyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { getParty } = usePartyStore();
    const party = getParty(id);

    if (!party) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-gray-500 mb-4">パーティが見つかりません</p>
                <Link href="/parties" className="text-pokemon-blue hover:underline text-sm">← 一覧へ戻る</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href={`/parties/${id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">パーティ編集</h2>
                    <p className="text-xs text-gray-400">{party.name}</p>
                </div>
            </div>
            <PartyWizard mode="edit" initialPartyId={id} />
        </div>
    );
}
