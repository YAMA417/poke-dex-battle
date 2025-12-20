/**
 * ============================================================
 * 技名マッピングJSON生成スクリプト
 * ============================================================
 *
 * PokéAPIから技データを取得し、日本語名と英語名のマッピングを作成
 *
 * 使用例:
 * ```bash
 * npx tsx packages/shared/src/api/generate-move-map.ts
 * ```
 */

import { fetchMove } from "./pokeapi";
import { writeFileSync } from "fs";
import { join } from "path";

interface MoveNameEntry {
  id: number;
  englishName: string;
  japaneseName: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}

/**
 * 技のID範囲
 * PokéAPIには約900の技が存在
 * 第9世代（スカーレット・バイオレット）までカバー
 */
const MOVE_ID_RANGES = [
  { start: 1, end: 919 }, // 全技を取得
];

/**
 * すべての技データを取得してマッピングを作成
 */
async function generateMoveNameMap(): Promise<Record<string, MoveNameEntry>> {
  const map: Record<string, MoveNameEntry> = {};
  let totalAttempts = 0;
  let successCount = 0;

  console.log("🔄 技データを取得中...\n");

  for (const range of MOVE_ID_RANGES) {
    console.log(`📡 ID ${range.start}〜${range.end} を取得中...`);

    for (let id = range.start; id <= range.end; id++) {
      totalAttempts++;

      try {
        const move = await fetchMove(id);

        // 日本語名を取得
        const japaneseName =
          move.names.find((n) => n.language.name === "ja")?.name ||
          move.name;

        // タイプ名を取得（先頭大文字に変換）
        const typeName = move.type.name;
        const type = typeName.charAt(0).toUpperCase() + typeName.slice(1);

        // カテゴリを取得
        const categoryMap: Record<string, string> = {
          physical: "Physical",
          special: "Special",
          status: "Status",
        };
        const category = categoryMap[move.damage_class.name] || "Status";

        const entry: MoveNameEntry = {
          id: move.id,
          englishName: move.name,
          japaneseName,
          type,
          category,
          power: move.power,
          accuracy: move.accuracy,
          pp: move.pp,
        };

        // 複数のキーでアクセスできるようにする
        map[String(id)] = entry; // IDをキーに
        map[move.name] = entry; // 英語名をキーに
        map[move.name.toLowerCase()] = entry; // 英語名（小文字）をキーに
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

  console.log(`\n✅ 合計 ${successCount}件の技を取得しました\n`);

  return map;
}

/**
 * メイン処理
 */
async function main() {
  try {
    const moveMap = await generateMoveNameMap();

    // JSONファイルとして保存
    const outputPath = join(
      __dirname,
      "../data/move-name-map.json"
    );
    writeFileSync(outputPath, JSON.stringify(moveMap, null, 2), "utf-8");

    console.log(`💾 ${outputPath} に保存しました\n`);

    // サンプルを表示
    const sampleIds = [1, 33, 85, 165, 527]; // はたく、たいあたり、10まんボルト、わるあがき、エレキネット
    console.log("📋 サンプル:");
    for (const id of sampleIds) {
      const entry = moveMap[String(id)];
      if (entry) {
        const powerStr = entry.power !== null ? entry.power.toString().padStart(3) : "---";
        const accStr = entry.accuracy !== null ? entry.accuracy.toString().padStart(3) : "---";
        console.log(
          `  ID:${entry.id.toString().padStart(4)} | ${entry.japaneseName.padEnd(
            12
          )} | ${entry.type.padEnd(10)} | ${entry.category.padEnd(8)} | 威力:${powerStr} | 命中:${accStr} | PP:${entry.pp.toString().padStart(2)}`
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

export { generateMoveNameMap };
