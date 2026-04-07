/**
 * pokemon-showdown からレンセットデータを抽出し、CSV出力するスクリプト
 *
 * 処理フロー:
 * 1. pokemon.csv から include=○ のslugリストを読み込む
 * 2. moves.csv から include=○ のslugリストをSetで保持
 * 3. 各ポケモンに対して pokemon-showdown の Dex API でlearnsetを取得
 * 4. 進化チェーン（prevo）をたどって全習得技を集約
 * 5. Gen9のソースのみ採用
 * 6. DBのmoves.csvに存在するslugのみフィルタ
 * 7. CSV出力: pokemon_slug,move_slug,method,level
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Dex } from 'pokemon-showdown';

const EXPORT_DIR = resolve(__dirname, '../export');

// ---------------------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------------------

/** pokemon-showdown 互換の ID 変換 */
function toID(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// ---------------------------------------------------------------------------
// CSV パーサー（BOM対応・クォート対応）- seed.ts と同一ロジック
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
        } else {
          inQ = !inQ;
        }
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

// ---------------------------------------------------------------------------
// MoveSource パーサー
// ---------------------------------------------------------------------------

interface LearnEntry {
  pokemonSlug: string;
  moveSlug: string;
  method: 'level-up' | 'machine' | 'egg';
  level: number;
}

/**
 * MoveSource 文字列をパースして method/level を返す
 * 形式: `{gen}{method}{detail}`
 * - 9L{level} → level-up
 * - 9M → machine
 * - 9E → egg
 * - 9T → machine（教え技はmachineに統合）
 * - 9R → level-up, level: 0（思い出し）
 * - 9S → null（イベント限定、除外）
 */
