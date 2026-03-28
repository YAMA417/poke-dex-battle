import { resolve } from 'path';
import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// DATABASE_URL が未設定の場合のみ .env.local から読み込む（シェルからの上書きを優先）
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: resolve(__dirname, '../../apps/web/.env.local') });
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
