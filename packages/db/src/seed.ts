/**
 * シードスクリプト（CSV/JSONファイルベース）
 * packages/db/export/*.csv / regulations.json を読み込んでDBに投入する
 *
 * 実行順: abilities → items → moves → pokemon（2パス）→ regulations（2パス）→ learnsets
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  abilities,
  items,
  learnsets,
  moves,
  pokemon,
  regulations,
  regulationPokemon,
} from './schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: resolve(__dirname, '../../../apps/web/.env.local') });
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL が設定されていません');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

const EXPORT_DIR = resolve(__dirname, '../export');

// ---------------------------------------------------------------------------
// CSV パーサー（BOM対応・クォート対応）
// ---------------------------------------------------------------------------

function parseCsv(filePath: string): Record<string, string>[] {
  const content = readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = content.split('\n');

  function parseRow(line: string): string[] {
    const fields: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        fields.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    fields.push(cur);
    return fields;
  }

  const nonEmpty = lines.filter((l) => l.trim());
  const headers = parseRow(nonEmpty[0]);
  return nonEmpty.slice(1).map((line) => {
    const vals = parseRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

function toIntOrNull(s: string): number | null {
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

async function batchInsert<T>(
  label: string,
  rows: T[],
  insertFn: (batch: T[]) => Promise<unknown>,
  batchSize = 100
) {
  for (let i = 0; i < rows.length; i += batchSize) {
    await insertFn(rows.slice(i, i + batchSize));
    process.stdout.write(`\r  ${label}: ${Math.min(i + batchSize, rows.length)} / ${rows.length}`);
  }
  process.stdout.write('\n');
}

// ---------------------------------------------------------------------------
// 1. abilities
// ---------------------------------------------------------------------------

async function seedAbilities(): Promise<number> {
  console.log('\n[1/4] abilities...');
  const rows = parseCsv(resolve(EXPORT_DIR, 'abilities.csv')).filter((r) => r.include === '○');

  const data = rows.map((r) => ({
    slug: r.slug,
    num: parseInt(r.num, 10),
    name: r.name_en,
    nameJa: r.name_ja,
    shortDesc: r.short_desc_en || null,
    shortDescJa: r.short_desc_ja || null,
  }));

  await batchInsert('abilities', data, (batch) =>
    db.insert(abilities).values(batch).onConflictDoNothing()
  );
  return data.length;
}

// ---------------------------------------------------------------------------
// 2. items
// ---------------------------------------------------------------------------

async function seedItems(): Promise<number> {
  console.log('\n[2/4] items...');
  const rows = parseCsv(resolve(EXPORT_DIR, 'items.csv')).filter((r) => r.include === '○');

  const data = rows.map((r) => ({
    slug: r.slug,
    num: parseInt(r.num, 10),
    name: r.name_en,
    nameJa: r.name_ja,
    shortDesc: r.short_desc_en || null,
    shortDescJa: r.short_desc_ja || null,
    isCompetitive: r.is_competitive === '○' || r.is_competitive === 'true',
  }));

  await batchInsert('items', data, (batch) => db.insert(items).values(batch).onConflictDoNothing());
  return data.length;
}

// ---------------------------------------------------------------------------
// 3. moves
// ---------------------------------------------------------------------------

async function seedMoves(): Promise<number> {
  console.log('\n[3/4] moves...');
  const rows = parseCsv(resolve(EXPORT_DIR, 'moves.csv')).filter((r) => r.include === '○');

  type MoveType = (typeof moves.$inferInsert)['type'];

  const data = rows.map((r) => ({
    slug: r.slug,
    num: parseInt(r.num, 10),
    name: r.name_en,
    nameJa: r.name_ja,
    type: r.type as MoveType,
    category: r.category,
    power: toIntOrNull(r.power),
    accuracy: toIntOrNull(r.accuracy),
    pp: parseInt(r.pp, 10),
    priority: parseInt(r.priority, 10) || 0,
    target: r.target,
    shortDesc: r.short_desc_en || null,
    shortDescJa: r.short_desc_ja || null,
  }));

  await batchInsert('moves', data, (batch) => db.insert(moves).values(batch).onConflictDoNothing());
  return data.length;
}

// ---------------------------------------------------------------------------
// 4. pokemon（2パス）
// ---------------------------------------------------------------------------

async function seedPokemon(): Promise<number> {
  console.log('\n[4/4] pokemon...');
  const rows = parseCsv(resolve(EXPORT_DIR, 'pokemon.csv')).filter((r) => r.include === '○');

  // 特性 slug → id マップ
  const abilityRows = await db.select({ id: abilities.id, slug: abilities.slug }).from(abilities);
  const abilityIdMap = new Map(abilityRows.map((a) => [a.slug, a.id]));

  // アイテム slug → id マップ
  const itemRows = await db.select({ id: items.id, slug: items.slug }).from(items);
  const itemIdMap = new Map(itemRows.map((i) => [i.slug, i.id]));

  type PokemonType = (typeof pokemon.$inferInsert)['types'][number];
  type PokemonCategory = (typeof pokemon.$inferInsert)['category'];
  type FormType = (typeof pokemon.$inferInsert)['formType'];

  // パス1: 全件を baseFormId=null で挿入
  const data = rows.map((r) => {
    const ability0Id = abilityIdMap.get(r.ability0_slug);
    if (!ability0Id)
      throw new Error(`ability not found: "${r.ability0_slug}" (pokemon: ${r.slug})`);

    return {
      slug: r.slug,
      num: parseInt(r.num, 10),
      name: r.name_en,
      nameJa: r.name_ja,
      types: [r.type1, r.type2].filter(Boolean) as PokemonType[],
      hp: parseInt(r.hp, 10),
      atk: parseInt(r.atk, 10),
      def: parseInt(r.def, 10),
      spa: parseInt(r.spa, 10),
      spd: parseInt(r.spd, 10),
      spe: parseInt(r.spe, 10),
      ability0Id,
      ability1Id: abilityIdMap.get(r.ability1_slug) ?? null,
      abilityHId: abilityIdMap.get(r.abilityH_slug) ?? null,
      weightkg: parseFloat(r.weight_kg),
      heightm: parseFloat(r.height_m),
      category: (r.category || 'normal') as PokemonCategory,
      spriteUrl: r.sprite_url || null,
      fixedItemId: r.fixed_item
        ? (itemIdMap.get(r.fixed_item) ??
          (() => {
            throw new Error(`item not found: "${r.fixed_item}" (pokemon: ${r.slug})`);
          })())
        : null,
      fixedTeraType: (r.fixed_tera_type as PokemonType) || null,
      genderRate: toIntOrNull(r.gender_rate),
      formType: r.form_type as FormType,
      baseFormId: null,
      nfe: r.nfe === 'true',
    };
  });

  await batchInsert('pokemon pass1', data, (batch) =>
    db
      .insert(pokemon)
      .values(batch)
      .onConflictDoUpdate({
        target: pokemon.slug,
        set: {
          num: sql`excluded.num`,
          name: sql`excluded.name`,
          nameJa: sql`excluded.name_ja`,
          types: sql`excluded.types`,
          hp: sql`excluded.hp`,
          atk: sql`excluded.atk`,
          def: sql`excluded.def`,
          spa: sql`excluded.spa`,
          spd: sql`excluded.spd`,
          spe: sql`excluded.spe`,
          ability0Id: sql`excluded.ability_0_id`,
          ability1Id: sql`excluded.ability_1_id`,
          abilityHId: sql`excluded.ability_h_id`,
          weightkg: sql`excluded.weight_kg`,
          heightm: sql`excluded.height_m`,
          category: sql`excluded.category`,
          spriteUrl: sql`excluded.sprite_url`,
          fixedItemId: sql`excluded.fixed_item_id`,
          fixedTeraType: sql`excluded.fixed_tera_type`,
          genderRate: sql`excluded.gender_rate`,
          formType: sql`excluded.form_type`,
          nfe: sql`excluded.nfe`,
        },
      })
  );

  // パス2: baseFormId 更新
  const pkRows = await db.select({ id: pokemon.id, slug: pokemon.slug }).from(pokemon);
  const pokemonIdMap = new Map(pkRows.map((p) => [p.slug, p.id]));

  const nonBase = rows.filter((r) => r.base_form_slug);
  let updated = 0;
  let warned = 0;
  for (const r of nonBase) {
    const baseFormId = pokemonIdMap.get(r.base_form_slug);
    if (!baseFormId) {
      console.warn(`\n  WARN: base form not found: "${r.base_form_slug}" (for ${r.slug})`);
      warned++;
      continue;
    }
    const selfId = pokemonIdMap.get(r.slug)!;
    await db.update(pokemon).set({ baseFormId }).where(eq(pokemon.id, selfId));
    updated++;
  }
  console.log(`  baseFormId 更新: ${updated}件${warned ? ` / WARN: ${warned}件` : ''}`);

  return data.length;
}

// ---------------------------------------------------------------------------
// 5. regulations + regulation_pokemon
// ---------------------------------------------------------------------------

interface RegulationDef {
  slug: string;
  name: string;
  battleSystems: string[];
  restrictedCount: number;
  mythicalAllowed: boolean;
  fromDate: string | null;
  toDate: string | null;
  isDefault: boolean;
  includePokemonCategories: string[];
}

async function seedRegulations(): Promise<number> {
  console.log('\n[5/5] regulations...');
  const defs: RegulationDef[] = JSON.parse(
    readFileSync(resolve(EXPORT_DIR, 'regulations.json'), 'utf-8')
  );

  let totalPokemon = 0;

  for (const def of defs) {
    // regulation 挿入（conflict時は既存IDを取得）
    await db
      .insert(regulations)
      .values({
        slug: def.slug,
        name: def.name,
        battleSystems: def.battleSystems,
        restrictedCount: def.restrictedCount,
        mythicalAllowed: def.mythicalAllowed,
        fromDate: def.fromDate ?? undefined,
        toDate: def.toDate ?? undefined,
        isDefault: def.isDefault,
      })
      .onConflictDoNothing();

    const existing = await db
      .select({ id: regulations.id })
      .from(regulations)
      .where(eq(regulations.slug, def.slug))
      .limit(1);
    if (existing.length === 0) continue;
    const reg = existing[0];

    console.log(`  ${def.slug} (id=${reg.id}): ポケモン登録中...`);

    // includePokemonCategories に該当する最終進化ポケモンIDを取得
    // formType は 'base'（通常フォーム）と 'variant'（地域フォーム等）のみ対象
    // mega/primal/tera/battle_only はバトル中に変化するフォームのため除外
    // TODO: 将来的に regulations.json の includeFormTypes で制御可能にする
    type PokemonCategory = (typeof pokemon.$inferSelect)['category'];
    type FormType = (typeof pokemon.$inferSelect)['formType'];
    const categories = def.includePokemonCategories as PokemonCategory[];
    const TEAM_SLOT_FORM_TYPES: FormType[] = ['base', 'variant'];
    const pkIds = await db
      .select({ id: pokemon.id })
      .from(pokemon)
      .where(
        and(
          inArray(pokemon.category, categories),
          eq(pokemon.nfe, false),
          inArray(pokemon.formType, TEAM_SLOT_FORM_TYPES)
        )
      );

    const rpData = pkIds.map((p) => ({ regulationId: reg.id, pokemonId: p.id }));

    // 既存レコードを削除してから再挿入（nfe等の変更を確実に反映するため）
    await db.delete(regulationPokemon).where(eq(regulationPokemon.regulationId, reg.id));
    await batchInsert(`  ${def.slug}`, rpData, (batch) =>
      db.insert(regulationPokemon).values(batch).onConflictDoNothing()
    );
    totalPokemon += rpData.length;
  }

  return defs.length;
}

// ---------------------------------------------------------------------------
// 6. learnsets
// ---------------------------------------------------------------------------

async function seedLearnsets(): Promise<number> {
  console.log('\n[6/6] learnsets...');

  const csvPath = resolve(EXPORT_DIR, 'learnsets.csv');
  let rows: Record<string, string>[];
  try {
    rows = parseCsv(csvPath);
  } catch {
    console.log('  learnsets.csv が見つかりません。スキップします。');
    console.log('  先に npm run db:extract-learnsets を実行してください。');
    return 0;
  }

  if (rows.length === 0) {
    console.log('  learnsets.csv が空です。スキップします。');
    return 0;
  }

  // pokemon.slug → pokemon.id マッピング
  const pkRows = await db.select({ id: pokemon.id, slug: pokemon.slug }).from(pokemon);
  const pokemonIdMap = new Map(pkRows.map((p) => [p.slug, p.id]));

  // moves.slug → moves.id マッピング
  const mvRows = await db.select({ id: moves.id, slug: moves.slug }).from(moves);
  const moveIdMap = new Map(mvRows.map((m) => [m.slug, m.id]));

  type LearnMethod = (typeof learnsets.$inferInsert)['method'];

  const data: (typeof learnsets.$inferInsert)[] = [];
  let skipped = 0;

  for (const r of rows) {
    const pokemonId = pokemonIdMap.get(r.pokemon_slug);
    const moveId = moveIdMap.get(r.move_slug);

    if (!pokemonId || !moveId) {
      skipped++;
      continue;
    }

    data.push({
      pokemonId,
      moveId,
      method: r.method as LearnMethod,
      level: parseInt(r.level, 10) || 0,
    });
  }

  if (skipped > 0) {
    console.log(`  スキップ（slug不一致）: ${skipped}件`);
  }

  await batchInsert('learnsets', data, (batch) =>
    db.insert(learnsets).values(batch).onConflictDoNothing()
  );

  return data.length;
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== seed 開始 ===');

  const counts = {
    abilities: await seedAbilities(),
    items: await seedItems(),
    moves: await seedMoves(),
    pokemon: await seedPokemon(),
    regulations: await seedRegulations(),
    learnsets: await seedLearnsets(),
  };

  console.log('\n=== 完了 ===');
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(12)}: ${v} 件`);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
