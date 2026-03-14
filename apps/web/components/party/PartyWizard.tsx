'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Regulation, Pokemon, PokemonSpeciesData } from '@poke-dex-battle/shared';
import { getPokemonByName } from '@poke-dex-battle/shared';
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
    const { createParty, updateParty, addPokemon, updatePokemon, removePokemon, getParty } = usePartyStore();

    const existingParty = initialPartyId ? getParty(initialPartyId) : undefined;

    // Step 1 state
    const [partyName, setPartyName] = useState(existingParty?.name ?? '');
    const [regulation, setRegulation] = useState<Regulation>(existingParty?.regulation ?? 'SV');
    const [memo, setMemo] = useState(existingParty?.memo ?? '');

    // Step 2/3 state
    const [pokemons, setPokemons] = useState<{ pokemon: Pokemon; species: PokemonSpeciesData }[]>(() => {
        if (!existingParty) return [];
        return existingParty.pokemons.flatMap((pk) => {
            const sp = getPokemonByName(pk.speciesName);
            return sp ? [{ pokemon: pk, species: sp }] : [];
        });
    });
    const [searchOpen, setSearchOpen] = useState(false);
    const [editingIdx, setEditingIdx] = useState<number>(0);
    const [step, setStep] = useState<Step>(1);

    const [partyId, setPartyId] = useState<string | undefined>(initialPartyId);

    const step1Valid = partyName.trim().length > 0;
    const step2Valid = pokemons.length > 0;

    function handleSpeciesSelect(species: PokemonSpeciesData) {
        setPokemons((prev) => [...prev, { pokemon: DEFAULT_POKEMON(species), species }]);
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
        <div className="max-w-2xl mx-auto">
            {/* ステップインジケータ */}
            <div className="flex items-center gap-0 mb-8">
                {STEPS.map((s, i) => {
                    const stepNum = (i + 1) as Step;
                    const isActive = step === stepNum;
                    const isDone = step > stepNum;
                    return (
                        <div key={i} className="flex items-center flex-1 last:flex-none">
                            <div className={`flex flex-col items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                  ${isActive ? 'bg-pokemon-blue text-white border-pokemon-blue shadow-lg scale-110' :
                                        isDone ? 'bg-green-500 text-white border-green-500' :
                                            'bg-white text-gray-300 border-gray-200'}`}>
                                    {isDone ? <Check size={14} /> : stepNum}
                                </div>
                                <span className={`text-[10px] mt-1 text-center font-medium ${isActive ? 'text-pokemon-blue' : isDone ? 'text-green-500' : 'text-gray-300'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-1 transition-all ${step > stepNum + 1 || (isDone && step > stepNum) ? 'bg-green-400' : 'bg-gray-100'}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step 1: パーティ情報 */}
            {step === 1 && (
                <div className="bg-white rounded-2xl shadow p-6 space-y-5 animate-fadeIn">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{STEPS[0].label}</h3>
                        <p className="text-sm text-gray-400">{STEPS[0].desc}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">パーティ名 <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            value={partyName}
                            onChange={(e) => setPartyName(e.target.value)}
                            placeholder="例: 晴れパ 最新版"
                            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pokemon-blue"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-2">レギュレーション</label>
                        <div className="flex gap-3">
                            {(['SV', 'Champions'] as Regulation[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRegulation(r)}
                                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                    ${regulation === r ? 'bg-pokemon-blue text-white border-pokemon-blue shadow' : 'border-gray-200 text-gray-500 hover:border-pokemon-blue'}`}
                                >
                                    {r === 'SV' ? 'スカーレット・バイオレット' : 'チャンピオンズ'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">メモ（任意）</label>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            rows={2}
                            placeholder="パーティのコンセプトなど"
                            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pokemon-blue resize-none"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            disabled={!step1Valid}
                            onClick={() => setStep(2)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all
                ${step1Valid ? 'bg-pokemon-blue text-white hover:bg-blue-700 shadow hover:shadow-lg' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >
                            次へ <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: ポケモン選択 */}
            {step === 2 && (
                <div className="bg-white rounded-2xl shadow p-6 space-y-5 animate-fadeIn">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{STEPS[1].label}</h3>
                        <p className="text-sm text-gray-400">{STEPS[1].desc}</p>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {pokemons.map(({ pokemon, species }, i) => (
                            <div key={i} className="relative group flex flex-col items-center gap-1">
                                <div className="w-full aspect-square bg-gray-50 rounded-xl border-2 border-gray-100 flex items-center justify-center overflow-hidden hover:border-pokemon-blue transition-all cursor-pointer"
                                    onClick={() => { setEditingIdx(i); setStep(3); }}>
                                    <img
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species.id}.png`}
                                        alt={species.nameJa}
                                        width={56} height={56}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium truncate w-full text-center">{species.nameJa}</span>
                                <button
                                    onClick={() => handleRemovePokemon(i)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-400 text-white rounded-full hidden group-hover:flex items-center justify-center"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        ))}
                        {pokemons.length < 6 && (
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-pokemon-blue hover:bg-blue-50 transition-all"
                            >
                                <Plus size={20} className="text-gray-300" />
                                <span className="text-[10px] text-gray-300">追加</span>
                            </button>
                        )}
                    </div>
                    <div className="flex justify-between pt-2">
                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <ChevronLeft size={16} /> 戻る
                        </button>
                        <button
                            disabled={!step2Valid}
                            onClick={() => setStep(3)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all
                ${step2Valid ? 'bg-pokemon-blue text-white hover:bg-blue-700 shadow' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >
                            次へ: 詳細設定 <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: ポケモン詳細編集 */}
            {step === 3 && pokemons.length > 0 && (
                <div className="bg-white rounded-2xl shadow overflow-hidden animate-fadeIn">
                    {/* ポケモン切り替えタブ */}
                    <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50">
                        {pokemons.map(({ species }, i) => (
                            <button
                                key={i}
                                onClick={() => setEditingIdx(i)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold shrink-0 border-b-2 transition-all
                  ${editingIdx === i ? 'border-pokemon-blue text-pokemon-blue bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                <img
                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species.id}.png`}
                                    alt=""
                                    width={24} height={24}
                                    className="w-6 h-6 object-contain"
                                />
                                {species.nameJa}
                            </button>
                        ))}
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {pokemons[editingIdx] && (
                            <PokemonEditForm
                                key={editingIdx}
                                pokemon={pokemons[editingIdx].pokemon}
                                species={pokemons[editingIdx].species}
                                onChange={(data) => handlePokemonChange(editingIdx, data)}
                            />
                        )}
                    </div>
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            <ChevronLeft size={16} /> ポケモン一覧
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 shadow hover:shadow-lg transition-all"
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
            />
        </div>
    );
}