function parseMoveSource(
  source: string
): { method: 'level-up' | 'machine' | 'egg'; level: number } | null {
  // Gen9 のソースのみ対象
  if (!source.startsWith('9')) return null;

  const methodChar = source[1];
  switch (methodChar) {
    case 'L': {
      const level = parseInt(source.slice(2), 10);
      return { method: 'level-up', level: isNaN(level) ? 0 : level };
    }
    case 'M':
      return { method: 'machine', level: 0 };
    case 'E':
      return { method: 'egg', level: 0 };
    case 'T':
      // 教え技は machine に統合
      return { method: 'machine', level: 0 };
    case 'R':
      // 思い出し技は level-up, level: 0
      return { method: 'level-up', level: 0 };
    case 'S':
      // イベント限定は除外
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// メイン処理
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== learnset 抽出開始 ===\n');

  // 1. pokemon.csv から対象ポケモンを読み込む
  const pokemonRows = parseCsv(resolve(EXPORT_DIR, 'pokemon.csv')).filter((r) => r.include === '○');
  console.log(`対象ポケモン: ${pokemonRows.length}件`);

  // 2. moves.csv から対象技のslugセットを構築
  const moveRows = parseCsv(resolve(EXPORT_DIR, 'moves.csv')).filter((r) => r.include === '○');
  const moveSlugSet = new Set(moveRows.map((r) => r.slug));
  console.log(`対象技: ${moveSlugSet.size}件`);

  // 3. showdown Dex を初期化
  const dex = Dex.mod('gen9');

  const allEntries: LearnEntry[] = [];
  let notFoundCount = 0;
  let noLearnsetCount = 0;

  for (const row of pokemonRows) {
    const nameEn = row.name_en;
    const pokemonSlug = row.slug;
    const showdownId = toID(nameEn);

    // showdown の species を取得
    let species = dex.species.get(showdownId);

    // 見つからない場合: フォルムポケモンのフォールバック
    if (!species.exists) {
      // slug をそのまま試す
      species = dex.species.get(pokemonSlug);
    }

    if (!species.exists) {
      console.warn(
        `  WARN: showdown species 不一致: ${nameEn} (slug=${pokemonSlug}, id=${showdownId})`
      );
      notFoundCount++;
      continue;
    }

    // 4. 進化チェーンをたどって全習得技を集約
    const moveMap = new Map<string, { method: 'level-up' | 'machine' | 'egg'; level: number }>();

    // dex.dataCache.Learnsets から直接取得（dex.learnsets は存在しない）
    const learnsetCache = dex.dataCache.Learnsets as Record<
      string,
      { learnset?: Record<string, string[]> } | undefined
    >;

    let currentSpecies: typeof species | null = species;
    while (currentSpecies) {
      const learnsetData = learnsetCache[currentSpecies.id];
      const learnset = learnsetData?.learnset;

      if (learnset) {
        for (const [moveId, sources] of Object.entries(learnset)) {
          for (const source of sources) {
            const parsed = parseMoveSource(source);
            if (!parsed) continue;

            // moves.csv に存在するslugのみ
            // showdown の moveId はすでに slug と同等の形式
            const moveSlug = moveId.replace(/[^a-z0-9]/g, '');

            // showdown の move ID → DB の slug 変換
            // DB の slug はハイフン区切り（例: "ice-beam"）、showdown は連結（例: "icebeam"）
            // moves.csv の slug を逆引き用マップで照合する
            if (!showdownToDbMoveSlug.has(moveSlug)) continue;
            const dbMoveSlug = showdownToDbMoveSlug.get(moveSlug)!;

            // 同じ技・同じ method の場合、level が高い方を優先（level-up の場合）
            const key = `${dbMoveSlug}:${parsed.method}`;
            const existing = moveMap.get(key);
            if (!existing || (parsed.method === 'level-up' && parsed.level > existing.level)) {
              moveMap.set(key, parsed);
            }
          }
        }
      }

      // 進化前をたどる
      if (currentSpecies.prevo) {
        currentSpecies = dex.species.get(currentSpecies.prevo);
        if (!currentSpecies.exists) {
          currentSpecies = null;
        }
      } else if (currentSpecies.changesFrom) {
        // フォルムポケモン: changesFrom から親を取得
        const baseId =
          typeof currentSpecies.changesFrom === 'string'
            ? currentSpecies.changesFrom
            : currentSpecies.changesFrom;
        const baseSpecies = dex.species.get(baseId);
        // 無限ループ防止: 既に同じ種のデータを処理済みなら終了
        if (baseSpecies.id === species.id || baseSpecies.id === currentSpecies.id) {
          currentSpecies = null;
        } else {
          currentSpecies = baseSpecies.exists ? baseSpecies : null;
        }
      } else if (currentSpecies.baseSpecies && currentSpecies.baseSpecies !== currentSpecies.name) {
        // baseSpecies からの取得を試みる
        const baseSpecies = dex.species.get(currentSpecies.baseSpecies);
        if (baseSpecies.id === species.id || baseSpecies.id === currentSpecies.id) {
          currentSpecies = null;
        } else {
          currentSpecies = baseSpecies.exists ? baseSpecies : null;
        }
      } else {
        currentSpecies = null;
      }
    }

    if (moveMap.size === 0) {
      noLearnsetCount++;
    }

    // エントリを追加
    for (const [key, parsed] of moveMap) {
      const dbMoveSlug = key.split(':')[0];
      allEntries.push({
        pokemonSlug,
        moveSlug: dbMoveSlug,
        method: parsed.method,
        level: parsed.level,
      });
    }

    process.stdout.write(`\r  処理中: ${allEntries.length}件 (${pokemonSlug.padEnd(25)})`);
  }

  process.stdout.write('\n');

  console.log(`\n不一致: ${notFoundCount}件`);
  console.log(`learnset 空: ${noLearnsetCount}件`);
  console.log(`総レコード数: ${allEntries.length}件`);

  // 7. CSV 出力（BOM付き）
  const header = 'pokemon_slug,move_slug,method,level';
  const csvLines = allEntries.map((e) => `${e.pokemonSlug},${e.moveSlug},${e.method},${e.level}`);
  const csvContent = '\uFEFF' + [header, ...csvLines].join('\n') + '\n';

  const outputPath = resolve(EXPORT_DIR, 'learnsets.csv');
  writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`\n出力完了: ${outputPath}`);
}

// ---------------------------------------------------------------------------
// showdown moveID → DB move slug の逆引きマップ構築
// ---------------------------------------------------------------------------

// moves.csv を先に読み込み、toID(slug) → slug のマッピングを作る
const moveRows = parseCsv(resolve(EXPORT_DIR, 'moves.csv')).filter((r) => r.include === '○');
const showdownToDbMoveSlug = new Map<string, string>();
for (const row of moveRows) {
  // DB slug: "ice-beam" → showdown id: "icebeam"
  const showdownId = toID(row.slug);
  showdownToDbMoveSlug.set(showdownId, row.slug);
  // name_en からも変換（slug と異なる場合があるため）
  const showdownIdFromName = toID(row.name_en);
  if (!showdownToDbMoveSlug.has(showdownIdFromName)) {
    showdownToDbMoveSlug.set(showdownIdFromName, row.slug);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
