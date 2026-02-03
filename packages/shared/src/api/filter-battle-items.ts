/**
 * ============================================================
 * バトル用アイテム名マッピングJSON生成スクリプト
 * ============================================================
 *
 * item-name-map.jsonから特定のカテゴリのみを抽出
 *
 * 対象カテゴリ:
 * - held-items: 持ち物（いのちのたま、こだわりスカーフなど）
 * - picky-healing: 特定条件での回復アイテム
 * - type-protection: タイプ保護アイテム
 * - plates: プレート系アイテム
 *
 * 使用例:
 * ```bash
 * npx tsx packages/shared/src/api/filter-battle-items.ts
 * ```
 */

import { readFileSync, writeFileSync } from "fs";
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
 * バトルで使用するアイテムのカテゴリ
 */
const BATTLE_ITEM_CATEGORIES = [
  "held-items",
  "picky-healing",
  "type-protection",
  "plates",
];

/**
 * メイン処理
 */
async function main() {
  try {
    console.log("🔄 バトル用アイテムをフィルタリング中...\n");

    // 元のitem-name-map.jsonを読み込み
    const inputPath = join(__dirname, "../data/item-name-map.json");
    const allItems: Record<string, ItemNameEntry> = JSON.parse(
      readFileSync(inputPath, "utf-8")
    );

    console.log(`📖 ${inputPath} を読み込みました`);
    console.log(`   総エントリ数: ${Object.keys(allItems).length}件\n`);

    // バトル用カテゴリのアイテムのみを抽出
    const battleItems: Record<string, ItemNameEntry> = {};
    const processedIds = new Set<number>();

    for (const [key, item] of Object.entries(allItems)) {
      if (BATTLE_ITEM_CATEGORIES.includes(item.category)) {
        battleItems[key] = item;

        // ユニークなアイテム数をカウント
        if (!processedIds.has(item.id)) {
          processedIds.add(item.id);
        }
      }
    }

    console.log("✅ フィルタリング完了");
    console.log(`   対象カテゴリ: ${BATTLE_ITEM_CATEGORIES.join(", ")}`);
    console.log(`   ユニークアイテム数: ${processedIds.size}件`);
    console.log(`   総エントリ数（複数キー含む）: ${Object.keys(battleItems).length}件\n`);

    // カテゴリ別の統計を表示
    console.log("📊 カテゴリ別統計:");
    const categoryCounts: Record<string, number> = {};
    for (const id of processedIds) {
      const item = allItems[String(id)];
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }
    for (const [category, count] of Object.entries(categoryCounts)) {
      console.log(`   ${category.padEnd(20)}: ${count}件`);
    }

    // JSONファイルとして保存
    const outputPath = join(__dirname, "../data/battle-item-name-map.json");
    writeFileSync(outputPath, JSON.stringify(battleItems, null, 2), "utf-8");

    console.log(`\n💾 ${outputPath} に保存しました\n`);

    // サンプルを表示
    const sampleIds = [247, 252, 264, 135, 298]; // いのちのたま、きあいのタスキ、こだわりスカーフ、オボンのみ、ひのたまプレート
    console.log("📋 サンプル:");
    for (const id of sampleIds) {
      const entry = battleItems[String(id)];
      if (entry) {
        console.log(
          `  ID:${entry.id.toString().padStart(4)} | ${entry.japaneseName.padEnd(
            18
          )} | ${entry.category.padEnd(20)} | ${entry.englishName}`
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

export { main as filterBattleItems };
