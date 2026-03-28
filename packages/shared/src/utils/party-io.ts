import type { Party } from '../types/party';
import { validatePartyImport } from './party-validation';

/**
 * Type guard to check if value is an array of objects
 */
function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null);
}

/**
 * パーティ配列をJSON文字列に変換
 */
export function exportPartiesToJson(parties: Party[]): string {
  return JSON.stringify(parties, null, 2);
}

/**
 * JSON文字列からパーティ配列をインポート
 * バリデーションエラーがある場合は例外をスローする
 */
export function importPartiesFromJson(json: string): Party[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('JSONの解析に失敗しました。ファイルの形式を確認してください。');
  }

  const result = validatePartyImport(parsed);
  if (!result.valid) {
    throw new Error(`インポートデータが不正です:\n${result.errors.join('\n')}`);
  }

  // Type guard to ensure parsed is array of objects after validation
  if (!isRecordArray(parsed)) {
    throw new Error('パーティデータの形式が不正です。');
  }

  // 日付文字列を Date オブジェクトに変換
  const parties = parsed.map((p) => ({
    ...p,
    createdAt: new Date(String(p['createdAt'])),
    updatedAt: new Date(String(p['updatedAt'])),
    pokemons: Array.isArray(p['pokemons']) ? p['pokemons'] : [],
  })) as Party[];

  return parties;
}
