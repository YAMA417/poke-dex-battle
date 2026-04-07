/**
 * pokemon.csv の sprite_url を DB の pokemon テーブルに反映するスクリプト
 *
 * 動作:
 *   CSV の include=○ かつ sprite_url が設定されている行について
 *   DB の pokemon テーブルを slug で特定して UPDATE する
 *
 * 実行: npm run db:update-sprites -w @poke-dex-battle/db
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { pokemon } from './schema';

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: resolve(__dirname, '../../../apps/web/.env.local') });
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL が設定されていません');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

const CSV_PATH = resolve(__dirname, '../export/pokemon.csv');

function parseCsv(filePath: string): Record<string, string>[] {
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
  return nonEmpty.slice(1).map((line) => {
    const vals = parseRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

async function main() {
  console.log('=== update_sprite_urls 開始 ===\n');

  const rows = parseCsv(CSV_PATH).filter((r) => r['include'] === '○' && r['sprite_url']);
  console.log(`更新対象: ${rows.length} 件`);

  let updated = 0;
  let warned = 0;

  for (const row of rows) {
    const result = await db
      .update(pokemon)
      .set({ spriteUrl: row['sprite_url'] })
      .where(eq(pokemon.slug, row['slug']))
      .returning({ slug: pokemon.slug });

    if (result.length === 0) {
      console.warn(`  [WARN] slug not found in DB: ${row['slug']}`);
      warned++;
    } else {
      updated++;
    }

    if (updated % 100 === 0 && updated > 0) {
      process.stdout.write(`\r  進捗: ${updated} / ${rows.length}`);
    }
  }

  process.stdout.write(`\r  進捗: ${updated + warned} / ${rows.length}\n`);
  console.log('\n=== サマリー ===');
  console.log(`  更新成功 : ${updated} 件`);
  if (warned > 0) console.log(`  WARN     : ${warned} 件（DB に slug が存在しない）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.end());
