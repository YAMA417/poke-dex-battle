import { db } from '@poke-dex-battle/db';
import { regulations } from '@poke-dex-battle/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const isDefault = searchParams.get('default');

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

    if (isDefault === 'true') {
      // デフォルトレギュレーション（isDefault=true）を1件返す
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

    // パラメータなし: 全レギュレーション一覧を返す
    const rows = await db
      .select({
        id: regulations.id,
        name: regulations.name,
        battleSystems: regulations.battleSystems,
      })
      .from(regulations);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('レギュレーション取得エラー:', error);
    return NextResponse.json({ error: 'レギュレーション取得に失敗しました' }, { status: 500 });
  }
}
