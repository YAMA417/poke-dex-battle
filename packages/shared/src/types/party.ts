import type { Pokemon } from './pokemon';

/** パーティ関連定数 */
export const MAX_PARTY_SIZE = 6;
export const MAX_ABILITY_POINT_TOTAL = 66;
export const MAX_ABILITY_POINT_PER_STAT = 32;
export const MAX_MOVE_COUNT = 4;

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
