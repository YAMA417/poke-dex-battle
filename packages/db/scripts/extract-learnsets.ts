/**
 * pokemon-showdown からレンセットデータを抽出し、CSV出力するスクリプト
 *
 * 処理フロー:
 * 1. pokemon.csv から include=○ のslugリストを読み込む
 * 2. moves.csv から include=○ のslugリストをSetで保持
 * 3. 各ポケモンに対して pokemon-showdown の Dex API でlearnsetを取得
 * 4. 進化チェーン（prevo）をたどって全習得技を集約
 * 5. Gen9のソースを優先、非収録なら最新世代にフォールバック
 * 6. DBのmoves.csvに存在するslugのみフィルタ
 * 7. チャンピオンズ独自メガは基本フォームからlearnsetをコピー
 * 8. CSV出力: pokemon_slug,move_slug,method,level
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
 * - {gen}L{level} → level-up
 * - {gen}M → machine
 * - {gen}E → egg
 * - {gen}T → machine（教え技はmachineに統合）
 * - {gen}R → level-up, level: 0（思い出し）
 * - {gen}S → null（イベント限定、除外）
 *
 * @param source - MoveSource文字列
 * @param targetGen - 対象世代番号（デフォルト: 9）
 */
function parseMoveSource(
  source: string,
  targetGen: number = 9
): { method: 'level-up' | 'machine' | 'egg'; level: number } | null {
  // 対象世代のソースのみ採用
  if (source[0] !== String(targetGen)) return null;

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
// showdown moveID → DB move slug の逆引きマップ構築
// ---------------------------------------------------------------------------

const moveRows = parseCsv(resolve(EXPORT_DIR, 'moves.csv')).filter((r) => r.include === '○');
const showdownToDbMoveSlug = new Map<string, string>();
for (const row of moveRows) {
  const showdownId = toID(row.slug);
  showdownToDbMoveSlug.set(showdownId, row.slug);
  const showdownIdFromName = toID(row.name_en);
  if (!showdownToDbMoveSlug.has(showdownIdFromName)) {
    showdownToDbMoveSlug.set(showdownIdFromName, row.slug);
  }
}

// ---------------------------------------------------------------------------
// learnset 抽出関数
// ---------------------------------------------------------------------------

type LearnsetCache = Record<string, { learnset?: Record<string, string[]> } | undefined>;

/**
 * 指定ポケモンの learnset を進化チェーンをたどりながら抽出する
 *
 * @param species - showdown の species オブジェクト
 * @param dex - showdown の Dex インスタンス
 * @param learnsetCache - learnset キャッシュ
 * @param moveSlugMap - showdown moveID → DB slug のマップ
 * @param targetGen - 対象世代番号
 * @returns 技マップ（キー: `{dbMoveSlug}:{method}`）
 */
function extractLearnset(
  species: ReturnType<typeof Dex.species.get>,
  dex: typeof Dex,
  learnsetCache: LearnsetCache,
  moveSlugMap: Map<string, string>,
  targetGen: number = 9
): Map<string, { method: 'level-up' | 'machine' | 'egg'; level: number }> {
  const moveMap = new Map<string, { method: 'level-up' | 'machine' | 'egg'; level: number }>();

  let currentSpecies: typeof species | null = species;
  while (currentSpecies) {
    const learnsetData = learnsetCache[currentSpecies.id];
    const learnset = learnsetData?.learnset;

    if (learnset) {
      for (const [moveId, sources] of Object.entries(learnset)) {
        for (const source of sources) {
          const parsed = parseMoveSource(source, targetGen);
          if (!parsed) continue;

          const moveSlug = moveId.replace(/[^a-z0-9]/g, '');

          if (!moveSlugMap.has(moveSlug)) continue;
          const dbMoveSlug = moveSlugMap.get(moveSlug)!;

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
      const baseId =
        typeof currentSpecies.changesFrom === 'string'
          ? currentSpecies.changesFrom
          : currentSpecies.changesFrom;
      const baseSpecies = dex.species.get(baseId);
      if (baseSpecies.id === species.id || baseSpecies.id === currentSpecies.id) {
        currentSpecies = null;
      } else {
        currentSpecies = baseSpecies.exists ? baseSpecies : null;
      }
    } else if (currentSpecies.baseSpecies && currentSpecies.baseSpecies !== currentSpecies.name) {
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

  return moveMap;
}

/** 技習得方法として有効なソースか（V=VC転送、S=イベントは除外） */
const VALID_METHOD_CHARS = new Set(['L', 'M', 'E', 'T', 'R']);

/**
 * 進化チェーンをたどりながら、有効な技ソースを持つ世代番号を降順で返す
 * V（Virtual Console転送）やS（イベント）のみの世代は除外する
 */
function detectAvailableGens(
  species: ReturnType<typeof Dex.species.get>,
  dex: typeof Dex,
  learnsetCache: LearnsetCache
): number[] {
  const genSet = new Set<number>();

  let currentSpecies: typeof species | null = species;
  const visited = new Set<string>();

  while (currentSpecies) {
    if (visited.has(currentSpecies.id)) break;
    visited.add(currentSpecies.id);

    const learnsetData = learnsetCache[currentSpecies.id];
    const learnset = learnsetData?.learnset;

    if (learnset) {
      for (const sources of Object.values(learnset)) {
        for (const source of sources) {
          const gen = parseInt(source[0], 10);
          if (!isNaN(gen) && VALID_METHOD_CHARS.has(source[1])) {
            genSet.add(gen);
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
      const baseId =
        typeof currentSpecies.changesFrom === 'string'
          ? currentSpecies.changesFrom
          : currentSpecies.changesFrom;
      const baseSpecies = dex.species.get(baseId);
      if (baseSpecies.id === species.id || baseSpecies.id === currentSpecies.id) {
        currentSpecies = null;
      } else {
        currentSpecies = baseSpecies.exists ? baseSpecies : null;
      }
    } else if (currentSpecies.baseSpecies && currentSpecies.baseSpecies !== currentSpecies.name) {
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

  // 降順（最新世代から）で返す。Gen9は除外（既にメインで試行済み）
  return [...genSet].filter((g) => g !== 9).sort((a, b) => b - a);
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
  const moveCsvRows = parseCsv(resolve(EXPORT_DIR, 'moves.csv')).filter((r) => r.include === '○');
  const moveSlugSet = new Set(moveCsvRows.map((r) => r.slug));
  console.log(`対象技: ${moveSlugSet.size}件`);

  // 3. showdown Dex を初期化
  const dex = Dex.mod('gen9');

  const allEntries: LearnEntry[] = [];
  let notFoundCount = 0;
  let noLearnsetCount = 0;
  let fallbackCount = 0;

  // チャンピオンズ独自メガの後処理リスト
  const megaCopyList: { pokemonSlug: string; baseFormSlug: string }[] = [];

  // learnset キャッシュ
  const learnsetCache = dex.dataCache.Learnsets as LearnsetCache;

  for (const row of pokemonRows) {
    const nameEn = row.name_en;
    const pokemonSlug = row.slug;
    const showdownId = toID(nameEn);

    // showdown の species を取得
    let species = dex.species.get(showdownId);

    // 見つからない場合: フォルムポケモンのフォールバック
    if (!species.exists) {
      species = dex.species.get(pokemonSlug);
    }

    if (!species.exists) {
      // チャンピオンズ独自メガ: form_type=mega かつ base_form_slug あり → 後処理リストへ
      if (row.form_type === 'mega' && row.base_form_slug) {
        megaCopyList.push({ pokemonSlug, baseFormSlug: row.base_form_slug });
        continue;
      }
      console.warn(
        `  WARN: showdown species 不一致: ${nameEn} (slug=${pokemonSlug}, id=${showdownId})`
      );
      notFoundCount++;
      continue;
    }

    // 4. Gen9 で learnset 抽出
    const moveMap = extractLearnset(species, dex, learnsetCache, showdownToDbMoveSlug, 9);

    // 5. Gen9 で技が0件の場合、最新世代から順にフォールバック
    if (moveMap.size === 0) {
      const availableGens = detectAvailableGens(species, dex, learnsetCache);
      for (const gen of availableGens) {
        const fallbackMap = extractLearnset(species, dex, learnsetCache, showdownToDbMoveSlug, gen);
        if (fallbackMap.size > 0) {
          console.log(`  INFO: ${pokemonSlug} はGen9非収録のためGen${gen}ソースにフォールバック`);
          fallbackCount++;
          for (const [key, value] of fallbackMap) {
            moveMap.set(key, value);
          }
          break;
        }
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

  // 6. チャンピオンズ独自メガの learnset コピー
  let megaCopyCount = 0;
  for (const { pokemonSlug, baseFormSlug } of megaCopyList) {
    // 基本フォームのエントリを検索
    const baseEntries = allEntries.filter((e) => e.pokemonSlug === baseFormSlug);
    if (baseEntries.length === 0) {
      console.warn(
        `  WARN: メガコピー元 ${baseFormSlug} の learnset が見つかりません (${pokemonSlug})`
      );
      continue;
    }
    for (const entry of baseEntries) {
      allEntries.push({
        pokemonSlug,
        moveSlug: entry.moveSlug,
        method: entry.method,
        level: entry.level,
      });
    }
    megaCopyCount++;
  }

  // サマリー出力
  console.log(`\nshowdown不一致（想定外）: ${notFoundCount}件`);
  console.log(`チャンピオンズ独自メガ（基本フォームからコピー）: ${megaCopyCount}件`);
  console.log(`Gen9非収録フォールバック: ${fallbackCount}件`);
  console.log(`learnset空（フォールバック後も0件）: ${noLearnsetCount}件`);
  console.log(`総レコード数: ${allEntries.length}件`);

  // 7. CSV 出力（BOM付き）
  const header = 'pokemon_slug,move_slug,method,level';
  const csvLines = allEntries.map((e) => `${e.pokemonSlug},${e.moveSlug},${e.method},${e.level}`);
  const csvContent = '\uFEFF' + [header, ...csvLines].join('\n') + '\n';

  const outputPath = resolve(EXPORT_DIR, 'learnsets.csv');
  writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`\n出力完了: ${outputPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
