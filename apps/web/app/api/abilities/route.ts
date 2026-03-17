import { db } from '@poke-dex-battle/db';
import { abilities } from '@poke-dex-battle/db/schema';
import { ilike, or, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const name = searchParams.get('name');

  if (name) {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const results = await db
      .select()
      .from(abilities)
      .where(
        or(eq(abilities.nameJa, name), ilike(abilities.name, name), eq(abilities.id, normalized))
      )
      .limit(1);
    return NextResponse.json(results[0] ?? null);
  }

  if (q) {
    const results = await db
      .select()
      .from(abilities)
      .where(or(ilike(abilities.nameJa, `%${q}%`), ilike(abilities.name, `%${q}%`)))
      .orderBy(asc(abilities.num));
    return NextResponse.json(results);
  }

  const all = await db.select().from(abilities).orderBy(asc(abilities.num));
  return NextResponse.json(all);
}
