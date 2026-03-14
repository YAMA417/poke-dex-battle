import { db } from '@/db';
import { moves } from '@/db/schema';
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
      .from(moves)
      .where(or(eq(moves.nameJa, name), ilike(moves.name, name), eq(moves.id, normalized)))
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
