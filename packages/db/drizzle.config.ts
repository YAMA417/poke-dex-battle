import { resolve } from 'path';
import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// apps/web/.env.local から環境変数を読む
dotenv.config({ path: resolve(__dirname, '../../apps/web/.env.local') });

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
