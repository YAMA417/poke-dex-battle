'use client';

import { useState, useMemo } from 'react';
import type {
  Pokemon,
  PokemonSpeciesData,
  Nature,
  PokemonType,
  Stats,
} from '@poke-dex-battle/shared';
import {
  findClosestRealizableEv,
  getNatureModifier,
  calcActualStats,
  POKEMON_TYPE_LABELS_JA,
} from '@poke-dex-battle/shared';
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
}

export function PokemonEditForm({ pokemon, species, items, onChange }: PokemonEditFormProps) {
  const [actualStatInputs, setActualStatInputs] = useState<Partial<Record<keyof Stats, string>>>(
    {}
  );
  const [actualStatErrors, setActualStatErrors] = useState<Partial<Record<keyof Stats, string>>>(
    {}
  );
  const [isEVsOpen, setIsEVsOpen] = useState<boolean>(false);

  // 対戦用アイテムの Autocomplete options（先頭に「なし」）
  const itemOptions = useMemo<AutocompleteOption[]>(() => {
    const competitive = items
      .filter((item) => item.isCompetitive)
      .map((item) => ({ label: item.nameJa, value: item.name, id: item.id }));
    return [{ label: 'なし', value: '', id: 'none' }, ...competitive];
  }, [items]);

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
    const iv = pokemon.ivs[stat];
    const natureModifier = isHp
      ? 1
      : getNatureModifier(pokemon.nature, stat as keyof Omit<Stats, 'hp'>);

    // 最も近い実現可能な EV を取得
    const { ev: newEv, actualStat } = findClosestRealizableEv(
      targetStat,
      baseStat,
      iv,
      pokemon.level,
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
    } else if (newEv > 252) {
      errors[stat] = `最大252EVで、実数値${actualStat}に調整しました`;
    } else if (newTotal > 510) {
      errors[stat] = `EV合計が超過しています（現在: ${newTotal}）`;
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
            <label className="text-xs font-medium text-gray-500">ニックネーム</label>
            <input
              type="text"
              value={pokemon.nickname ?? ''}
              onChange={(e) => onChange({ nickname: e.target.value || undefined })}
              placeholder={species.nameJa}
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pokemon-blue"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">レベル</label>
            <input
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
            <label className="text-xs font-medium text-gray-500">性別</label>
            <select
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
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">持ち物</label>
            {species.fixedItem ? (
              <div className="mt-0.5 flex items-center gap-1.5 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-500">
                <Lock size={12} className="shrink-0 text-gray-400" />
                <span>{species.fixedItemNameJa ?? species.fixedItem}</span>
              </div>
            ) : (
              <Autocomplete
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
        <IVInputGrid ivs={pokemon.ivs} onChange={(ivs) => onChange({ ivs })} />
      </section>

      {/* ── 努力値 ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="flex-1 border-b pb-1 text-sm font-bold text-gray-700">努力値 (EV)</h4>
          <button
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
