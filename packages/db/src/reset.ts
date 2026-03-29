import { resolve } from 'path';
import dotenv from 'dotenv';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: resolve(__dirname, '../../../apps/web/.env.local') });
}

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function reset() {
  // テーブル削除（FK依存順の逆順、CASCADEで依存も巻き込む）
  await sql`DROP TABLE IF EXISTS regulation_pokemon CASCADE`;
  await sql`DROP TABLE IF EXISTS learnsets CASCADE`;
  await sql`DROP TABLE IF EXISTS pokemon CASCADE`;
  await sql`DROP TABLE IF EXISTS moves CASCADE`;
  await sql`DROP TABLE IF EXISTS abilities CASCADE`;
  await sql`DROP TABLE IF EXISTS items CASCADE`;
  await sql`DROP TABLE IF EXISTS regulations CASCADE`;
  await sql`DROP TABLE IF EXISTS games CASCADE`;
  // Drizzleマイグレーション管理テーブルも削除（履歴リセット）
  await sql`DROP TABLE IF EXISTS drizzle_migrations CASCADE`;
  await sql`DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE`;
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  // enum削除
  await sql`DROP TYPE IF EXISTS pokemon_type CASCADE`;
  await sql`DROP TYPE IF EXISTS learn_method CASCADE`;
  await sql`DROP TYPE IF EXISTS pokemon_category CASCADE`;
  await sql.end();
  console.log('Reset complete. Run db:migrate and db:seed to reinitialize.');
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
