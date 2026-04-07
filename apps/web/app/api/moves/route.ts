import { db } from '@poke-dex-battle/db';
import { moves } from '@poke-dex-battle/db/schema';
import { ilike, or, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const name = searchParams.get('name');

  if (name) {
    const results = await db
      .select()
      .from(moves)
      .where(or(eq(moves.nameJa, name), ilike(moves.name, name)))
      .limit(1);
    return NextResponse.json(results[0] ?? null);
  }

  if (q) {
    const results = await db
      .select()
      .from(moves)
      .where(or(ilike(moves.nameJa, `%${q}%`), ilike(moves.name, `%${q}%`)))
      .orderBy(asc(moves.num));
    return NextResponse.json(results);
  }

  const all = await db.select().from(moves).orderBy(asc(moves.num));
  return NextResponse.json(all);
}
