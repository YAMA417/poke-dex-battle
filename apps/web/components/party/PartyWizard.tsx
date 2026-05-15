'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Pokemon, PokemonSpeciesData } from '@poke-dex-battle/shared';
import { isPokemonType } from '@poke-dex-battle/shared';
import {
  useAllPokemon,
  useAllItems,
  useRegulations,
  type RegulationData,
} from '@/hooks/useApiData';
import { toSpeciesData } from '@/lib/api-adapters';
import { usePartyStore } from '@/hooks/use-party-store';
import { PokemonSearchModal } from '@/components/pokemon/PokemonSearchModal';
import { Check } from 'lucide-react';
import { WizardStep1Regulation } from '@/components/party/wizard/WizardStep1Regulation';
import { WizardStep2Selection } from '@/components/party/wizard/WizardStep2Selection';
import { WizardStep3Edit } from '@/components/party/wizard/WizardStep3Edit';
import { WizardStep4Save } from '@/components/party/wizard/WizardStep4Save';

type Step = 1 | 2 | 3 | 4;

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
  abilityPoints: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
  moves: [],
  actualStats: undefined,
  spriteUrl: species.spriteUrl,
});

const STEPS: { label: string; desc: string }[] = [
  { label: 'レギュレーション', desc: 'バトルルールを選択' },
  { label: 'ポケモン選択', desc: '最大6匹を追加（後から変更可）' },
  { label: 'ポケモン編集', desc: '各ポケモンの詳細設定' },
  { label: 'パーティ情報', desc: '名前・メモを設定して保存' },
];

interface PartyWizardProps {
  mode: 'create' | 'edit';
  initialPartyId?: string;
  initialEditingIdx?: number;
}

