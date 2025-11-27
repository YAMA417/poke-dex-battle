/**
 * ============================================================
 * ポケモン スカーレット・バイオレット アイテムリストツール
 * ============================================================
 *
 * スカーレット・バイオレット（第9世代）で入手できるアイテムをすべて表示
 *
 * 使用例:
 * ```bash
 * # すべてのSVアイテムを表示
 * npx tsx packages/shared/src/api/list-sv-items.ts
 *
 * # バトル用アイテムのみ表示
 * npx tsx packages/shared/src/api/list-sv-items.ts --battle
 *
 * # カテゴリ別に表示
 * npx tsx packages/shared/src/api/list-sv-items.ts --category
 * ```
 *
 * ============================================================
 */

import { fetchItem } from "./pokeapi";
import { transformItemData } from "./transform";

interface SVItem {
  id: number;
  name: string;
  nameJa: string;
  cost: number;
  category?: string;
}

/**
 * PokéAPIアイテムIDの範囲（全量取得）
 * PokéAPIには約2000以上のアイテムが存在するため、広範囲で取得
 */
const SV_ITEM_RANGES = [
  { start: 1, end: 2100 },    // 全アイテムを取得（第1〜9世代すべて）
];

/**
 * バトルで使う持ち物のカテゴリ
 */
const BATTLE_ITEM_KEYWORDS = [
  "こだわり", "パワー", "きあい", "いのち", "チョッキ",
  "ハチマキ", "メガネ", "スカーフ", "タスキ",
  "しんか", "オボン", "ラム", "カゴ", "チーゴ",
  "choice", "power", "focus", "life", "assault",
  "band", "specs", "scarf", "sash", "evolite"
];

/**
 * すべてのSVアイテムを取得
 */
async function fetchAllSVItems(): Promise<SVItem[]> {
  const items: SVItem[] = [];
  let totalAttempts = 0;
  let successCount = 0;

  console.log("🔄 スカーレット・バイオレットのアイテムを取得中...\n");

  for (const range of SV_ITEM_RANGES) {
    console.log(`📡 ID ${range.start}〜${range.end} を取得中...`);

    for (let id = range.start; id <= range.end; id++) {
      totalAttempts++;

      try {
        const item = await fetchItem(id);
        const transformed = transformItemData(item);

        items.push({
          id: transformed.id,
          name: transformed.name,
          nameJa: transformed.nameJa,
          cost: transformed.cost,
        });

        successCount++;

        // 進捗表示（10件ごと）
        if (successCount % 10 === 0) {
          process.stdout.write(`\r   取得済み: ${successCount}件 / 試行: ${totalAttempts}件`);
        }
      } catch (error) {
        // エラーは無視（存在しないID）
      }
    }

    console.log(`\r   取得済み: ${successCount}件 / 試行: ${totalAttempts}件 ✅`);
  }

  console.log(`\n✅ 合計 ${items.length}件のアイテムを取得しました\n`);

  return items.sort((a, b) => a.id - b.id);
}

/**
 * バトル用アイテムのみをフィルタ
 */
function filterBattleItems(items: SVItem[]): SVItem[] {
  return items.filter(item => {
    const searchText = `${item.nameJa} ${item.name}`.toLowerCase();
    return BATTLE_ITEM_KEYWORDS.some(keyword =>
      searchText.includes(keyword.toLowerCase())
    );
  });
}

/**
 * アイテムをカテゴリ別に分類
 */
