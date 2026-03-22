'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Regulation, Pokemon, PokemonSpeciesData } from '@poke-dex-battle/shared';
import { useAllPokemon, useAllItems } from '@/hooks/useApiData';
import { toSpeciesData } from '@/lib/api-adapters';
import { usePartyStore } from '@/hooks/use-party-store';
import { PokemonSearchModal } from '@/components/pokemon/PokemonSearchModal';
import { PokemonEditForm } from '@/components/pokemon/PokemonEditForm';
import { ChevronRight, ChevronLeft, Plus, Trash2, Check } from 'lucide-react';

type Step = 1 | 2 | 3;

const DEFAULT_POKEMON = (species: PokemonSpeciesData): Pokemon => ({
  id: '',
  speciesId: species.id,
  speciesName: species.name,
  nickname: undefined,
  level: 50,
  gender: 'unknown',
  nature: 'Hardy',
  ability: species.abilities[0]?.name ?? '',
  teraType: species.types[0],
  item: undefined,
  ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 },
  evs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
  moves: [],
  actualStats: undefined,
  spriteUrl: species.spriteUrl,
});

const STEPS: { label: string; desc: string }[] = [
  { label: 'パーティ情報', desc: '名前・レギュレーション・メモを設定' },
  { label: 'ポケモン選択', desc: '最大6匹を追加（後から変更可）' },
  { label: 'ポケモン編集', desc: '各ポケモンの詳細設定' },
];

interface PartyWizardProps {
  mode: 'create' | 'edit';
  initialPartyId?: string;
}

