import type { Pokemon } from './pokemon';

/** パーティ関連定数 */
export const MAX_PARTY_SIZE = 6;
export const MAX_EV_TOTAL = 510;
export const MAX_EV_PER_STAT = 252;
export const MAX_MOVE_COUNT = 4;
export const MAX_EV_CONTRIBUTION_TO_ACTUAL_STATS = 65;

/** レギュレーション */
export type Regulation = 'Champions';

/** パーティ */
export interface Party {
  id: string;
  name: string;
  regulation: Regulation;
  memo?: string;
  pokemons: Pokemon[];
  createdAt: Date;
  updatedAt: Date;
}

/** パーティ作成用の入力 */
export interface CreatePartyInput {
  name: string;
  regulation: Regulation;
  memo?: string;
}

/** パーティ更新用の入力 */
export interface UpdatePartyInput {
  name?: string;
  regulation?: Regulation;
  memo?: string;
}
