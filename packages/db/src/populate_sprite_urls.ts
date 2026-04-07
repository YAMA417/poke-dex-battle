/**
 * pokemon.csv の sprite_url 列を PokeAPI スプライト URL で埋めるスクリプト
 *
 * 動作:
 *   1. PokeAPI から全ポケモンリストを1回取得し name→id マップを構築
 *   2. CSV の include=○ かつ sprite_url が空の行を対象に処理
 *      - slug が name→id マップにあれば id を取得
 *      - なければ例外マッピングで PokeAPI 名に変換して再検索
 *      - それでも解決できない場合は num を id として使用（numフォールバック）
 *   3. 一時ファイルに書き出してからリネーム（atomic write）
 *
 * 実行: npm run db:populate-sprites -w @poke-dex-battle/db
 */
import { readFileSync, writeFileSync, renameSync } from 'fs';
import { resolve } from 'path';

const CSV_PATH = resolve(__dirname, '../export/pokemon.csv');
const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
// PokeAPI 全件取得上限（2026年3月時点で約1350件。余裕を持って2000に設定）
const POKEAPI_FETCH_LIMIT = 2000;

// ---------------------------------------------------------------------------
// 例外マッピング: CSV slug → PokeAPI 名
// 事前調査により確定済み
// ---------------------------------------------------------------------------
const SLUG_EXCEPTIONS: Record<string, string> = {
  urshifu: 'urshifu-single-strike',
  palafin: 'palafin-zero',
  'tauros-paldea-combat': 'tauros-paldea-combat-breed',
  'tauros-paldea-blaze': 'tauros-paldea-blaze-breed',
  'tauros-paldea-aqua': 'tauros-paldea-aqua-breed',
  'greninja-bond': 'greninja-ash',
  'meowstic-f': 'meowstic-female',
  'rockruff-dusk': 'rockruff-own-tempo',
  'minior-meteor': 'minior-red-meteor',
  'necrozma-dusk-mane': 'necrozma-dusk',
  'necrozma-dawn-wings': 'necrozma-dawn',
  'indeedee-f': 'indeedee-female',
  'basculegion-f': 'basculegion-female',
  'oinkologne-f': 'oinkologne-female',
  'ogerpon-cornerstone': 'ogerpon-cornerstone-mask',
  'ogerpon-hearthflame': 'ogerpon-hearthflame-mask',
  'ogerpon-wellspring': 'ogerpon-wellspring-mask',
  // テラ形態は対応するマスク形態と同じスプライトを使用（PokeAPIにテラ形態の個別エントリなし）
  'ogerpon-cornerstone-tera': 'ogerpon-cornerstone-mask',
  'ogerpon-hearthflame-tera': 'ogerpon-hearthflame-mask',
  'ogerpon-teal-tera': 'ogerpon',
  'ogerpon-wellspring-tera': 'ogerpon-wellspring-mask',
};

// ---------------------------------------------------------------------------
// CSV パーサー（BOM対応・クォート対応）
// ---------------------------------------------------------------------------

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

function writeCsv(filePath: string, rows: Record<string, string>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);

  function escapeField(val: string): string {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  const lines = [
    '\uFEFF' + headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeField(r[h] ?? '')).join(',')),
  ];
  const tmp = filePath + '.tmp';
  writeFileSync(tmp, lines.join('\n'), 'utf-8');
  renameSync(tmp, filePath);
}

// ---------------------------------------------------------------------------
// PokeAPI 全件取得
// ---------------------------------------------------------------------------

async function fetchPokeApiNameToId(): Promise<Map<string, number>> {
  console.log('PokeAPI から全ポケモンリストを取得中...');
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${POKEAPI_FETCH_LIMIT}`, {
    headers: { 'User-Agent': 'poke-dex-battle-dev/1.0' },
  });
  if (!res.ok) throw new Error(`PokeAPI fetch failed: HTTP ${res.status}`);

  const data = (await res.json()) as { results: { name: string; url: string }[] };
  const map = new Map<string, number>();
  for (const p of data.results) {
    const m = p.url.match(/\/(\d+)\/$/);
    if (m) map.set(p.name, parseInt(m[1], 10));
  }
  console.log(`  取得完了: ${map.size} 件`);
  return map;
}

// ---------------------------------------------------------------------------
// slug → PokeAPI id 解決
// ---------------------------------------------------------------------------

export function resolvePokeApiId(
  slug: string,
  num: number,
  nameToId: Map<string, number>
): { id: number; method: 'direct' | 'exception' | 'fallback' } {
  // 1. 直接マッチ
  const directId = nameToId.get(slug);
  if (directId !== undefined) return { id: directId, method: 'direct' };

  // 2. 例外マッピング
  const mappedName = SLUG_EXCEPTIONS[slug];
  if (mappedName) {
    const mappedId = nameToId.get(mappedName);
    if (mappedId !== undefined) return { id: mappedId, method: 'exception' };
  }

  // 3. num フォールバック
  return { id: num, method: 'fallback' };
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== populate_sprite_urls 開始 ===\n');

  const nameToId = await fetchPokeApiNameToId();
  const rows = parseCsv(CSV_PATH);

  let countDirect = 0;
  let countException = 0;
  let countFallback = 0;
  let countSkip = 0;
  const fallbackSlugs: string[] = [];

  for (const row of rows) {
    if (row['include'] !== '○') continue;
    if (row['sprite_url']) {
      countSkip++;
      continue;
    }

    const slug = row['slug'];
    const num = parseInt(row['num'], 10);
    const { id, method } = resolvePokeApiId(slug, num, nameToId);

    row['sprite_url'] = `${SPRITE_BASE_URL}/${id}.png`;

    if (method === 'direct') countDirect++;
    else if (method === 'exception') countException++;
    else {
      countFallback++;
      fallbackSlugs.push(slug);
    }
  }

  writeCsv(CSV_PATH, rows);
  console.log('\nCSV を更新しました。\n');

  console.log('=== サマリー ===');
  console.log(`  直接マッチ        : ${countDirect} 件`);
  console.log(`  例外マッピング適用 : ${countException} 件`);
  console.log(`  numフォールバック  : ${countFallback} 件`);
  console.log(`  スキップ(既存値)   : ${countSkip} 件`);

  if (fallbackSlugs.length > 0) {
    console.log('\n[WARN] numフォールバックが発生した slug:');
    for (const s of fallbackSlugs) console.log(`  - ${s}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
