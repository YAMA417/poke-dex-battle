'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Party, CreatePartyInput, UpdatePartyInput } from '@poke-dex-battle/shared';
import type { Pokemon } from '@poke-dex-battle/shared';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface PartyStore {
  parties: Party[];

  // パーティ CRUD
  createParty: (input: CreatePartyInput) => Party;
  updateParty: (id: string, input: UpdatePartyInput) => void;
  deleteParty: (id: string) => void;
  duplicateParty: (id: string) => Party | null;
  getParty: (id: string) => Party | undefined;

  // ポケモン操作
  addPokemon: (partyId: string, pokemon: Pokemon) => void;
  updatePokemon: (partyId: string, pokemonId: string, data: Partial<Pokemon>) => void;
  removePokemon: (partyId: string, pokemonId: string) => void;
}

export const usePartyStore = create<PartyStore>()(
  persist(
    immer((set, get) => ({
      parties: [],

      createParty: (input) => {
        const now = new Date();
        const party: Party = {
          id: generateId(),
          name: input.name,
          regulation: input.regulation,
          memo: input.memo,
          pokemons: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          state.parties.push(party);
        });
        return party;
      },

      updateParty: (id, input) => {
        set((state) => {
          const party = state.parties.find((p) => p.id === id);
          if (!party) return;
          if (input.name !== undefined) party.name = input.name;
          if (input.regulation !== undefined) party.regulation = input.regulation;
          if (input.memo !== undefined) party.memo = input.memo;
          party.updatedAt = new Date();
        });
      },

      deleteParty: (id) => {
        set((state) => {
          state.parties = state.parties.filter((p) => p.id !== id);
        });
      },

      duplicateParty: (id) => {
        const original = get().parties.find((p) => p.id === id);
        if (!original) return null;
        const now = new Date();
        const copy: Party = {
          ...original,
          id: generateId(),
          name: `${original.name} のコピー`,
          pokemons: original.pokemons.map((pk) => ({ ...pk, id: generateId() })),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          state.parties.push(copy);
        });
        return copy;
      },

      getParty: (id) => get().parties.find((p) => p.id === id),

      addPokemon: (partyId, pokemon) => {
        set((state) => {
          const party = state.parties.find((p) => p.id === partyId);
          if (!party || party.pokemons.length >= 6) return;
          party.pokemons.push({ ...pokemon, id: generateId() });
          party.updatedAt = new Date();
        });
      },

      updatePokemon: (partyId, pokemonId, data) => {
        set((state) => {
          const party = state.parties.find((p) => p.id === partyId);
          if (!party) return;
          const idx = party.pokemons.findIndex((pk) => pk.id === pokemonId);
          if (idx === -1) return;
          Object.assign(party.pokemons[idx], data);
          party.updatedAt = new Date();
        });
      },

      removePokemon: (partyId, pokemonId) => {
        set((state) => {
          const party = state.parties.find((p) => p.id === partyId);
          if (!party) return;
          party.pokemons = party.pokemons.filter((pk) => pk.id !== pokemonId);
          party.updatedAt = new Date();
        });
      },
    })),
    {
      name: 'poke-dex-battle-parties',
      // Date を JSON から復元するため reviver を設定
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // parties.[].createdAt / updatedAt を Date に復元
          if (parsed?.state?.parties) {
            parsed.state.parties = parsed.state.parties.map((p: Party) => ({
              ...p,
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt),
            }));
          }
          return parsed;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
