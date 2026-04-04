import { db } from '@poke-dex-battle/db';
import { learnsets, moves, pokemon } from '@poke-dex-battle/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ pokemon: string }> }) {
  const pokemonSlug = (await params).pokemon;

  // slug → numeric pokemon.id
  const pkRow = await db
    .select({ id: pokemon.id, baseFormId: pokemon.baseFormId })
    .from(pokemon)
    .where(eq(pokemon.slug, pokemonSlug))
    .limit(1);

  if (pkRow.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let pokemonNumericId = pkRow[0].id;
  let result = await db.select().from(learnsets).where(eq(learnsets.pokemonId, pokemonNumericId));

  // フォルムポケモンでlearnsetが無い場合、baseFormIdにfallback
  if (result.length === 0 && pkRow[0].baseFormId) {
    pokemonNumericId = pkRow[0].baseFormId;
    result = await db.select().from(learnsets).where(eq(learnsets.pokemonId, pokemonNumericId));
  }

  if (result.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // moveId(number) → move slug のフラットリストで返す（method別分類は不要）
  const moveIds = [...new Set(result.map((r) => r.moveId))];
  const moveRowsFull = await db
    .select({ id: moves.id, slug: moves.slug })
    .from(moves)
    .where(inArray(moves.id, moveIds));

  const moveSlugs = moveRowsFull.map((m) => m.slug);

  return NextResponse.json({ pokemonId: pokemonSlug, moves: moveSlugs });
}
