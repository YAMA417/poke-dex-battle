/**
 * ============================================================
 * PokéAPI クライアント 動作確認用テストファイル
 * ============================================================
 *
 * このファイルは開発中の動作確認のために作成された一時ファイルです。
 *
 * 目的:
 * - PokéAPIからのデータ取得が正常に動作するか確認
 * - データ変換（生データ → 正規化）が正しく動作するか確認
 * - 日本語名の取得が正しく動作するか確認
 *
 * 実行方法:
 * ```bash
 * npx tsx packages/shared/src/api/test.ts
 * ```
 *
 * フロント側（apps/web）での使用例:
 * ```typescript
 * // app/components/PokemonCard.tsx
 * import { fetchPokemon, fetchPokemonSpecies } from '@poke-dex-battle/shared/api';
 * import { transformPokemonData } from '@poke-dex-battle/shared/api/transform';
 *
 * export default async function PokemonCard({ id }: { id: number }) {
 *   // PokéAPIからデータ取得
 *   const [pokemon, species] = await Promise.all([
 *     fetchPokemon(id),
 *     fetchPokemonSpecies(id),
 *   ]);
 *
 *   // データを正規化
 *   const pokemonData = transformPokemonData(pokemon, species);
 *
 *   return (
 *     <div>
 *       <h1>{pokemonData.nameJa}</h1>
 *       <p>タイプ: {pokemonData.types.join(', ')}</p>
 *       <p>HP: {pokemonData.baseStats.hp}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * 注意:
 * - このファイルは本番環境には含まれません
 * - 動作確認後は削除しても問題ありません
 * - 正式なテストが必要な場合はVitestを導入してください
 *
 * ============================================================
 */

import {
  fetchItem,
  fetchMove,
  fetchPokemon,
  fetchPokemonSpecies,
} from "./pokeapi";
import {
  transformItemData,
  transformMoveData,
  transformPokemonData,
} from "./transform";

/**
 * ピカチュウのデータを取得してテスト
 */
async function testPikachu() {
  console.log("🔍 ピカチュウのデータを取得中...");
  console.log("📡 URL: https://pokeapi.co/api/v2/pokemon/25");
  console.log("📡 URL: https://pokeapi.co/api/v2/pokemon-species/25");

  try {
    // ポケモンデータと種族情報を並行取得
    const [pokemon, species] = await Promise.all([
      fetchPokemon(25), // ピカチュウ
      fetchPokemonSpecies(25),
    ]);

    console.log("✅ PokéAPIからデータ取得成功");
    console.log("生データ:", {
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types.map((t) => t.type.name),
    });

    // データを正規化
    const transformed = transformPokemonData(pokemon, species);

    console.log("✅ データ変換成功");
    console.log("正規化データ:", {
      id: transformed.id,
      name: transformed.name,
      nameJa: transformed.nameJa,
      types: transformed.types,
      baseStats: transformed.baseStats,
    });

    return transformed;
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    throw error;
  }
}

/**
 * 10まんボルトのデータを取得してテスト
 */
async function testThunderbolt() {
  console.log("\n🔍 10まんボルトのデータを取得中...");
  console.log("📡 URL: https://pokeapi.co/api/v2/move/85");

  try {
    const move = await fetchMove(85); // 10まんボルト

    console.log("✅ PokéAPIからデータ取得成功");

    // データを正規化
    const transformed = transformMoveData(move);

    console.log("✅ データ変換成功");
    console.log("正規化データ:", {
      id: transformed.id,
      name: transformed.name,
      nameJa: transformed.nameJa,
      type: transformed.type,
      category: transformed.category,
      power: transformed.power,
      accuracy: transformed.accuracy,
    });

    return transformed;
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    throw error;
  }
}

/**
 * マスターボールのデータを取得してテスト
 */
async function testMasterBall() {
  console.log("\n🔍 マスターボールのデータを取得中...");
  console.log("📡 URL: https://pokeapi.co/api/v2/item/1");

  try {
    const item = await fetchItem(1); // マスターボール

    console.log("✅ PokéAPIからデータ取得成功");

    // データを正規化
    const transformed = transformItemData(item);

    console.log("✅ データ変換成功");
    console.log("正規化データ:", {
      id: transformed.id,
      name: transformed.name,
      nameJa: transformed.nameJa,
      cost: transformed.cost,
      effectJa: transformed.effectJa,
    });

    return transformed;
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    throw error;
  }
}

/**
 * ポケモンに持たせる道具リストを一括取得してテスト
 * プルダウンで使うようなケースを想定
 */
async function testHeldItemsList() {
  console.log("\n🔍 持ち物リストを一括取得中...");

  // 代表的な持ち物のID（バトルでよく使われるもの）
  const itemIds = [
    247, // いのちのたま
    252, // きあいのタスキ
    264, // こだわりスカーフ
    274, // こだわりメガネ
    683, // とつげきチョッキ
  ];

  console.log(`📡 ${itemIds.length}件のアイテムを並行取得します`);
  itemIds.forEach((id) => {
    console.log(`   - https://pokeapi.co/api/v2/item/${id}`);
  });

  try {
    // 複数のアイテムを並行取得
    const items = await Promise.all(itemIds.map((id) => fetchItem(id)));

    console.log("✅ PokéAPIからデータ取得成功");

    // データを正規化
    const transformedItems = items.map((item) => transformItemData(item));

    console.log("✅ データ変換成功");
    console.log(`正規化データ (${transformedItems.length}件):`);
    transformedItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.nameJa} (${item.name})`);
    });

    return transformedItems;
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    throw error;
  }
}

/**
 * メインテスト関数
 */
export async function runTest() {
  console.log("🚀 PokéAPIクライアント 動作テスト開始\n");
  console.log("=".repeat(50));

  try {
    await testPikachu();
    await testThunderbolt();
    await testMasterBall();
    await testHeldItemsList();

    console.log("\n" + "=".repeat(50));
    console.log("🎉 すべてのテスト成功！");
  } catch (error) {
    console.log("\n" + "=".repeat(50));
    console.log("💥 テスト失敗");
  }
}

// 直接実行された場合はテストを実行
if (require.main === module) {
  runTest();
}
