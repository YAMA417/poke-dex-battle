/**
 * pokemon-showdown から技フラグを抽出して moves.csv に追加するスクリプト
 *
 * 処理フロー:
 * 1. moves.csv を読み込む
 * 2. pokemon-showdown の Dex.mod('gen9') で各技のフラグを取得
 * 3. CSVにフラグ列を追加して書き戻す
 *
 * 実行: npx tsx packages/db/scripts/extract-move-flags.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Dex } from 'pokemon-showdown';

const EXPORT_DIR = resolve(__dirname, '../export');

/** pokemon-showdown 互換の ID 変換 */
function toID(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// ---------------------------------------------------------------------------
// CSV パーサー（BOM対応・クォート対応）
// ---------------------------------------------------------------------------

function parseCsv(filePath: string): { headers: string[]; rows: Record<string, string>[] } {
  const content = readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = content.split('\n');

  function parseRow(line: string): string[] {
    const fields: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        fields.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    fields.push(cur);
    return fields;
  }

  const nonEmpty = lines.filter((l) => l.trim());
  const headers = parseRow(nonEmpty[0]);
  const rows = nonEmpty.slice(1).map((line) => {
    const vals = parseRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
  return { headers, rows };
}

// ---------------------------------------------------------------------------
// フラグ列名定義
// ---------------------------------------------------------------------------

const FLAG_COLUMNS = [
  'is_contact',
  'is_punch',
  'is_bite',
  'is_aura',
  'is_recoil',
  'is_slicing',
  'is_sound',
  'is_bullet',
  'is_wind',
  'has_secondary_effect',
  'uses_defense_as_attack',
  'targets_physical_defense',
  'uses_target_attack',
] as const;

// ---------------------------------------------------------------------------
// メイン処理
// ---------------------------------------------------------------------------

function main() {
  const dex = Dex.mod('gen9');
  const csvPath = resolve(EXPORT_DIR, 'moves.csv');
  const { headers, rows } = parseCsv(csvPath);

  // 既存のフラグ列を削除（再実行対応）
  const cleanHeaders = headers.filter((h) => !FLAG_COLUMNS.includes(h as any));

  let matched = 0;
  let unmatched = 0;

  const updatedRows = rows.map((row) => {
    const moveId = toID(row.name_en || '');
    const moveData = dex.moves.get(moveId);

    const flags: Record<string, string> = {};

    if (moveData && moveData.exists) {
      matched++;
      const f = moveData.flags || {};

      flags.is_contact = f.contact ? 'true' : '';
      flags.is_punch = f.punch ? 'true' : '';
      flags.is_bite = f.bite ? 'true' : '';
      flags.is_aura = f.pulse ? 'true' : ''; // Showdownでは pulse = 波動技
      flags.is_recoil = moveData.recoil || moveData.hasCrashDamage ? 'true' : '';
      flags.is_slicing = f.slicing ? 'true' : '';
      flags.is_sound = f.sound ? 'true' : '';
      flags.is_bullet = f.bullet ? 'true' : '';
      flags.is_wind = f.wind ? 'true' : '';
      flags.has_secondary_effect =
        moveData.secondary || (moveData.secondaries && moveData.secondaries.length > 0)
          ? 'true'
          : '';

      // 特殊ステータス参照
      flags.uses_defense_as_attack = moveData.overrideOffensiveStat === 'def' ? 'true' : '';
      flags.targets_physical_defense = moveData.overrideDefensiveStat === 'def' ? 'true' : '';
      flags.uses_target_attack =
        (moveData as any).overrideOffensivePokemon === 'target' ? 'true' : '';
    } else {
      unmatched++;
      // フラグなし
      for (const col of FLAG_COLUMNS) {
        flags[col] = '';
      }
    }

    return { ...Object.fromEntries(cleanHeaders.map((h) => [h, row[h] ?? ''])), ...flags };
  });

  // CSV書き出し
  const outputHeaders = [...cleanHeaders, ...FLAG_COLUMNS];

  function escapeField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  const csvContent =
    outputHeaders.join(',') +
    '\n' +
    updatedRows
      .map((row) => outputHeaders.map((h) => escapeField(row[h] ?? '')).join(','))
      .join('\n') +
    '\n';

  writeFileSync(csvPath, csvContent, 'utf-8');

  console.log(`完了: ${matched}件マッチ, ${unmatched}件不一致`);
  console.log(`出力: ${csvPath}`);
}

main();
