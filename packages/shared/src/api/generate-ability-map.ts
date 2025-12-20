/**
 * ============================================================
 * 特性名マッピングJSON生成スクリプト
 * ============================================================
 *
 * PokéAPIから特性データを取得し、日本語名と英語名のマッピングを作成
 *
 * 使用例:
 * ```bash
 * npx tsx packages/shared/src/api/generate-ability-map.ts
 * ```
 */

import { fetchAbility } from "./pokeapi";
import { writeFileSync } from "fs";
import { join } from "path";

interface AbilityNameEntry {
  id: number;
  englishName: string;
  japaneseName: string;
}

/**
 * 特性のID範囲
 * PokéAPIには約300の特性が存在
 * 第9世代（スカーレット・バイオレット）までカバー
 */
const ABILITY_ID_RANGES = [
  { start: 1, end: 308 }, // 全特性を取得
];

/**
 * すべての特性データを取得してマッピングを作成
 */
async function generateAbilityNameMap(): Promise<
  Record<string, AbilityNameEntry>
> {
  const map: Record<string, AbilityNameEntry> = {};
  let totalAttempts = 0;
  let successCount = 0;

  console.log("🔄 特性データを取得中...\n");

  for (const range of ABILITY_ID_RANGES) {
    console.log(`📡 ID ${range.start}〜${range.end} を取得中...`);

    for (let id = range.start; id <= range.end; id++) {
      totalAttempts++;

      try {
        const ability = await fetchAbility(id);

        // 日本語名を取得
        const japaneseName =
          ability.names.find((n) => n.language.name === "ja")?.name ||
          ability.name;

        const entry: AbilityNameEntry = {
          id: ability.id,
          englishName: ability.name,
          japaneseName,
        };

        // 複数のキーでアクセスできるようにする
        map[String(id)] = entry; // IDをキーに
        map[ability.name] = entry; // 英語名をキーに
        map[ability.name.toLowerCase()] = entry; // 英語名（小文字）をキーに
        map[japaneseName] = entry; // 日本語名をキーに

        successCount++;

        // 進捗表示（10件ごと）
        if (successCount % 10 === 0) {
          process.stdout.write(
            `\r   取得済み: ${successCount}件 / 試行: ${totalAttempts}件`
          );
        }
      } catch (error) {
        // エラーは無視（存在しないID）
      }
    }

    console.log(
      `\r   取得済み: ${successCount}件 / 試行: ${totalAttempts}件 ✅`
    );
  }

  console.log(`\n✅ 合計 ${successCount}件の特性を取得しました\n`);

  return map;
}

/**
 * メイン処理
 */
async function main() {
  try {
    const abilityMap = await generateAbilityNameMap();

    // JSONファイルとして保存
    const outputPath = join(
      __dirname,
      "../data/ability-name-map.json"
    );
    writeFileSync(outputPath, JSON.stringify(abilityMap, null, 2), "utf-8");

    console.log(`💾 ${outputPath} に保存しました\n`);

    // サンプルを表示
    const sampleIds = [1, 18, 39, 66, 127]; // あくしゅう、もうか、いかく、ちからもち、テラスシェル
    console.log("📋 サンプル:");
    for (const id of sampleIds) {
      const entry = abilityMap[String(id)];
      if (entry) {
        console.log(
          `  ID:${entry.id.toString().padStart(4)} | ${entry.japaneseName.padEnd(
            20
          )} | ${entry.englishName}`
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

export { generateAbilityNameMap };
