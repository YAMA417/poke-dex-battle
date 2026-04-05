'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Pokemon, PokemonSpeciesData, PokemonType, Stats } from '@poke-dex-battle/shared';
import {
  findClosestRealizableEv,
  getNatureModifier,
  POKEMON_TYPE_LABELS_JA,
  ALWAYS_VISIBLE_CATEGORIES,
  BATTLE_SYSTEM_CATEGORIES,
  POKEMON_SPECIFIC_CATEGORIES,
} from '@poke-dex-battle/shared';
import type { ItemCategory } from '@poke-dex-battle/shared';
import { NATURE_EFFECTS_MAP } from '@/lib/constants';
import { EVSlider } from './EVSlider';
import { IVInputGrid } from './IVInputGrid';
import { NatureSelector } from './NatureSelector';
import { MoveSlotEditor } from './MoveSlotEditor';
import { ActualStatsDisplay } from './ActualStatsDisplay';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';
import { Autocomplete } from '@/components/ui/autocomplete';
import type { AutocompleteOption } from '@/components/ui/autocomplete';
import type { ItemRow } from '@/lib/api-adapters';
import { Lock } from 'lucide-react';

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
}: PokemonEditFormProps) {
  const [actualStatInputs, setActualStatInputs] = useState<Partial<Record<keyof Stats, string>>>(
    {}
  );
  const [actualStatErrors, setActualStatErrors] = useState<Partial<Record<keyof Stats, string>>>(
    {}
  );
  const [isEVsOpen, setIsEVsOpen] = useState<boolean>(false);

  // 選択中ポケモンの fixedItem（英語名）を収集（メガ・専用アイテム判定用）
  const pokemonFixedItems = useMemo(() => {
    const names = new Set<string>();
    if (species.fixedItem) names.add(species.fixedItem);
    // allPokemonFixedItems が渡されていればそれも合算（フォームバリエーション対応）
    if (allPokemonFixedItems) {
      for (const name of allPokemonFixedItems) names.add(name);
    }
    return names;
  }, [species.fixedItem, allPokemonFixedItems]);

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
          // ポケモン専用カテゴリの場合は対応ポケモンかチェック
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

  const natureEffect = NATURE_EFFECTS_MAP[pokemon.nature] ?? [];
  const natureUp = natureEffect[0] as keyof Stats | undefined;
  const natureDown = natureEffect[1] as keyof Stats | undefined;

  /**
   * 実数値入力時のハンドラー
   * 実数値 → EV に逆算し、親に通知
   */
  function handleActualStatChange(stat: keyof Stats, targetStat: number) {
    const isHp = stat === 'hp';
    const baseStat = species.baseStats[stat];
    const natureModifier = isHp
      ? 1
      : getNatureModifier(pokemon.nature, stat as keyof Omit<Stats, 'hp'>);

    // 最も近い実現可能な EV を取得
    const { ev: newEv, actualStat } = findClosestRealizableEv(
      targetStat,
      baseStat,
      natureModifier,
      isHp
    );

    // 新しい EV 配置を計算して合計を確認
    const updatedEvs = { ...pokemon.evs, [stat]: newEv };
    const newTotal = Object.values(updatedEvs).reduce((sum, v) => sum + v, 0);

    // エラーハンドリング
    const errors: Partial<Record<keyof Stats, string>> = {};

    if (targetStat < 1) {
      errors[stat] = '1 以上の値が必要です';
    } else if (newEv > 32) {
      errors[stat] = `最大32ポイントで、実数値${actualStat}に調整しました`;
    } else if (newTotal > 66) {
      errors[stat] = `能力ポイント合計が超過しています（現在: ${newTotal}）`;
    }

    setActualStatErrors(errors);

    // EV を親に通知
    onChange({ evs: updatedEvs });
  }

  return (
    <div className="space-y-6">
      {/* ── 基本情報 ── */}
      <section className="space-y-3">
        <h4 className="border-b pb-1 text-sm font-bold text-gray-700">基本情報</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pokemon-nickname" className="text-xs font-medium text-gray-500">
              ニックネーム
            </label>
            <input
              id="pokemon-nickname"
              type="text"
              value={pokemon.nickname ?? ''}
              onChange={(e) => onChange({ nickname: e.target.value || undefined })}
              placeholder={species.nameJa}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
            />
          </div>
          <div>
            <label htmlFor="pokemon-level" className="text-xs font-medium text-gray-500">
              レベル
            </label>
            <input
              id="pokemon-level"
              type="number"
              min={1}
              max={100}
              value={pokemon.level}
              onChange={(e) =>
                onChange({ level: Math.min(100, Math.max(1, Number(e.target.value))) })
              }
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pokemon-gender" className="text-xs font-medium text-gray-500">
              性別
            </label>
            {species.genderRate === -1 ? (
              <div className="mt-0.5 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-400">
                性別なし
              </div>
            ) : species.genderRate === 0 ? (
              <div className="mt-0.5 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-500">
                ♂ オス（固定）
              </div>
            ) : species.genderRate === 8 ? (
              <div className="mt-0.5 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-500">
                ♀ メス（固定）
              </div>
            ) : (
              <select
                id="pokemon-gender"
                value={pokemon.gender ?? 'unknown'}
                onChange={(e) => onChange({ gender: e.target.value as Pokemon['gender'] })}
                className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="pokemon-item" className="text-xs font-medium text-gray-500">
              持ち物
            </label>
            {species.fixedItem ? (
              <div className="mt-0.5 flex items-center gap-1.5 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-500">
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
                className="mt-0.5 rounded border border-gray-200 text-sm"
              />
            )}
          </div>
        </div>
      </section>

      {/* ── 特性 ── */}
      <section className="space-y-2">
        <h4 className="border-b pb-1 text-sm font-bold text-gray-700">特性</h4>
        <div className="flex flex-wrap gap-2">
          {species.abilities.map((ab) => (
            <button
              key={ab.name}
              type="button"
              onClick={() => onChange({ ability: ab.name })}
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

      {/* ── テラスタイプ ── */}
      <section className="space-y-2">
        <h4 className="border-b pb-1 text-sm font-bold text-gray-700">テラスタイプ</h4>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ teraType: t })}
              className={`rounded-full border-2 px-2 py-1 text-[11px] font-semibold transition-all ${POKEMON_TYPE_COLORS[t]} text-white ${pokemon.teraType === t ? 'scale-110 border-gray-900 shadow-md' : 'border-transparent hover:scale-105'}`}
            >
              {POKEMON_TYPE_LABELS_JA[t]}
            </button>
          ))}
        </div>
      </section>

      {/* ── 性格 ── */}
      <section className="space-y-2">
        <h4 className="border-b pb-1 text-sm font-bold text-gray-700">性格</h4>
        <NatureSelector nature={pokemon.nature} onChange={(nature) => onChange({ nature })} />
      </section>

      {/* ── 技 ── */}
      <section className="space-y-3">
        <h4 className="border-b pb-1 text-sm font-bold text-gray-700">技（最大4つ）</h4>
        <MoveSlotEditor
          moves={pokemon.moves}
          species={species}
          onChange={(moves) => onChange({ moves })}
        />
      </section>

      {/* ── 個体値 ── */}
      <section className="space-y-2">
        <h4 className="border-b pb-1 text-sm font-bold text-gray-700">個体値 (IV)</h4>
        <IVInputGrid
          ivs={
            pokemon.ivs ?? {
              hp: 31,
              attack: 31,
              defense: 31,
              specialAttack: 31,
              specialDefense: 31,
              speed: 31,
            }
          }
          onChange={(ivs) => onChange({ ivs })}
        />
      </section>

      {/* ── 努力値 ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="flex-1 border-b pb-1 text-sm font-bold text-gray-700">努力値 (EV)</h4>
          <button
            type="button"
            onClick={() => setIsEVsOpen(!isEVsOpen)}
            className="rounded bg-pokemon-blue px-3 py-1 text-xs text-white transition-colors hover:bg-pokemon-blue/90"
          >
            {isEVsOpen ? '非表示' : '表示'}
          </button>
        </div>
        {isEVsOpen && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <EVSlider
              evs={pokemon.evs}
              natureUp={natureUp}
              natureDown={natureDown}
              onChange={(evs) => onChange({ evs })}
            />
          </div>
        )}
      </section>

      {/* ── メモ ── */}
      <section className="space-y-2">
        <label
          htmlFor="pokemon-memo"
          className="block border-b pb-1 text-sm font-bold text-gray-700"
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

      {/* ── 実数値（リアルタイム） ── */}
      <section className="space-y-2 rounded-xl bg-gray-50 p-4">
        <ActualStatsDisplay
          pokemon={pokemon}
          baseStats={species.baseStats}
          showEvContribution={true}
          onStatChange={handleActualStatChange}
          statErrors={actualStatErrors}
          actualStatInputs={actualStatInputs}
          onStatInputChange={(stat, value) => {
            setActualStatInputs((prev) => ({ ...prev, [stat]: value }));
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              handleActualStatChange(stat, num);
            }
          }}
          onStatInputBlur={(stat) => {
            setActualStatInputs((prev) => {
              const next = { ...prev };
              delete next[stat];
              return next;
            });
          }}
        />
      </section>
    </div>
  );
}
