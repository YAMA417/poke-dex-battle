import { db } from '@/db';
import { items } from '@/db/schema';
import { ilike, or, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

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
