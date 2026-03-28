'use client';

import { PartyWizard } from '@/components/party/PartyWizard';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPartyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/parties"
          className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-800">新規パーティ作成</h2>
          <p className="text-xs text-gray-400">3ステップで簡単登録</p>
        </div>
      </div>
      <PartyWizard mode="create" />
    </div>
  );
}
