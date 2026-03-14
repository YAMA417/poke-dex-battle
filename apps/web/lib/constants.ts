import type { Stats } from '@poke-dex-battle/shared';

/**
 * Pokémon type color mappings for Tailwind CSS classes
 */
export const POKEMON_TYPE_COLORS: Record<string, string> = {
  Normal: 'bg-gray-400',
  Fire: 'bg-orange-500',
  Water: 'bg-blue-500',
  Electric: 'bg-yellow-400',
  Grass: 'bg-green-500',
  Ice: 'bg-cyan-300',
  Fighting: 'bg-red-700',
  Poison: 'bg-purple-500',
  Ground: 'bg-yellow-600',
  Flying: 'bg-indigo-300',
  Psychic: 'bg-pink-500',
  Bug: 'bg-lime-500',
  Rock: 'bg-yellow-800',
  Ghost: 'bg-purple-800',
  Dragon: 'bg-indigo-700',
  Dark: 'bg-gray-800',
  Steel: 'bg-gray-500',
  Fairy: 'bg-pink-300',
};

/**
 * Nature stat modifier mappings: [+stat, -stat]
 */
export const NATURE_EFFECTS_MAP: Record<string, (keyof Omit<Stats, 'hp'>)[]> = {
  Lonely: ['attack', 'defense'],
  Brave: ['attack', 'speed'],
  Adamant: ['attack', 'specialAttack'],
  Naughty: ['attack', 'specialDefense'],
  Bold: ['defense', 'attack'],
  Relaxed: ['defense', 'speed'],
  Impish: ['defense', 'specialAttack'],
  Lax: ['defense', 'specialDefense'],
  Timid: ['speed', 'attack'],
  Hasty: ['speed', 'defense'],
  Jolly: ['speed', 'specialAttack'],
  Naive: ['speed', 'specialDefense'],
  Modest: ['specialAttack', 'attack'],
  Mild: ['specialAttack', 'defense'],
  Quiet: ['specialAttack', 'speed'],
  Rash: ['specialAttack', 'specialDefense'],
  Calm: ['specialDefense', 'attack'],
  Gentle: ['specialDefense', 'defense'],
  Sassy: ['specialDefense', 'speed'],
  Careful: ['specialDefense', 'specialAttack'],
  Hardy: [],
  Docile: [],
  Serious: [],
  Bashful: [],
  Quirky: [],
};
