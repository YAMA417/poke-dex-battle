/**
 * ============================================================
 * ポケモン名マッピングJSON生成スクリプト
 * ============================================================
 *
 * PokéAPIからポケモンデータを取得し、日本語名と英語名のマッピングを作成
 * フォルム違い、メガ進化、リージョンフォームにも対応
 *
 * 使用例:
 * ```bash
 * npx tsx packages/shared/src/api/generate-pokemon-map.ts
 * ```
 */

import { fetchPokemon, fetchPokemonSpecies } from "./pokeapi";
import { writeFileSync } from "fs";
import { join } from "path";

interface PokemonNameEntry {
  id: number;
  englishName: string;
  japaneseName: string;
  formName?: string; // フォルム名（メガ進化、リージョンフォーム等）
}

/**
 * ポケモンのID範囲
 * PokéAPIには約1300のポケモンが存在（フォルム違い含む）
 * - 1-1025: 通常のポケモン（第1〜9世代）
 * - 10001-10277: フォルム違い、メガ進化、リージョンフォーム等
 */
const POKEMON_ID_RANGES = [
  { start: 1, end: 1025 },      // 通常のポケモン
  { start: 10001, end: 10277 }, // フォルム違い、メガ進化等
];

/**
 * すべてのポケモンデータを取得してマッピングを作成
 */
async function generatePokemonNameMap(): Promise<
  Record<string, PokemonNameEntry>
> {
  const map: Record<string, PokemonNameEntry> = {};
  const seenEntries = new Map<string, PokemonNameEntry>(); // 重複チェック用
  let totalAttempts = 0;
  let successCount = 0;

  console.log("🔄 ポケモンデータを取得中...\n");

  for (const range of POKEMON_ID_RANGES) {
    console.log(`📡 ID ${range.start}〜${range.end} を取得中...`);

    for (let id = range.start; id <= range.end; id++) {
      totalAttempts++;

      try {
        const pokemon = await fetchPokemon(id);
        const species = await fetchPokemonSpecies(pokemon.species.name);

        // 日本語名を取得
        const japaneseName =
          species.names.find((n) => n.language.name === "ja")?.name ||
          pokemon.name;

        // フォルム名を取得（存在する場合）
        let formName: string | undefined;
        if (pokemon.name !== pokemon.species.name) {
          // フォルム違いの場合、名前からフォルム部分を抽出
          const formPart = pokemon.name.replace(pokemon.species.name + "-", "");
          formName = formPart;
        }

        const entry: PokemonNameEntry = {
          id: pokemon.id,
          englishName: pokemon.name,
          japaneseName,
          ...(formName && { formName }),
        };

        // 重複チェック: 同じ英語名と日本語名の組み合わせは1つだけ保持
        const key = `${entry.englishName}-${entry.japaneseName}`;
        if (!seenEntries.has(key)) {
          seenEntries.set(key, entry);

          // 複数のキーでアクセスできるようにする
          map[String(id)] = entry; // IDをキーに
          map[pokemon.name] = entry; // 英語名をキーに
          map[pokemon.name.toLowerCase()] = entry; // 英語名（小文字）をキーに

          // 日本語名のキーは、まだ設定されていない場合のみ設定（通常フォルムを優先）
          if (!map[japaneseName]) {
            map[japaneseName] = entry;
          }

          successCount++;

          // 進捗表示（20件ごと）
          if (successCount % 20 === 0) {
            process.stdout.write(
              `\r   取得済み: ${successCount}件 / 試行: ${totalAttempts}件`
            );
          }
        }
      } catch (error) {
        // エラーは無視（存在しないID）
      }
    }

    console.log(
      `\r   取得済み: ${successCount}件 / 試行: ${totalAttempts}件 ✅`
    );
  }

  console.log(`\n✅ 合計 ${successCount}件のポケモンを取得しました\n`);

  return map;
}

/**
 * メイン処理
 */
async function main() {
  try {
    const pokemonMap = await generatePokemonNameMap();

    // JSONファイルとして保存
    const outputPath = join(__dirname, "../data/pokemon-name-map.json");
    writeFileSync(outputPath, JSON.stringify(pokemonMap, null, 2), "utf-8");

    console.log(`💾 ${outputPath} に保存しました\n`);

    // サンプルを表示
    const sampleIds = [1, 3, 25, 445, 10033, 10158]; // フシギダネ、フシギバナ、ピカチュウ、ガブリアス、メガフシギバナ、ガラルヤドン
    console.log("📋 サンプル:");
    for (const id of sampleIds) {
      const entry = pokemonMap[String(id)];
      if (entry) {
        const formText = entry.formName ? ` [${entry.formName}]` : "";
        console.log(
          `  ID:${entry.id.toString().padStart(5)} | ${entry.japaneseName.padEnd(
            16
          )}${formText.padEnd(20)} | ${entry.englishName}`
        );
      }
    }
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

// コマンドライン実行
if (require.main === module) {
  main();
}

export { generatePokemonNameMap };
