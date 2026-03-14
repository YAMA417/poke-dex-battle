/**
 * DB再構築スクリプト
 * 全テーブルを削除→新スキーマで再作成→データ投入
 */
import { resolve } from 'path';
import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL が設定されていません');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });

async function rebuild() {
  console.log('=== DB再構築開始 ===\n');

  // 全テーブル削除
  console.log('Step 1: 全テーブル削除...');
  await client`DROP TABLE IF EXISTS learnsets CASCADE`;
  await client`DROP TABLE IF EXISTS regulation_pokemon CASCADE`;
  await client`DROP TABLE IF EXISTS regulations CASCADE`;
  await client`DROP TABLE IF EXISTS games CASCADE`;
  await client`DROP TABLE IF EXISTS pokemon CASCADE`;
  await client`DROP TABLE IF EXISTS species CASCADE`;
  await client`DROP TABLE IF EXISTS moves CASCADE`;
  await client`DROP TABLE IF EXISTS abilities CASCADE`;
  await client`DROP TABLE IF EXISTS items CASCADE`;
  console.log('  完了');

  console.log('\n=== DB再構築完了（テーブル削除済み） ===');
  console.log('次に drizzle-kit push でスキーマを反映してください');
  await client.end();
}

rebuild().catch((e) => {
  console.error('失敗:', e);
  process.exit(1);
});
