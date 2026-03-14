import { db } from '@/db';
import { species } from '@/db/schema';
import { ilike, or, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const name = searchParams.get('name');

  // 名前完全一致検索（日本語名 or 英語名 or ID）
  if (name) {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const results = await db
      .select()
      .from(species)
      .where(or(eq(species.nameJa, name), ilike(species.name, name), eq(species.id, normalized)))
      .limit(1);
    return NextResponse.json(results[0] ?? null);
  }

  // 部分一致検索
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