export function PartyWizard({
  mode,
  initialPartyId,
  initialEditingIdx,
}: PartyWizardProps): React.JSX.Element {
  const router = useRouter();
  const { createParty, updateParty, addPokemon, removePokemon, getParty } = usePartyStore();

  const existingParty = initialPartyId ? getParty(initialPartyId) : undefined;

  // レギュレーション一覧を取得
  const { data: allRegulations } = useRegulations();

  // Step 1 state: レギュレーション選択
  const [regulation, setRegulation] = useState<string>(existingParty?.regulation ?? '');
  const [selectedRegulation, setSelectedRegulation] = useState<RegulationData | null>(null);

  // 編集モードの初回マウント: レギュレーション自動設定 & Step2へスキップ
  const [editModeSkipped, setEditModeSkipped] = useState(false);
  useEffect(() => {
    if (mode === 'edit' && existingParty && allRegulations && !editModeSkipped) {
      const found = allRegulations.find((r) => r.name === existingParty.regulation);
      if (found) {
        setRegulation(found.name);
        setSelectedRegulation(found);
      }
      setStep(2);
      setEditModeSkipped(true);
    }
  }, [mode, existingParty, allRegulations, editModeSkipped]);

  // 新規作成モード: レギュレーション選択時に自動設定
  useEffect(() => {
    if (mode === 'create' && allRegulations && allRegulations.length > 0 && !regulation) {
      const first = allRegulations[0];
      setRegulation(first.name);
      setSelectedRegulation(first);
    }
  }, [mode, allRegulations, regulation]);

  // レギュレーション名からAPI取得用のポケモンプール連動
  const regulationName = selectedRegulation?.name;

  // API経由でレギュレーション対応ポケモンを取得
  const { data: allPokemonRaw } = useAllPokemon(regulationName);
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
      if (row.id && row.nameJa) map.set(String(row.id), row.nameJa);
      if (row.name && row.nameJa) map.set(row.name, row.nameJa);
    }
    return map;
  }, [allItemsRaw]);

  // Step 4 state: パーティ情報
  const [partyName, setPartyName] = useState(existingParty?.name ?? '');
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

  // initialEditingIdx が指定された場合、ポケモン読み込み完了後に Step3 へジャンプ
  const jumpedToStep3 = useRef(false);
  useEffect(() => {
    if (pokemonsInitialized && initialEditingIdx !== undefined && !jumpedToStep3.current) {
      jumpedToStep3.current = true;
      setEditingIdx(initialEditingIdx);
      setStep(3);
    }
  }, [pokemonsInitialized, initialEditingIdx]);

  // Step2: 差し替えモード用 state
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);

  // フォームバリエーション逆引き用に全ポケモン（レギュレーション制限なし）を取得
  const { data: allPokemonUnfiltered } = useAllPokemon();

  // 選択中ポケモンのフォームバリエーション（メガ等）の fixedItem を収集
  const editingPokemonFixedItems = useMemo(() => {
    if (!allPokemonUnfiltered || pokemons.length === 0) return new Set<string>();
    const editingSpecies = pokemons[editingIdx]?.species;
    if (!editingSpecies) return new Set<string>();

    const names = new Set<string>();
    // ベースフォームの fixedItem
    if (editingSpecies.fixedItem) names.add(editingSpecies.fixedItem);

    // 全ポケモンからベースフォームIDが一致するフォームの fixedItem を収集
    const baseRow = allPokemonUnfiltered.find((r) => r.name === editingSpecies.name);
    if (baseRow) {
      for (const row of allPokemonUnfiltered) {
        if (row.baseFormId === baseRow.id && row.fixedItem) {
          names.add(row.fixedItem);
        }
      }
    }
    return names;
  }, [allPokemonUnfiltered, pokemons, editingIdx]);
  const [step, setStep] = useState<Step>(1);

  const [partyId, setPartyId] = useState<string | undefined>(initialPartyId);

  const step2Valid = pokemons.length > 0;
  const step4Valid = partyName.trim().length > 0;

  function handleRegulationSelect(reg: RegulationData): void {
    setRegulation(reg.name);
    setSelectedRegulation(reg);
  }

  function handleSpeciesSelect(species: PokemonSpeciesData): void {
    const poke = DEFAULT_POKEMON(species);
    // 固定アイテム・固定テラスタイプを自動設定
    if (species.fixedItem) {
      poke.item =
        species.fixedItemNameJa ?? itemNameJaMap.get(species.fixedItem) ?? species.fixedItem;
    }
    if (species.fixedTeraType && isPokemonType(species.fixedTeraType)) {
      poke.teraType = species.fixedTeraType;
    }
    // genderRate に応じた初期性別を設定
    if (species.genderRate === -1) {
      poke.gender = 'unknown';
    } else if (species.genderRate === 0) {
      poke.gender = 'male';
    } else if (species.genderRate === 8) {
      poke.gender = 'female';
    }

    if (replacingIdx !== null) {
      // 差し替えモード: 指定インデックスのポケモンを入れ替え
      setPokemons((prev) => {
        const next = [...prev];
        next[replacingIdx] = { pokemon: poke, species };
        return next;
      });
      setReplacingIdx(null);
    } else {
      // 追加モード
      setPokemons((prev) => {
        const next = [...prev, { pokemon: poke, species }];
        // Step3 表示中は追加したポケモンを自動的に選択
        if (step === 3) {
          setEditingIdx(next.length - 1);
        }
        return next;
      });
    }
  }

  function handlePokemonChange(idx: number, data: Partial<Pokemon>): void {
    setPokemons((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], pokemon: { ...next[idx].pokemon, ...data } };
      return next;
    });
  }

  function handleRemovePokemon(idx: number): void {
    setPokemons((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx >= idx && editingIdx > 0) setEditingIdx(editingIdx - 1);
  }

  function handleSave(): void {
    // パーティ保存
    let savedId = partyId;
    if (!savedId) {
      const created = createParty({
        name: partyName.trim(),
        regulation,
        memo: memo || undefined,
      });
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

  // Step2のdisabledIds: 差し替えモード時は自分自身を除外
  const searchDisabledIds = useMemo(() => {
    const ids = pokemons.map((p) => p.species.id);
    if (replacingIdx !== null) {
      const replacingId = pokemons[replacingIdx]?.species.id;
      return ids.filter((id) => id !== replacingId);
    }
    return ids;
  }, [pokemons, replacingIdx]);

  return (
    <div
      className={`mx-auto ${step === 3 ? 'max-w-5xl' : 'max-w-2xl'} transition-all duration-300`}
    >
      {/* ステップインジケータ */}
      <div className="mx-auto mb-8 flex max-w-2xl items-center gap-0">
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

      {/* Step 1: レギュレーション選択 */}
      {step === 1 && (
        <WizardStep1Regulation
          label={STEPS[0].label}
          desc={STEPS[0].desc}
          regulation={regulation}
          allRegulations={allRegulations}
          onRegulationSelect={handleRegulationSelect}
          onNext={() => setStep(2)}
        />
      )}

      {/* Step 2: ポケモン選択 */}
      {step === 2 && (
        <WizardStep2Selection
          label={STEPS[1].label}
          desc={STEPS[1].desc}
          pokemons={pokemons}
          isValid={step2Valid}
          mode={mode}
          onReplace={(i) => {
            setReplacingIdx(i);
            setSearchOpen(true);
          }}
          onAdd={() => {
            setReplacingIdx(null);
            setSearchOpen(true);
          }}
          onRemove={handleRemovePokemon}
          onBack={() => {
            if (mode === 'edit') {
              // 編集モードではStep1を飛ばしてポケモン一覧に戻る
              router.back();
            } else {
              setStep(1);
            }
          }}
          onNext={() => setStep(3)}
        />
      )}

      {/* Step 3: ポケモン詳細編集 */}
      {step === 3 && (
        <WizardStep3Edit
          pokemons={pokemons}
          editingIdx={editingIdx}
          items={allItemsRaw ?? []}
          battleSystems={selectedRegulation?.battleSystems ?? []}
          allPokemonFixedItems={editingPokemonFixedItems}
          onEditingIdxChange={setEditingIdx}
          onAdd={() => {
            setReplacingIdx(null);
            setSearchOpen(true);
          }}
          onPokemonChange={handlePokemonChange}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {/* Step 4: パーティ情報・保存 */}
      {step === 4 && (
        <WizardStep4Save
          label={STEPS[3].label}
          desc={STEPS[3].desc}
          partyName={partyName}
          regulation={regulation}
          memo={memo}
          mode={mode}
          isValid={step4Valid}
          onPartyNameChange={setPartyName}
          onMemoChange={setMemo}
          onBack={() => setStep(3)}
          onSave={handleSave}
        />
      )}

      <PokemonSearchModal
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setReplacingIdx(null);
        }}
        onSelect={handleSpeciesSelect}
        disabledIds={searchDisabledIds}
        regulation={regulationName}
      />
    </div>
  );
}
