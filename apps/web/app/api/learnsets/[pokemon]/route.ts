import { db } from '@poke-dex-battle/db';
import { learnsets, pokemon } from '@poke-dex-battle/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ pokemon: string }> }) {
  const pokemonParam = (await params).pokemon;

  // name → numeric pokemon.id
  const pkRow = await db
    .select({ id: pokemon.id, baseFormId: pokemon.baseFormId })
    .from(pokemon)
    .where(eq(pokemon.name, pokemonParam))
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

  // moveId(number) → DB IDのフラットリストで返す
  const moveIds = [...new Set(result.map((r) => r.moveId))];

  return NextResponse.json({ pokemonId: pokemonParam, moves: moveIds });
}
