'use client';

import { ChevronLeft, Check } from 'lucide-react';

/** Step4で親コンポーネントから受け取るprops */
interface WizardStep4SaveProps {
  label: string;
  desc: string;
  partyName: string;
  regulation: string;
  memo: string;
  mode: 'create' | 'edit';
  isValid: boolean;
  onPartyNameChange: (name: string) => void;
  onMemoChange: (memo: string) => void;
  onBack: () => void;
  onSave: () => void;
}

/** Step4: パーティ情報・保存 */
export function WizardStep4Save({
  label,
  desc,
  partyName,
  regulation,
  memo,
  mode,
  isValid,
  onPartyNameChange,
  onMemoChange,
  onBack,
  onSave,
}: WizardStep4SaveProps): React.JSX.Element {
  return (
    <div className="animate-fadeIn mx-auto max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-md">
      <div>
        <h3 className="mb-1 text-lg font-bold text-gray-800">{label}</h3>
        <p className="text-sm text-gray-400">{desc}</p>
      </div>
      <div>
        <label htmlFor="party-name" className="mb-1 block text-xs font-semibold text-gray-600">
          パーティ名 <span className="text-red-400">*</span>
        </label>
        <input
          id="party-name"
          type="text"
          value={partyName}
          onChange={(e) => onPartyNameChange(e.target.value)}
          placeholder="例: 晴れパ 最新版"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokemon-blue"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">レギュレーション</label>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          {regulation}
        </div>
      </div>
      <div>
        <label htmlFor="party-memo" className="mb-1 block text-xs font-semibold text-gray-600">
          メモ（任意）
        </label>
        <textarea
          id="party-memo"
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          rows={2}
          placeholder="パーティのコンセプトなど"
          className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokemon-blue"
        />
      </div>
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          <ChevronLeft size={16} /> 戻る
        </button>
        <button
          type="button"
          disabled={!isValid}
          onClick={onSave}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${isValid ? 'bg-green-500 text-white shadow hover:bg-green-600 hover:shadow-lg' : 'cursor-not-allowed bg-gray-100 text-gray-300'}`}
        >
          <Check size={16} /> {mode === 'create' ? '保存して完了' : '変更を保存'}
        </button>
      </div>
    </div>
  );
}
