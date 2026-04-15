import { cache } from 'react';
import { db } from '@poke-dex-battle/db';
import {
  pokemon,
  regulationPokemon,
  abilities,
  items,
  regulations,
} from '@poke-dex-battle/db/schema';
import { ilike, or, asc, eq, and, inArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

type AbilityInfo = { name: string; nameJa: string };
type ItemInfo = { name: string; nameJa: string };

// 特性ID(number)→{name,nameJa}マップ
const getAbilityMap = cache(async (): Promise<Map<number, AbilityInfo>> => {
  const rows = await db
    .select({ id: abilities.id, name: abilities.name, nameJa: abilities.nameJa })
    .from(abilities);
  return new Map(rows.map((r) => [r.id, { name: r.name, nameJa: r.nameJa }]));
});

// アイテムID(number)→{name,nameJa}マップ
const getItemMap = cache(async (): Promise<Map<number, ItemInfo>> => {
  const rows = await db
    .select({ id: items.id, name: items.name, nameJa: items.nameJa })
    .from(items);
  return new Map(rows.map((r) => [r.id, { name: r.name, nameJa: r.nameJa }]));
});

function enrichPokemon(
  rows: (typeof pokemon.$inferSelect)[],
  abilityMap: Map<number, AbilityInfo>,
  itemMap: Map<number, ItemInfo>
) {
  return rows.map((row) => {
    const ab0 = abilityMap.get(row.ability0Id);
    const ab1 = row.ability1Id ? abilityMap.get(row.ability1Id) : null;
    const abH = row.abilityHId ? abilityMap.get(row.abilityHId) : null;
    const fixedItemInfo = row.fixedItemId ? itemMap.get(row.fixedItemId) : null;
    return {
      ...row,
      id: row.id, // 数値IDをそのまま返す
      ability0: ab0?.name ?? null,
      ability1: ab1?.name ?? null,
      abilityH: abH?.name ?? null,
      ability0Ja: ab0?.nameJa ?? null,
      ability1Ja: ab1?.nameJa ?? null,
      abilityHJa: abH?.nameJa ?? null,
      fixedItem: fixedItemInfo?.name ?? null,
      fixedItemNameJa: fixedItemInfo?.nameJa ?? null,
      formType: row.formType,
      baseFormId: row.baseFormId,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const name = searchParams.get('name');
  const regulation = searchParams.get('regulation');
  const megaFormsBase = searchParams.get('megaForms');

  const [abilityMap, itemMap] = await Promise.all([getAbilityMap(), getItemMap()]);

  // フォルムタイプの並び順: base → variant → mega → primal → tera → battle_only
  const formTypeOrder = sql`CASE ${pokemon.formType}
    WHEN 'base' THEN 0
    WHEN 'variant' THEN 1
    WHEN 'mega' THEN 2
    WHEN 'primal' THEN 3
    WHEN 'tera' THEN 4
    WHEN 'battle_only' THEN 5
    ELSE 99
  END`;

  // メガフォーム検索: baseフォームのnameを指定してメガ/ゲンシカイキフォームを返す
  if (megaFormsBase) {
    const baseRow = await db
      .select({ id: pokemon.id })
      .from(pokemon)
      .where(eq(pokemon.name, megaFormsBase))
      .limit(1);
    if (!baseRow[0]) return NextResponse.json([]);
    const results = await db
      .select()
      .from(pokemon)
      .where(
        and(inArray(pokemon.formType, ['mega', 'primal']), eq(pokemon.baseFormId, baseRow[0].id))
      )
      .orderBy(asc(pokemon.num), formTypeOrder, asc(pokemon.name));
    return NextResponse.json(enrichPokemon(results, abilityMap, itemMap));
  }

  // 名前完全一致検索（日本語名 or 英語名）
  if (name) {
    const results = await db
      .select()
      .from(pokemon)
      .where(or(eq(pokemon.nameJa, name), ilike(pokemon.name, name)))
      .limit(1);
    const enriched = enrichPokemon(results, abilityMap, itemMap);
    return NextResponse.json(enriched[0] ?? null);
  }

  // レギュレーションフィルタ付き一覧（nameまたは数値IDで検索）
  if (regulation) {
    const regulationIdNum = parseInt(regulation, 10);
    let regulationId: number;
    if (!isNaN(regulationIdNum)) {
      regulationId = regulationIdNum;
    } else {
      // nameで検索
      const [reg] = await db
        .select({ id: regulations.id })
        .from(regulations)
        .where(eq(regulations.name, regulation))
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
      .orderBy(asc(pokemon.num), formTypeOrder, asc(pokemon.name));

    // innerJoin は { pokemon: ..., regulation_pokemon: ... } を返す
    const pokemonRows = results.map((r) => r.pokemon);
    return NextResponse.json(enrichPokemon(pokemonRows, abilityMap, itemMap));
  }

  // 部分一致検索
  if (q) {
    const results = await db
      .select()
      .from(pokemon)
      .where(or(ilike(pokemon.nameJa, `%${q}%`), ilike(pokemon.name, `%${q}%`)))
      .orderBy(asc(pokemon.num), formTypeOrder, asc(pokemon.name));
    return NextResponse.json(enrichPokemon(results, abilityMap, itemMap));
  }

  const all = await db
    .select()
    .from(pokemon)
    .orderBy(asc(pokemon.num), formTypeOrder, asc(pokemon.name));
  return NextResponse.json(enrichPokemon(all, abilityMap, itemMap));
}
