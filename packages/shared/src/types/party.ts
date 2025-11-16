import type { Pokemon } from './pokemon';

/** レギュレーション */
export type Regulation = 'SV' | 'Champions';

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
