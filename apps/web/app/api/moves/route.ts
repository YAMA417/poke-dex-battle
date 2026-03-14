import { db } from '@/db';
import { moves } from '@/db/schema';
import { ilike, or, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

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
