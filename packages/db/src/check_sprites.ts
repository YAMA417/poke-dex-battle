import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pokemon } from './schema';
import { isNull, inArray } from 'drizzle-orm';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../../apps/web/.env.local') });
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

async function main() {
  const nullRows = await db.select({ slug: pokemon.slug }).from(pokemon).where(isNull(pokemon.spriteUrl));
  console.log('sprite_url = null:', nullRows.length, '件');

  const samples = await db
    .select({ slug: pokemon.slug, spriteUrl: pokemon.spriteUrl })
    .from(pokemon)
    .where(
      inArray(pokemon.slug, [
        'bulbasaur', 'venusaur-mega', 'urshifu', 'urshifu-rapid-strike',
        'calyrex-ice', 'ogerpon-hearthflame', 'terapagos-terastal', 'arceus-fire', 'palafin',
      ])
    );
  for (const r of samples) console.log(r.slug!.padEnd(25), r.spriteUrl);

  await client.end();
}
main().catch(console.error);
