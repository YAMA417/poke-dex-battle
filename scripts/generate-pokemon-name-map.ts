/**
 * ============================================================
 * ポケモン名マッピング生成スクリプト
 * ============================================================
 *
 * PokéAPIから全ポケモンの日本語名と英語名のマッピングを取得し、
 * JSONファイルとして出力します。
 *
 * 実行方法:
 * ```bash
 * npx tsx scripts/generate-pokemon-name-map.ts
 * ```
 *
 * 出力先:
 * packages/shared/src/data/pokemon-name-map.json
 */

import fs from 'fs';
import path from 'path';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const MAX_POKEMON_ID = 1025; // 第9世代まで
const OUTPUT_PATH = path.join(
  __dirname,
  '../packages/shared/src/data/pokemon-name-map.json'
);

interface NameEntry {
  language: {
    name: string;
  };
  name: string;
}

interface PokemonSpeciesResponse {
  id: number;
  name: string; // 英語名（小文字）
  names: NameEntry[];
}

interface PokemonNameMap {
  [japaneseNameOrEnglishName: string]: {
    id: number;
    englishName: string;
    japaneseName: string;
  };
}

/**
 * Pokemon speciesデータを取得
 */
async function fetchPokemonSpecies(id: number): Promise<PokemonSpeciesResponse> {
  const url = `${POKEAPI_BASE_URL}/pokemon-species/${id}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch pokemon ${id}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 全ポケモンの名前マッピングを生成
 */
async function generatePokemonNameMap(): Promise<PokemonNameMap> {
  console.log(`🚀 ${MAX_POKEMON_ID}匹のポケモンデータを取得中...\n`);

  const nameMap: PokemonNameMap = {};
  const batchSize = 50; // 並列リクエスト数

  for (let i = 1; i <= MAX_POKEMON_ID; i += batchSize) {
    const endId = Math.min(i + batchSize - 1, MAX_POKEMON_ID);
    console.log(`📡 ID ${i}〜${endId} を取得中...`);

    const promises = [];
    for (let id = i; id <= endId; id++) {
      promises.push(fetchPokemonSpecies(id));
    }

    try {
      const results = await Promise.all(promises);

      for (const species of results) {
        const japaneseName = species.names.find(
          (name) => name.language.name === 'ja' || name.language.name === 'ja-Hrkt'
        )?.name;

        const englishName = species.name; // API上の英語名（小文字）

        if (!japaneseName) {
          console.warn(`⚠️  ID ${species.id} (${englishName}) の日本語名が見つかりません`);
          continue;
        }

        const entry = {
          id: species.id,
          englishName,
          japaneseName,
        };

        // 日本語名、英語名、IDで検索できるように登録
        nameMap[japaneseName] = entry;
        nameMap[englishName] = entry;
        nameMap[englishName.toLowerCase()] = entry;
        nameMap[String(species.id)] = entry; // IDでも検索可能に
      }

      // APIレート制限を避けるため少し待機
      await new Promise((resolve) => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ エラー発生 (ID ${i}〜${endId}):`, error);
      throw error;
    }
  }

  console.log(`\n✅ ${Object.keys(nameMap).length}件のマッピングを生成しました`);
  return nameMap;
}

/**
 * マッピングデータをJSONファイルに保存
 */
function saveMapToFile(nameMap: PokemonNameMap): void {
  const dir = path.dirname(OUTPUT_PATH);

  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(nameMap, null, 2),
    'utf-8'
  );

  console.log(`\n💾 マッピングファイルを保存しました:`);
  console.log(`   ${OUTPUT_PATH}`);
}

/**
 * メイン処理
 */
async function main() {
  console.log('🎮 ポケモン名マッピング生成スタート\n');
  console.log('='.repeat(60));

  try {
    const nameMap = await generatePokemonNameMap();
    saveMapToFile(nameMap);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 マッピング生成完了！');
    console.log('\n使用例:');
    console.log('  ガブリアス → garchomp (ID: 445)');
    console.log('  pikachu → pikachu (ID: 25)');

  } catch (error) {
    console.error('\n💥 エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
