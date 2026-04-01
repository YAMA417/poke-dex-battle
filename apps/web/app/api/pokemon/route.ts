import { cache } from 'react';
import { db } from '@poke-dex-battle/db';
import {
  pokemon,
  regulationPokemon,
  abilities,
  items,
  regulations,
} from '@poke-dex-battle/db/schema';
import { ilike, or, asc, eq, and, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

type AbilityInfo = { slug: string; nameJa: string };
type ItemInfo = { slug: string; nameJa: string };

// 特性ID(number)→{slug,nameJa}マップ
const getAbilityMap = cache(async (): Promise<Map<number, AbilityInfo>> => {
  const rows = await db
    .select({ id: abilities.id, slug: abilities.slug, nameJa: abilities.nameJa })
    .from(abilities);
  return new Map(rows.map((r) => [r.id, { slug: r.slug, nameJa: r.nameJa }]));
});

// アイテムID(number)→{slug,nameJa}マップ
const getItemMap = cache(async (): Promise<Map<number, ItemInfo>> => {
  const rows = await db
    .select({ id: items.id, slug: items.slug, nameJa: items.nameJa })
    .from(items);
  return new Map(rows.map((r) => [r.id, { slug: r.slug, nameJa: r.nameJa }]));
});

// ポケモンID(number)→slugマップ（baseFormId解決用）
const getPokemonSlugMap = cache(async (): Promise<Map<number, string>> => {
  const rows = await db.select({ id: pokemon.id, slug: pokemon.slug }).from(pokemon);
  return new Map(rows.map((r) => [r.id, r.slug]));
});

function enrichPokemon(
  rows: (typeof pokemon.$inferSelect)[],
  abilityMap: Map<number, AbilityInfo>,
  itemMap: Map<number, ItemInfo>,
  pokemonSlugMap?: Map<number, string>
) {
  return rows.map((row) => {
    const ab0 = abilityMap.get(row.ability0Id);
    const ab1 = row.ability1Id ? abilityMap.get(row.ability1Id) : null;
    const abH = row.abilityHId ? abilityMap.get(row.abilityHId) : null;
    const fixedItemInfo = row.fixedItemId ? itemMap.get(row.fixedItemId) : null;
    // baseFormId → slug の解決（マップがあれば使用）
    const baseFormSlug =
      row.baseFormId && pokemonSlugMap ? (pokemonSlugMap.get(row.baseFormId) ?? null) : null;
    return {
      ...row,
      id: row.slug, // 外部IDはslug文字列で統一
      ability0: ab0?.slug ?? null,
      ability1: ab1?.slug ?? null,
      abilityH: abH?.slug ?? null,
      ability0Ja: ab0?.nameJa ?? null,
      ability1Ja: ab1?.nameJa ?? null,
      abilityHJa: abH?.nameJa ?? null,
      fixedItem: fixedItemInfo?.slug ?? null,
      fixedItemNameJa: fixedItemInfo?.nameJa ?? null,
      formType: row.formType,
      baseFormSlug,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const name = searchParams.get('name');
  const regulation = searchParams.get('regulation');
  const megaFormsBase = searchParams.get('megaForms');

  const [abilityMap, itemMap, pokemonSlugMap] = await Promise.all([
    getAbilityMap(),
    getItemMap(),
    getPokemonSlugMap(),
  ]);

  // メガフォーム検索: baseフォームのslugを指定してメガ/ゲンシカイキフォームを返す
  if (megaFormsBase) {
    const baseRow = await db
      .select({ id: pokemon.id })
      .from(pokemon)
      .where(eq(pokemon.slug, megaFormsBase))
      .limit(1);
    if (!baseRow[0]) return NextResponse.json([]);
    const results = await db
      .select()
      .from(pokemon)
      .where(
        and(inArray(pokemon.formType, ['mega', 'primal']), eq(pokemon.baseFormId, baseRow[0].id))
      )
      .orderBy(asc(pokemon.slug));
    return NextResponse.json(enrichPokemon(results, abilityMap, itemMap, pokemonSlugMap));
  }

  // 名前完全一致検索（日本語名 or 英語名 or slug）
  if (name) {
    const normalized = name.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const results = await db
      .select()
      .from(pokemon)
      .where(or(eq(pokemon.nameJa, name), ilike(pokemon.name, name), eq(pokemon.slug, normalized)))
      .limit(1);
    const enriched = enrichPokemon(results, abilityMap, itemMap, pokemonSlugMap);
    return NextResponse.json(enriched[0] ?? null);
  }

  // レギュレーションフィルタ付き一覧（スラッグまたは数値IDで検索）
  if (regulation) {
    const regulationIdNum = parseInt(regulation, 10);
    let regulationId: number;
    if (!isNaN(regulationIdNum)) {
      regulationId = regulationIdNum;
    } else {
      // スラッグで検索
      const [reg] = await db
        .select({ id: regulations.id })
        .from(regulations)
        .where(eq(regulations.slug, regulation))
        .limit(1);
      if (!reg) return NextResponse.json([]);
      regulationId = reg.id;
    }
    const results = await db
      .select()
      .from(pokemon)
      .innerJoin(regulationPokemon, eq(pokemon.id, regulationPokemon.pokemonId))
      .where(
        q
          ? and(
              eq(regulationPokemon.regulationId, regulationId),
              or(ilike(pokemon.nameJa, `%${q}%`), ilike(pokemon.name, `%${q}%`))
            )
          : eq(regulationPokemon.regulationId, regulationId)
      )
      .orderBy(asc(pokemon.num));

    // innerJoin は { pokemon: ..., regulation_pokemon: ... } を返す
    const pokemonRows = results.map((r) => r.pokemon);
    return NextResponse.json(enrichPokemon(pokemonRows, abilityMap, itemMap, pokemonSlugMap));
  }

  // 部分一致検索
  if (q) {
    const results = await db
      .select()
      .from(pokemon)
      .where(or(ilike(pokemon.nameJa, `%${q}%`), ilike(pokemon.name, `%${q}%`)))
      .orderBy(asc(pokemon.num));
    return NextResponse.json(enrichPokemon(results, abilityMap, itemMap, pokemonSlugMap));
  }

  const all = await db.select().from(pokemon).orderBy(asc(pokemon.num));
  return NextResponse.json(enrichPokemon(all, abilityMap, itemMap, pokemonSlugMap));
}