export function PartyWizard({ mode, initialPartyId }: PartyWizardProps) {
  const router = useRouter();
  const { createParty, updateParty, addPokemon, updatePokemon, removePokemon, getParty } =
    usePartyStore();

  const existingParty = initialPartyId ? getParty(initialPartyId) : undefined;

  // Step 1 state
  const [partyName, setPartyName] = useState(existingParty?.name ?? '');
  const [regulation, setRegulation] = useState<Regulation>(existingParty?.regulation ?? 'SV');

  // レギュレーション → DB regulation ID マッピング
  const regulationDbId = regulation === 'SV' ? 'sv-reg-i' : undefined;

  // API経由でレギュレーション対応ポケモンを取得
  const { data: allPokemonRaw } = useAllPokemon(regulationDbId);
  const allPokemonByName = useMemo(() => {
    if (!allPokemonRaw) return new Map<string, PokemonSpeciesData>();
    const map = new Map<string, PokemonSpeciesData>();
    for (const row of allPokemonRaw) {
      const sp = toSpeciesData(row);
      if (sp) {
        map.set(sp.nameJa, sp);
        map.set(sp.name, sp);
      }
    }
    return map;
  }, [allPokemonRaw]);

  // アイテムのID→日本語名マップ
  const { data: allItemsRaw } = useAllItems();
  const itemNameJaMap = useMemo(() => {
    if (!allItemsRaw) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const row of allItemsRaw) {
      if (row.id && row.nameJa) map.set(row.id, row.nameJa);
      if (row.name && row.nameJa) map.set(row.name, row.nameJa);
    }
    return map;
  }, [allItemsRaw]);

  const [memo, setMemo] = useState(existingParty?.memo ?? '');

  // Step 2/3 state
  const [pokemons, setPokemons] = useState<{ pokemon: Pokemon; species: PokemonSpeciesData }[]>([]);
  const [pokemonsInitialized, setPokemonsInitialized] = useState(false);

  // 既存パーティのポケモンをAPI取得後に復元
  useEffect(() => {
    if (pokemonsInitialized || !existingParty || allPokemonByName.size === 0) return;
    const restored = existingParty.pokemons.flatMap((pk) => {
      const sp = allPokemonByName.get(pk.speciesName);
      return sp ? [{ pokemon: pk, species: sp }] : [];
    });
    setPokemons(restored);
    setPokemonsInitialized(true);
  }, [existingParty, allPokemonByName, pokemonsInitialized]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number>(0);
  const [step, setStep] = useState<Step>(1);

  const [partyId, setPartyId] = useState<string | undefined>(initialPartyId);

  const step1Valid = partyName.trim().length > 0;
  const step2Valid = pokemons.length > 0;

  function handleSpeciesSelect(species: PokemonSpeciesData) {
    const poke = DEFAULT_POKEMON(species);
    // 固定アイテム・固定テラスタイプを自動設定
    if (species.fixedItem) {
      poke.item =
        species.fixedItemNameJa ?? itemNameJaMap.get(species.fixedItem) ?? species.fixedItem;
    }
    if (species.fixedTeraType) {
      poke.teraType = species.fixedTeraType as PokemonSpeciesData['types'][number];
    }
    // genderRate に応じた初期性別を設定
    if (species.genderRate === -1) {
      poke.gender = 'unknown';
    } else if (species.genderRate === 0) {
      poke.gender = 'male';
    } else if (species.genderRate === 8) {
      poke.gender = 'female';
    }
    setPokemons((prev) => [...prev, { pokemon: poke, species }]);
  }

  function handlePokemonChange(idx: number, data: Partial<Pokemon>) {
    setPokemons((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], pokemon: { ...next[idx].pokemon, ...data } };
      return next;
    });
  }

  function handleRemovePokemon(idx: number) {
    setPokemons((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx >= idx && editingIdx > 0) setEditingIdx(editingIdx - 1);
  }

  function handleSave() {
    // パーティ保存
    let savedId = partyId;
    if (!savedId) {
      const created = createParty({ name: partyName.trim(), regulation, memo: memo || undefined });
      savedId = created.id;
      setPartyId(savedId);
    } else {
      // 制御フロー分析のため、変数に再代入して型を確定
      const id = savedId;
      updateParty(id, { name: partyName.trim(), regulation, memo: memo || undefined });
      // 既存ポケモンは全削除して再追加（差分管理は将来対応）
      const existing = getParty(id);
      existing?.pokemons.forEach((pk) => removePokemon(id, pk.id));
    }

    // ポケモン追加
    pokemons.forEach(({ pokemon }) => {
      addPokemon(savedId, { ...pokemon, id: '' });
    });

    router.push(`/parties/${savedId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* ステップインジケータ */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((s, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={i} className="flex flex-1 items-center last:flex-none">
              <div className={`flex flex-col items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                    isActive
                      ? 'scale-110 border-pokemon-blue bg-pokemon-blue text-white shadow-lg'
                      : isDone
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-200 bg-white text-gray-300'
                  }`}
                >
                  {isDone ? <Check size={14} /> : stepNum}
                </div>
                <span
                  className={`mt-1 text-center text-[10px] font-medium ${isActive ? 'text-pokemon-blue' : isDone ? 'text-green-500' : 'text-gray-300'}`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 transition-all ${step > stepNum + 1 || (isDone && step > stepNum) ? 'bg-green-400' : 'bg-gray-100'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: パーティ情報 */}
      {step === 1 && (
        <div className="animate-fadeIn space-y-5 rounded-2xl bg-white p-6 shadow">
          <div>
            <h3 className="mb-1 text-lg font-bold text-gray-800">{STEPS[0].label}</h3>
            <p className="text-sm text-gray-400">{STEPS[0].desc}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              パーティ名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="例: 晴れパ 最新版"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokemon-blue"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-600">
              レギュレーション
            </label>
            <div className="flex gap-3">
              {(['SV', 'Champions'] as Regulation[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegulation(r)}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${regulation === r ? 'border-pokemon-blue bg-pokemon-blue text-white shadow' : 'border-gray-200 text-gray-500 hover:border-pokemon-blue'}`}
                >
                  {r === 'SV' ? 'スカーレット・バイオレット' : 'チャンピオンズ'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="パーティのコンセプトなど"
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokemon-blue"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${step1Valid ? 'bg-pokemon-blue text-white shadow hover:bg-blue-700 hover:shadow-lg' : 'cursor-not-allowed bg-gray-100 text-gray-300'}`}
            >
              次へ <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: ポケモン選択 */}
      {step === 2 && (
        <div className="animate-fadeIn space-y-5 rounded-2xl bg-white p-6 shadow">
          <div>
            <h3 className="mb-1 text-lg font-bold text-gray-800">{STEPS[1].label}</h3>
            <p className="text-sm text-gray-400">{STEPS[1].desc}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {pokemons.map(({ pokemon, species }, i) => (
              <div key={i} className="group relative flex flex-col items-center gap-1">
                <div
                  className="flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-gray-100 bg-gray-50 transition-all hover:border-pokemon-blue"
                  onClick={() => {
                    setEditingIdx(i);
                    setStep(3);
                  }}
                >
                  {species.spriteUrl ? (
                    <img
                      src={species.spriteUrl}
                      alt={species.nameJa}
                      width={56}
                      height={56}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-300">
                      {species.nameJa.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="w-full truncate text-center text-[10px] font-medium text-gray-600">
                  {species.nameJa}
                </span>
                <button
                  onClick={() => handleRemovePokemon(i)}
                  className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-red-400 text-white group-hover:flex"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            {pokemons.length < 6 && (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-pokemon-blue hover:bg-blue-50"
              >
                <Plus size={20} className="text-gray-300" />
                <span className="text-[10px] text-gray-300">追加</span>
              </button>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
            >
              <ChevronLeft size={16} /> 戻る
            </button>
            <button
              disabled={!step2Valid}
              onClick={() => setStep(3)}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${step2Valid ? 'bg-pokemon-blue text-white shadow hover:bg-blue-700' : 'cursor-not-allowed bg-gray-100 text-gray-300'}`}
            >
              次へ: 詳細設定 <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: ポケモン詳細編集 */}
      {step === 3 && pokemons.length > 0 && (
        <div className="animate-fadeIn overflow-hidden rounded-2xl bg-white shadow">
          {/* ポケモン切り替えタブ */}
          <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50">
            {pokemons.map(({ species }, i) => (
              <button
                key={i}
                onClick={() => setEditingIdx(i)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${editingIdx === i ? 'border-pokemon-blue bg-white text-pokemon-blue' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {species.spriteUrl ? (
                  <img
                    src={species.spriteUrl}
                    alt=""
                    width={24}
                    height={24}
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
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {pokemons[editingIdx] && (
              <PokemonEditForm
                key={editingIdx}
                pokemon={pokemons[editingIdx].pokemon}
                species={pokemons[editingIdx].species}
                items={allItemsRaw ?? []}
                onChange={(data) => handlePokemonChange(editingIdx, data)}
              />
            )}
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
            >
              <ChevronLeft size={16} /> ポケモン一覧
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-green-600 hover:shadow-lg"
            >
              <Check size={16} /> {mode === 'create' ? '保存して完了' : '変更を保存'}
            </button>
          </div>
        </div>
      )}

      <PokemonSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSpeciesSelect}
        disabledIds={pokemons.map((p) => p.species.id)}
        regulation={regulationDbId}
      />
    </div>
  );
}