function categorizeItems(items: SVItem[]): Map<string, SVItem[]> {
  const categories = new Map<string, SVItem[]>();

  items.forEach(item => {
    let category = "その他";

    if (item.name.includes("ball")) {
      category = "モンスターボール";
    } else if (item.name.includes("potion") || item.name.includes("heal")) {
      category = "回復アイテム";
    } else if (item.name.includes("berry")) {
      category = "きのみ";
    } else if (
      BATTLE_ITEM_KEYWORDS.some(keyword =>
        `${item.nameJa} ${item.name}`.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      category = "バトル用持ち物";
    } else if (item.name.includes("tm") || item.name.includes("tr")) {
      category = "わざマシン";
    } else if (item.cost === 0) {
      category = "貴重品";
    }

    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(item);
  });

  return categories;
}

/**
 * アイテムリストを表示
 */
function displayItems(items: SVItem[], title: string) {
  console.log("=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
  console.log();

  items.forEach((item, index) => {
    const costText = item.cost > 0 ? `¥${item.cost.toLocaleString()}` : "非売品";
    console.log(`${(index + 1).toString().padStart(4)}. ID:${item.id.toString().padStart(4)} | ${item.nameJa.padEnd(20)} | ${item.name.padEnd(25)} | ${costText}`);
  });

  console.log();
  console.log(`合計: ${items.length}件`);
  console.log();
}

/**
 * カテゴリ別に表示
 */
function displayByCategory(items: SVItem[]) {
  const categories = categorizeItems(items);

  console.log("=".repeat(60));
  console.log("📂 カテゴリ別アイテムリスト");
  console.log("=".repeat(60));
  console.log();

  const sortedCategories = Array.from(categories.entries()).sort((a, b) => {
    // バトル用持ち物を最初に表示
    if (a[0] === "バトル用持ち物") return -1;
    if (b[0] === "バトル用持ち物") return 1;
    return b[1].length - a[1].length; // 件数の多い順
  });

  sortedCategories.forEach(([category, categoryItems]) => {
    console.log(`\n【${category}】 (${categoryItems.length}件)`);
    console.log("-".repeat(60));

    categoryItems.slice(0, 20).forEach((item, index) => {
      const costText = item.cost > 0 ? `¥${item.cost.toLocaleString()}` : "非売品";
      console.log(`  ${(index + 1).toString().padStart(2)}. ID:${item.id.toString().padStart(4)} | ${item.nameJa.padEnd(18)} | ${costText}`);
    });

    if (categoryItems.length > 20) {
      console.log(`  ... 他 ${categoryItems.length - 20}件`);
    }
  });

  console.log();
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || "--all";

  try {
    const allItems = await fetchAllSVItems();

    switch (mode) {
      case "--battle":
      case "-b":
        const battleItems = filterBattleItems(allItems);
        displayItems(battleItems, "⚔️  バトル用アイテム一覧（スカーレット・バイオレット）");
        break;

      case "--category":
      case "-c":
        displayByCategory(allItems);
        break;

      case "--all":
      case "-a":
      default:
        displayItems(allItems, "📋 全アイテム一覧（スカーレット・バイオレット）");
        break;
    }

    // JSONファイルとして保存（オプション）
    if (args.includes("--save") || args.includes("-s")) {
      const fs = await import("fs");
      const outputPath = "sv-items.json";
      fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), "utf-8");
      console.log(`\n💾 ${outputPath} に保存しました`);
    }
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

// コマンドライン実行
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log("🎯 使い方:\n");
    console.log("  npx tsx packages/shared/src/api/list-sv-items.ts [オプション]\n");
    console.log("オプション:");
    console.log("  --all, -a       すべてのアイテムを表示（デフォルト）");
    console.log("  --battle, -b    バトル用アイテムのみ表示");
    console.log("  --category, -c  カテゴリ別に表示");
    console.log("  --save, -s      JSON形式で保存");
    console.log("  --help, -h      このヘルプを表示\n");
    console.log("例:");
    console.log("  npx tsx packages/shared/src/api/list-sv-items.ts");
    console.log("  npx tsx packages/shared/src/api/list-sv-items.ts --battle");
    console.log("  npx tsx packages/shared/src/api/list-sv-items.ts --category");
    console.log("  npx tsx packages/shared/src/api/list-sv-items.ts --save\n");
    process.exit(0);
  }

  main();
}

export { fetchAllSVItems, filterBattleItems, categorizeItems };
