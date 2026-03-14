import { db } from '@/db';
import { abilities } from '@/db/schema';
import { ilike, or, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

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
