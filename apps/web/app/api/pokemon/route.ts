import { db } from '@/db';
import { species } from '@/db/schema';
import { ilike, or, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (q) {
    const results = await db
      .select()
      .from(species)
      .where(or(ilike(species.nameJa, `%${q}%`), ilike(species.name, `%${q}%`)))
      .orderBy(asc(species.num));
    return NextResponse.json(results);
  }

  const all = await db.select().from(species).orderBy(asc(species.num));
  return NextResponse.json(all);
}
