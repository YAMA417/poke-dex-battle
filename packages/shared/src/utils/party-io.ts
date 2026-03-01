import type { Party } from '../types/party';
import { validatePartyImport } from './party-validation';

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

    // 日付文字列を Date オブジェクトに変換
    const parties = (parsed as Record<string, unknown>[]).map((p) => ({
        ...p,
        createdAt: new Date(p['createdAt'] as string),
        updatedAt: new Date(p['updatedAt'] as string),
        pokemons: Array.isArray(p['pokemons']) ? p['pokemons'] : [],
    })) as Party[];

    return parties;
}
