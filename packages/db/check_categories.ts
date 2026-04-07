import { db, client } from './src/index';
import { pokemon } from './src/schema';
import { sql } from 'drizzle-orm';

const rows = await db
  .select({ category: pokemon.category, count: sql<number>`count(*)` })
  .from(pokemon)
  .groupBy(pokemon.category);

console.log(rows);
await client.end();
