import { db } from '@/db';
import { learnsets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pokemon: string }> }
) {
  const { pokemon } = await params;
  const result = await db
    .select()
    .from(learnsets)
    .where(eq(learnsets.speciesId, pokemon))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
