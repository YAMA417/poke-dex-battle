import { cache } from 'react';
import { db } from '@poke-dex-battle/db';
import { pokemon, regulationPokemon, abilities } from '@poke-dex-battle/db/schema';
import { ilike, or, asc, eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// 特性ID→日本語名マップを構築（リクエスト単位で重複排除）
const getAbilityJaMap = cache(async (): Promise<Map<string, string>> => {
  const rows = await db.select({ id: abilities.id, nameJa: abilities.nameJa }).from(abilities);
  return new Map(rows.map((r) => [r.id, r.nameJa]));
});

// ポケモン行に特性日本語名を付与
function attachAbilityJa(
  rows: Record<string, unknown>[],
  abilityJaMap: Map<string, string>
): Record<string, unknown>[] {
  return rows.map((row) => ({
    ...row,
    ability0Ja: abilityJaMap.get(row.ability0 as string) ?? null,
    ability1Ja: row.ability1 ? (abilityJaMap.get(row.ability1 as string) ?? null) : null,
    abilityHJa: row.abilityH ? (abilityJaMap.get(row.abilityH as string) ?? null) : null,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const name = searchParams.get('name');
  const regulation = searchParams.get('regulation');

  const abilityJaMap = await getAbilityJaMap();

  // 名前完全一致検索（日本語名 or 英語名 or ID）
  if (name) {
    const normalized = name.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const results = await db
      .select()
      .from(pokemon)
      .where(or(eq(pokemon.nameJa, name), ilike(pokemon.name, name), eq(pokemon.id, normalized)))
      .limit(1);
    const enriched = attachAbilityJa(results, abilityJaMap);
    return NextResponse.json(enriched[0] ?? null);
  }

  // レギュレーションフィルタ付き一覧
  if (regulation) {
    const baseQuery = db
      .select({
        id: pokemon.id,
        num: pokemon.num,
        name: pokemon.name,
        nameJa: pokemon.nameJa,
        types: pokemon.types,
        hp: pokemon.hp,
        atk: pokemon.atk,
        def: pokemon.def,
        spa: pokemon.spa,
        spd: pokemon.spd,
        spe: pokemon.spe,
        ability0: pokemon.ability0,
        ability1: pokemon.ability1,
        abilityH: pokemon.abilityH,
        weightkg: pokemon.weightkg,
        heightm: pokemon.heightm,
        category: pokemon.category,
        spriteUrl: pokemon.spriteUrl,
        fixedItem: pokemon.fixedItem,
        fixedTeraType: pokemon.fixedTeraType,
      })
      .from(pokemon)
      .innerJoin(regulationPokemon, eq(pokemon.id, regulationPokemon.pokemonId))
      .where(
        q
          ? and(
              eq(regulationPokemon.regulationId, regulation),
              or(ilike(pokemon.nameJa, `%${q}%`), ilike(pokemon.name, `%${q}%`))
            )
          : eq(regulationPokemon.regulationId, regulation)
      )
      .orderBy(asc(pokemon.num));

    const results = await baseQuery;
    return NextResponse.json(attachAbilityJa(results, abilityJaMap));
  }

  // 部分一致検索
  if (q) {
    const results = await db
      .select()
      .from(pokemon)
      .where(or(ilike(pokemon.nameJa, `%${q}%`), ilike(pokemon.name, `%${q}%`)))
      .orderBy(asc(pokemon.num));
    return NextResponse.json(attachAbilityJa(results, abilityJaMap));
  }

  const all = await db.select().from(pokemon).orderBy(asc(pokemon.num));
  return NextResponse.json(attachAbilityJa(all, abilityJaMap));
}
