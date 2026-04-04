import { db } from '@poke-dex-battle/db';
import { items } from '@poke-dex-battle/db/schema';
import { ilike, or, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const name = searchParams.get('name');

  if (name) {
    const results = await db
      .select()
      .from(items)
      .where(or(eq(items.nameJa, name), ilike(items.name, name)))
      .limit(1);
    return NextResponse.json(results[0] ?? null);
  }

  if (q) {
    const results = await db
      .select()
      .from(items)
      .where(or(ilike(items.nameJa, `%${q}%`), ilike(items.name, `%${q}%`)))
      .orderBy(asc(items.num));
    return NextResponse.json(results);
  }

  const all = await db.select().from(items).orderBy(asc(items.num));
  return NextResponse.json(all);
}
