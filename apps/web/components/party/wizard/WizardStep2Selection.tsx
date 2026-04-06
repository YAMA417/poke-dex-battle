'use client';

import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import type { PokemonSpeciesData } from '@poke-dex-battle/shared';

/** Step2で親コンポーネントから受け取るprops */
interface WizardStep2SelectionProps {
  label: string;
  desc: string;
  pokemons: { species: PokemonSpeciesData }[];
  isValid: boolean;
  mode: 'create' | 'edit';
  onReplace: (idx: number) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Step2: ポケモン選択 */
export function WizardStep2Selection({
  label,
  desc,
  pokemons,
  isValid,
  mode,
  onReplace,
  onAdd,
  onRemove,
  onBack,
  onNext,
}: WizardStep2SelectionProps): React.JSX.Element {
  return (
    <div className="animate-fadeIn mx-auto max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow">
      <div>
        <h3 className="mb-1 text-lg font-bold text-gray-800">{label}</h3>
        <p className="text-sm text-gray-400">{desc}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {pokemons.map(({ species }, i) => (
          <div key={i} className="group relative flex flex-col items-center gap-1">
            <button
              type="button"
              aria-label={`${species.nameJa}を差し替え`}
              className="flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-gray-100 bg-gray-50 transition-all hover:border-pokemon-blue"
              onClick={() => onReplace(i)}
            >
              {species.spriteUrl ? (
                <Image
                  src={species.spriteUrl}
                  alt={species.nameJa}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-lg font-bold text-gray-300">{species.nameJa.charAt(0)}</span>
              )}
            </button>
            <span className="w-full truncate text-center text-[10px] font-medium text-gray-600">
              {species.nameJa}
            </span>
            {/* W-04対応: モバイルでは常時表示、デスクトップではhover時のみ表示 */}
            <button
              type="button"
              aria-label={`${species.nameJa}を削除`}
              onClick={() => onRemove(i)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-400 text-white md:hidden md:group-hover:flex"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
        {pokemons.length < 6 && (
          <button
            type="button"
            aria-label="ポケモンを追加"
            onClick={onAdd}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-pokemon-blue hover:bg-blue-50"
          >
            <Plus size={20} className="text-gray-300" />
            <span className="text-[10px] text-gray-300">追加</span>
          </button>
        )}
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
          onClick={onNext}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${isValid ? 'bg-pokemon-blue text-white shadow hover:bg-blue-700' : 'cursor-not-allowed bg-gray-100 text-gray-300'}`}
        >
          次へ <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
