'use client';

import { ChevronRight } from 'lucide-react';
import type { RegulationData } from '@/hooks/useApiData';

/** Step1で親コンポーネントから受け取るprops */
interface WizardStep1RegulationProps {
  label: string;
  desc: string;
  regulation: string;
  allRegulations: RegulationData[] | undefined;
  onRegulationSelect: (reg: RegulationData) => void;
  onNext: () => void;
}

/** Step1: レギュレーション選択 */
export function WizardStep1Regulation({
  label,
  desc,
  regulation,
  allRegulations,
  onRegulationSelect,
  onNext,
}: WizardStep1RegulationProps): React.JSX.Element {
  return (
    <div className="animate-fadeIn mx-auto max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-md">
      <div>
        <h3 className="mb-1 text-lg font-bold text-gray-800">{label}</h3>
        <p className="text-sm text-gray-400">{desc}</p>
      </div>
      <div>
        <label
          htmlFor="regulation-select"
          className="mb-2 block text-xs font-semibold text-gray-600"
        >
          レギュレーション <span className="text-red-400">*</span>
        </label>
        {allRegulations && allRegulations.length > 0 ? (
          <select
            id="regulation-select"
            value={regulation}
            onChange={(e) => {
              const found = allRegulations.find((r) => r.name === e.target.value);
              if (found) onRegulationSelect(found);
            }}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokemon-blue"
          >
            {allRegulations.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-400">
            読み込み中...
          </div>
        )}
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!regulation}
          onClick={onNext}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${regulation ? 'bg-pokemon-blue text-white shadow hover:bg-blue-700 hover:shadow-lg' : 'cursor-not-allowed bg-gray-100 text-gray-300'}`}
        >
          次へ <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
