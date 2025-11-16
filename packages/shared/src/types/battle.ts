import type { PokemonType } from './pokemon';

/** 対戦形式 */
export type BattleFormat = 'Ranked' | 'Casual' | 'Tournament' | 'Friendly';

/** 対戦結果 */
export type BattleResult = 'win' | 'lose' | 'draw';

/** 相手のポケモン情報 */
export interface OpponentPokemon {
  speciesName: string;
  item?: string;
  teraType?: PokemonType;
  moves?: string[];
}

/** 対戦記録 */
export interface Battle {
  id: string;
  date: Date;
  format: BattleFormat;
  result: BattleResult;
  partyId: string;
  selectedPokemonIds: string[];
  opponentParty?: OpponentPokemon[];
  memo?: string;
  videoUri?: string;
  videoThumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 対戦記録作成用の入力 */
export interface CreateBattleInput {
  date: Date;
  format: BattleFormat;
  result: BattleResult;
  partyId: string;
  selectedPokemonIds: string[];
  opponentParty?: OpponentPokemon[];
  memo?: string;
}
