/**
 * ============================================================
 * アイテム名マッピングJSON生成スクリプト
 * ============================================================
 *
 * PokéAPIからアイテムデータを取得し、日本語名と英語名のマッピングを作成
 *
 * 使用例:
 * ```bash
 * npx tsx packages/shared/src/api/generate-item-map.ts
 * ```
 */

import { fetchItem } from "./pokeapi";
import { writeFileSync } from "fs";
import { join } from "path";

interface ItemNameEntry {
  id: number;
  englishName: string;
  japaneseName: string;
  category: string;
  effect: string | null;
  effectJa: string | null;
}

/**
 * アイテムのID範囲
 * PokéAPIには約2100のアイテムが存在
 * 第9世代（スカーレット・バイオレット）までカバー
 */
const ITEM_ID_RANGES = [
  { start: 1, end: 2050 }, // 全アイテムを取得
];

/**
 * すべてのアイテムデータを取得してマッピングを作成
 */
async function generateItemNameMap(): Promise<Record<string, ItemNameEntry>> {
  const map: Record<string, ItemNameEntry> = {};
  let totalAttempts = 0;
  let successCount = 0;

  console.log("🔄 アイテムデータを取得中...\n");

  for (const range of ITEM_ID_RANGES) {
    console.log(`📡 ID ${range.start}〜${range.end} を取得中...`);

    for (let id = range.start; id <= range.end; id++) {
      totalAttempts++;

      try {
        const item = await fetchItem(id);

        // 日本語名を取得
        const japaneseName =
          item.names.find((n) => n.language.name === "ja")?.name ||
          item.name;

        // カテゴリを取得
        const category = item.category?.name || "unknown";

        // 効果文を取得
        const effectEn = item.effect_entries.find(
          (e) => e.language.name === "en"
        );
        const effectJaEntry = item.effect_entries.find(
          (e) => e.language.name === "ja"
        );
        const effect = effectEn?.short_effect || effectEn?.effect || null;
        const effectJa =
          effectJaEntry?.short_effect || effectJaEntry?.effect || null;

        const entry: ItemNameEntry = {
          id: item.id,
          englishName: item.name,
          japaneseName,
          category,
          effect,
          effectJa,
        };

        // 複数のキーでアクセスできるようにする
        map[String(id)] = entry; // IDをキーに
        map[item.name] = entry; // 英語名をキーに
        map[item.name.toLowerCase()] = entry; // 英語名（小文字）をキーに
        map[japaneseName] = entry; // 日本語名をキーに

        successCount++;

        // 進捗表示（50件ごと）
        if (successCount % 50 === 0) {
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

  console.log(`\n✅ 合計 ${successCount}件のアイテムを取得しました\n`);

  return map;
}

/**
 * メイン処理
 */
async function main() {
  try {
    const itemMap = await generateItemNameMap();

    // JSONファイルとして保存
    const outputPath = join(
      __dirname,
      "../data/item-name-map.json"
    );
    writeFileSync(outputPath, JSON.stringify(itemMap, null, 2), "utf-8");

    console.log(`💾 ${outputPath} に保存しました\n`);

    // サンプルを表示
    const sampleIds = [1, 135, 229, 275, 1606]; // マスターボール、こだわりハチマキ、いのちのたま、きあいのタスキ、とつげきチョッキ
    console.log("📋 サンプル:");
    for (const id of sampleIds) {
      const entry = itemMap[String(id)];
      if (entry) {
        console.log(
          `  ID:${entry.id.toString().padStart(4)} | ${entry.japaneseName.padEnd(
            18
          )} | ${entry.category.padEnd(20)} | ${entry.englishName}`
        );
        if (entry.effectJa) {
          const shortEffect = entry.effectJa.substring(0, 60);
          console.log(`      効果: ${shortEffect}${entry.effectJa.length > 60 ? "..." : ""}`);
        }
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

export { generateItemNameMap };
