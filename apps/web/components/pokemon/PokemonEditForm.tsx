'use client';

import { useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Pokemon, PokemonSpeciesData, PokemonType } from '@poke-dex-battle/shared';
import {
  POKEMON_TYPE_LABELS_JA,
  ALWAYS_VISIBLE_CATEGORIES,
  BATTLE_SYSTEM_CATEGORIES,
  POKEMON_SPECIFIC_CATEGORIES,
} from '@poke-dex-battle/shared';
import type { ItemCategory } from '@poke-dex-battle/shared';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';
import { StatEditor } from './StatEditor';
import { NatureSelector } from './NatureSelector';
import { MoveSlotEditor } from './MoveSlotEditor';
import { Autocomplete } from '@/components/ui/autocomplete';
import type { AutocompleteOption } from '@/components/ui/autocomplete';
import type { ItemRow } from '@/lib/api-adapters';
import { toSpeciesData } from '@/lib/api-adapters';
import { useMegaForms } from '@/hooks/useApiData';
import { Lock, BarChart3, Sparkles, Diamond, Swords, Shield, Package } from 'lucide-react';

/** テラスタイプ選択に使用する全タイプ一覧 */
const TYPES: PokemonType[] = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
];

/** 性別選択肢 */
const GENDER_OPTIONS = [
  { value: 'male', label: '♂ オス' },
  { value: 'female', label: '♀ メス' },
  { value: 'unknown', label: '不明' },
] as const;

interface PokemonEditFormProps {
  pokemon: Pokemon;
  species: PokemonSpeciesData;
  items: ItemRow[];
  onChange: (updated: Partial<Pokemon>) => void;
  /** 有効なバトルシステム（'mega', 'zmove', 'terastal', 'dynamax' など） */
  battleSystems?: string[];
  /** 全ポケモンの fixedItem（英語名）セット（ポケモン専用アイテムのフィルタ用） */
  allPokemonFixedItems?: Set<string>;
}

