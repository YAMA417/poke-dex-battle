import { db } from '@poke-dex-battle/db';
import { regulations } from '@poke-dex-battle/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (name) {
    // 指定nameのレギュレーションを返す
    const [row] = await db
      .select({
        id: regulations.id,
        name: regulations.name,
        battleSystems: regulations.battleSystems,
      })
      .from(regulations)
      .where(eq(regulations.name, name))
      .limit(1);

    return NextResponse.json(row ?? null);
  }

  // デフォルトレギュレーション（isDefault=true）を返す
  const [row] = await db
    .select({
      id: regulations.id,
      name: regulations.name,
      battleSystems: regulations.battleSystems,
    })
    .from(regulations)
    .where(eq(regulations.isDefault, true))
    .limit(1);

  return NextResponse.json(row ?? null);
}
