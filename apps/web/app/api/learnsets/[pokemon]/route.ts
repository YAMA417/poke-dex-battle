import { db } from '@poke-dex-battle/db';
import { learnsets, pokemon } from '@poke-dex-battle/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ pokemon: string }> }) {
  const { pokemonId } = { pokemonId: (await params).pokemon };
  let result = await db.select().from(learnsets).where(eq(learnsets.pokemonId, pokemonId));

  // フォルムポケモンでlearnsetが無い場合、同じ図鑑番号のベースフォルムにfallback
  if (result.length === 0 && pokemonId.includes('-')) {
    const formPokemon = await db
      .select({ num: pokemon.num })
      .from(pokemon)
      .where(eq(pokemon.id, pokemonId))
      .limit(1);

    if (formPokemon.length > 0) {
      // 同じ図鑑番号のデフォルトフォルム（ハイフンなし or 最短ID）を探す
      const siblings = await db
        .select({ id: pokemon.id })
        .from(pokemon)
        .where(eq(pokemon.num, formPokemon[0].num));

      // ハイフンを含まないIDがベースフォルム
      const baseForm = siblings.find((s) => !s.id.includes('-'));
      if (baseForm) {
        result = await db.select().from(learnsets).where(eq(learnsets.pokemonId, baseForm.id));
      }
    }
  }

  if (result.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const level: string[] = [];
  const machine: string[] = [];
  const egg: string[] = [];

  for (const row of result) {
    switch (row.method) {
      case 'level-up':
        level.push(row.moveId);
        break;
      case 'machine':
        machine.push(row.moveId);
        break;
      case 'egg':
        egg.push(row.moveId);
        break;
    }
  }

  return NextResponse.json({ pokemonId, level, machine, egg });
}