export function PokemonEditForm({
  pokemon,
  species,
  items,
  onChange,
  battleSystems = [],
  allPokemonFixedItems,
}: PokemonEditFormProps): React.ReactElement {
  // 選択中ポケモンの fixedItem（英語名）を収集（メガ・専用アイテム判定用）
  const pokemonFixedItems = useMemo(() => {
    const names = new Set<string>();
    if (species.fixedItem) names.add(species.fixedItem);
    if (allPokemonFixedItems) {
      for (const name of allPokemonFixedItems) names.add(name);
    }
    return names;
  }, [species.fixedItem, allPokemonFixedItems]);

  // メガフォーム取得（baseフォームの場合のみ）
  const baseName = !species.formType || species.formType === 'base' ? species.name : null;
  const { data: megaFormsRaw } = useMegaForms(baseName);
  const megaForms = useMemo(() => {
    if (!megaFormsRaw) return [];
    return megaFormsRaw
      .map((row) => toSpeciesData(row))
      .filter((sp): sp is PokemonSpeciesData => sp !== null);
  }, [megaFormsRaw]);

  // カテゴリベースの動的フィルタでアイテム候補を生成
  const itemOptions = useMemo<AutocompleteOption[]>(() => {
    const filtered = items.filter((item) => {
      const cat = item.category as ItemCategory | null;
      if (!cat) return false;

      // 常に表示するカテゴリ
      if ((ALWAYS_VISIBLE_CATEGORIES as readonly string[]).includes(cat)) return true;

      // battleSystemsに応じて表示するカテゴリ
      for (const [system, categories] of Object.entries(BATTLE_SYSTEM_CATEGORIES)) {
        if (battleSystems.includes(system) && (categories as readonly string[]).includes(cat)) {
          if ((POKEMON_SPECIFIC_CATEGORIES as readonly string[]).includes(cat)) {
            return pokemonFixedItems.has(item.name);
          }
          return true;
        }
      }

      // battleSystems不問のポケモン専用カテゴリ（mask, drive, memory）
      if ((POKEMON_SPECIFIC_CATEGORIES as readonly string[]).includes(cat)) {
        if (['mask', 'drive', 'memory'].includes(cat)) {
          return pokemonFixedItems.has(item.name);
        }
      }

      return false;
    });

    // ソート: ポケモン専用アイテムを先頭に
    const sorted = [...filtered].sort((a, b) => {
      const aFixed = pokemonFixedItems.has(a.name) ? 0 : 1;
      const bFixed = pokemonFixedItems.has(b.name) ? 0 : 1;
      return aFixed - bFixed;
    });

    const options = sorted.map((item) => ({
      label: item.nameJa,
      value: item.name,
      id: item.id,
    }));
    return [{ label: 'なし', value: '', id: 'none' }, ...options];
  }, [items, battleSystems, pokemonFixedItems]);

  // onChange は毎レンダーで新しい参照になるため ref で最新版を保持する
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 性別固定ポケモンの場合、既存データの gender 値を正しい値に修正する（編集モード対応）
  useEffect(() => {
    const { genderRate } = species;
    if (genderRate === 0 && pokemon.gender !== 'male') onChangeRef.current({ gender: 'male' });
    else if (genderRate === 8 && pokemon.gender !== 'female')
      onChangeRef.current({ gender: 'female' });
    else if (genderRate === -1 && pokemon.gender !== 'unknown')
      onChangeRef.current({ gender: 'unknown' });
  }, [species.genderRate, pokemon.gender]);

  // 性別表示の生成
  const genderDisplay = getGenderDisplay(pokemon.gender);

  return (
    <div className="space-y-4">
      {/* ── ヘッダー ── */}
      <header className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-md">
        {/* スプライト */}
        {species.spriteUrl && (
          <Image
            src={species.spriteUrl}
            alt={species.nameJa}
            width={50}
            height={50}
            className="shrink-0"
            unoptimized
          />
        )}

        {/* ポケモン名 + 性別 */}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-800">{species.nameJa}</span>
          {genderDisplay && (
            <span
              className={`text-sm font-semibold ${
                pokemon.gender === 'male'
                  ? 'text-blue-500'
                  : pokemon.gender === 'female'
                    ? 'text-pink-500'
                    : 'text-gray-400'
              }`}
            >
              {genderDisplay}
            </span>
          )}
        </div>

        {/* タイプバッジ */}
        <div className="flex items-center gap-1">
          {species.types.map((t) => (
            <span
              key={t}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${
                POKEMON_TYPE_COLORS[t] ?? 'bg-gray-400'
              }`}
            >
              {POKEMON_TYPE_LABELS_JA[t] ?? t}
            </span>
          ))}
        </div>

        {/* ニックネーム */}
        <div className="ml-auto">
          <label htmlFor="pokemon-nickname" className="sr-only">
            ニックネーム
          </label>
          <input
            id="pokemon-nickname"
            type="text"
            value={pokemon.nickname ?? ''}
            onChange={(e) => onChange({ nickname: e.target.value || undefined })}
            placeholder="ニックネーム"
            className="w-28 rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
          />
        </div>
      </header>

      {/* ── 2カラムレイアウト ── */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* 左カラム: ステータス */}
        <div className="space-y-5">
          {/* ステータスエディタ */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 border-b pb-1 text-sm font-bold text-gray-700">
              <span className="inline-flex items-center justify-center rounded-lg bg-pokemon-blue/10 p-1">
                <BarChart3 className="h-3.5 w-3.5 text-pokemon-blue" />
              </span>
              ステータス
            </h4>
            <StatEditor
              abilityPoints={pokemon.abilityPoints}
              baseStats={species.baseStats}
              nature={pokemon.nature}
              onChange={(abilityPoints) => onChange({ abilityPoints })}
              megaForms={megaForms}
            />
          </section>

          {/* 性格 */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 border-b pb-1 text-sm font-bold text-gray-700">
              <span className="inline-flex items-center justify-center rounded-lg bg-pokemon-blue/10 p-1">
                <Sparkles className="h-3.5 w-3.5 text-pokemon-blue" />
              </span>
              性格
            </h4>
            <NatureSelector nature={pokemon.nature} onChange={(nature) => onChange({ nature })} />
          </section>

          {/* テラスタイプ（条件表示） */}
          {battleSystems.includes('terastal') && (
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 border-b pb-1 text-sm font-bold text-gray-700">
                <span className="inline-flex items-center justify-center rounded-lg bg-pokemon-blue/10 p-1">
                  <Diamond className="h-3.5 w-3.5 text-pokemon-blue" />
                </span>
                テラスタイプ
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ teraType: t })}
                    aria-pressed={pokemon.teraType === t}
                    className={`rounded-full border-2 px-2 py-1 text-[11px] font-semibold transition-all ${POKEMON_TYPE_COLORS[t]} text-white ${
                      pokemon.teraType === t
                        ? 'scale-110 border-gray-900 shadow-md'
                        : 'border-transparent hover:scale-105'
                    }`}
                  >
                    {POKEMON_TYPE_LABELS_JA[t]}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 右カラム: 構成 */}
        <div className="space-y-5">
          {/* 技 */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 border-b pb-1 text-sm font-bold text-gray-700">
              <span className="inline-flex items-center justify-center rounded-lg bg-pokemon-blue/10 p-1">
                <Swords className="h-3.5 w-3.5 text-pokemon-blue" />
              </span>
              技（最大4つ）
            </h4>
            <MoveSlotEditor
              moves={pokemon.moves}
              species={species}
              onChange={(moves) => onChange({ moves })}
            />
          </section>

          {/* 特性 */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 border-b pb-1 text-sm font-bold text-gray-700">
              <span className="inline-flex items-center justify-center rounded-lg bg-pokemon-blue/10 p-1">
                <Shield className="h-3.5 w-3.5 text-pokemon-blue" />
              </span>
              特性
            </h4>
            <div className="flex flex-wrap gap-2">
              {species.abilities.map((ab) => (
                <button
                  key={ab.name}
                  type="button"
                  onClick={() => onChange({ ability: ab.name })}
                  aria-pressed={pokemon.ability === ab.name}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    pokemon.ability === ab.name
                      ? 'border-pokemon-blue bg-pokemon-blue font-semibold text-white shadow'
                      : 'border-gray-200 text-gray-600 hover:border-pokemon-blue hover:text-pokemon-blue'
                  }`}
                >
                  {ab.nameJa}
                  {ab.isHidden && <span className="ml-1 text-[10px] opacity-70">(夢)</span>}
                </button>
              ))}
            </div>
          </section>

          {/* 持ち物 */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 border-b pb-1 text-sm font-bold text-gray-700">
              <span className="inline-flex items-center justify-center rounded-lg bg-pokemon-blue/10 p-1">
                <Package className="h-3.5 w-3.5 text-pokemon-blue" />
              </span>
              持ち物
            </h4>
            {species.fixedItem ? (
              <div className="flex items-center gap-1.5 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-500">
                <Lock size={12} aria-hidden className="shrink-0 text-gray-400" />
                <span>{species.fixedItemNameJa ?? species.fixedItem}</span>
              </div>
            ) : (
              <Autocomplete
                id="pokemon-item"
                options={itemOptions}
                value={pokemon.item ?? ''}
                onSelect={(value) => onChange({ item: value || undefined })}
                onClear={() => onChange({ item: undefined })}
                placeholder="なし"
                className="rounded border border-gray-200 text-sm"
              />
            )}
          </section>

          {/* 性別 */}
          <section>
            <h4 className="mb-2 border-b pb-1 text-sm font-bold text-gray-700">性別</h4>
            {species.genderRate === -1 ? (
              <div className="rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-400">
                性別なし
              </div>
            ) : species.genderRate === 0 ? (
              <div className="rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-500">
                ♂ オス（固定）
              </div>
            ) : species.genderRate === 8 ? (
              <div className="rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-500">
                ♀ メス（固定）
              </div>
            ) : (
              <>
                <label htmlFor="pokemon-gender" className="sr-only">
                  性別
                </label>
                <select
                  id="pokemon-gender"
                  value={pokemon.gender ?? 'unknown'}
                  onChange={(e) => onChange({ gender: e.target.value as Pokemon['gender'] })}
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </section>

          {/* メモ */}
          <section>
            <label
              htmlFor="pokemon-memo"
              className="mb-2 block border-b pb-1 text-sm font-bold text-gray-700"
            >
              メモ
            </label>
            <textarea
              id="pokemon-memo"
              value={pokemon.memo ?? ''}
              onChange={(e) => onChange({ memo: e.target.value || undefined })}
              rows={3}
              placeholder="調整意図や技の選択理由など"
              className="w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

/** 性別表示テキストを返す */
function getGenderDisplay(gender: Pokemon['gender']): string | null {
  switch (gender) {
    case 'male':
      return '♂';
    case 'female':
      return '♀';
    default:
      return null;
  }
}
