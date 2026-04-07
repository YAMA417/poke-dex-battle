'use client';

import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import Image from 'next/image';
import type { Pokemon, PokemonSpeciesData } from '@poke-dex-battle/shared';
import { PokemonEditForm } from '@/components/pokemon/PokemonEditForm';
import type { ItemRow } from '@/lib/api-adapters';

/** Step3で親コンポーネントから受け取るprops */
interface WizardStep3EditProps {
  pokemons: { pokemon: Pokemon; species: PokemonSpeciesData }[];
  editingIdx: number;
  items: ItemRow[];
  battleSystems: string[];
  allPokemonFixedItems: Set<string>;
  onEditingIdxChange: (idx: number) => void;
  onAdd: () => void;
  onPokemonChange: (idx: number, data: Partial<Pokemon>) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Step3: ポケモン詳細編集 */
export function WizardStep3Edit({
  pokemons,
  editingIdx,
  items,
  battleSystems,
  allPokemonFixedItems,
  onEditingIdxChange,
  onAdd,
  onPokemonChange,
  onBack,
  onNext,
}: WizardStep3EditProps): React.JSX.Element | null {
  if (pokemons.length === 0) return null;

  return (
    <div className="animate-fadeIn overflow-hidden rounded-2xl bg-white shadow-md">
      {/* ポケモン切り替えタブ */}
      <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50">
        {pokemons.map(({ species }, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onEditingIdxChange(i)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${editingIdx === i ? 'border-pokemon-blue bg-white text-pokemon-blue' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {species.spriteUrl ? (
              <Image
                src={species.spriteUrl}
                alt=""
                width={24}
                height={24}
                unoptimized
                className="h-6 w-6 object-contain"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center text-xs text-gray-400">
                {species.nameJa.charAt(0)}
              </span>
            )}
            {species.nameJa}
          </button>
        ))}
        {pokemons.length < 6 && (
          <button
            type="button"
            aria-label="ポケモンを追加"
            onClick={onAdd}
            className="flex shrink-0 items-center gap-1 border-b-2 border-transparent px-3 py-2 text-xs text-gray-300 transition-all hover:text-pokemon-blue"
          >
            <Plus size={14} /> 追加
          </button>
        )}
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-6">
        {pokemons[editingIdx] && (
          <PokemonEditForm
            key={editingIdx}
            pokemon={pokemons[editingIdx].pokemon}
            species={pokemons[editingIdx].species}
            items={items}
            onChange={(data) => onPokemonChange(editingIdx, data)}
            battleSystems={battleSystems}
            allPokemonFixedItems={allPokemonFixedItems}
          />
        )}
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          <ChevronLeft size={16} /> ポケモン一覧
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl bg-pokemon-blue px-6 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-blue-700 hover:shadow-lg"
        >
          次へ <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
