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
import { and, eq, inArray } from 'drizzle-orm';

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
  const content = readFileSync(filePath, 'utf-8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
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

function toBool(s: string): boolean {
  return s === '○' || s === 'true';
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

/**
 * damage_effect JSONファイルを読み込む
 * キーは英語名、値はDamageEffect JSON
 */
function loadDamageEffects(filename: string): Record<string, unknown> {
  try {
    const path = resolve(EXPORT_DIR, 'damage-effects', filename);
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    console.warn(`  WARN: damage-effects/${filename} が見つかりません。スキップします。`);
    return {};
  }
}

// ---------------------------------------------------------------------------
// 1. abilities
// ---------------------------------------------------------------------------

async function seedAbilities(): Promise<number> {
  console.log('\n[1/6] abilities...');
  const rows = parseCsv(resolve(EXPORT_DIR, 'abilities.csv')).filter((r) => r.include === '○');
  const damageEffects = loadDamageEffects('abilities.json');

  const data = rows.map((r) => ({
    num: parseInt(r.num, 10),
    name: r.name_en,
    nameJa: r.name_ja,
    shortDesc: r.short_desc_en || null,
    shortDescJa: r.short_desc_ja || null,
    damageEffect: damageEffects[r.name_en] ?? null,
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
  console.log('\n[2/6] items...');
  const rows = parseCsv(resolve(EXPORT_DIR, 'items.csv')).filter((r) => r.include === '○');
  const damageEffects = loadDamageEffects('items.json');

  const data = rows.map((r) => ({
    num: parseInt(r.num, 10),
    name: r.name_en,
    nameJa: r.name_ja,
    shortDesc: r.short_desc_en || null,
    shortDescJa: r.short_desc_ja || null,
    isCompetitive: toBool(r.is_competitive),
    damageEffect: damageEffects[r.name_en] ?? null,
    category: r.category || null,
  }));

  await batchInsert('items', data, (batch) => db.insert(items).values(batch).onConflictDoNothing());
  return data.length;
}

// ---------------------------------------------------------------------------
// 3. moves
// ---------------------------------------------------------------------------

async function seedMoves(): Promise<number> {
  console.log('\n[3/6] moves...');
  const rows = parseCsv(resolve(EXPORT_DIR, 'moves.csv')).filter((r) => r.include === '○');
  const damageEffects = loadDamageEffects('moves.json');

  type MoveType = (typeof moves.$inferInsert)['type'];

  const data = rows.map((r) => ({
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
    // 技フラグ
    isContact: toBool(r.is_contact),
    isPunch: toBool(r.is_punch),
    isBite: toBool(r.is_bite),
    isAura: toBool(r.is_aura),
    isRecoil: toBool(r.is_recoil),
    isSlicing: toBool(r.is_slicing),
    isSound: toBool(r.is_sound),
    isBullet: toBool(r.is_bullet),
    isWind: toBool(r.is_wind),
    hasSecondaryEffect: toBool(r.has_secondary_effect),
    usesDefenseAsAttack: toBool(r.uses_defense_as_attack),
    targetsPhysicalDefense: toBool(r.targets_physical_defense),
    usesTargetAttack: toBool(r.uses_target_attack),
    damageEffect: damageEffects[r.name_en] ?? null,
  }));

  await batchInsert('moves', data, (batch) => db.insert(moves).values(batch).onConflictDoNothing());
  return data.length;
}

// ---------------------------------------------------------------------------
// 4. pokemon（2パス）
// ---------------------------------------------------------------------------

async function seedPokemon(): Promise<number> {
  console.log('\n[4/6] pokemon...');
  const rows = parseCsv(resolve(EXPORT_DIR, 'pokemon.csv')).filter((r) => r.include === '○');

  // CSVのslug→name_en マップ（abilities用）
  const abilCsv = parseCsv(resolve(EXPORT_DIR, 'abilities.csv'));
  const abilSlugToName = new Map(abilCsv.map((r) => [r.slug, r.name_en]));

  // 特性 name → id マップ
  const abilityRows = await db.select({ id: abilities.id, name: abilities.name }).from(abilities);
  const abilityIdMap = new Map(abilityRows.map((a) => [a.name, a.id]));

  // CSVのslug→name_en マップ（items用）
  const itemCsv = parseCsv(resolve(EXPORT_DIR, 'items.csv'));
  const itemSlugToName = new Map(itemCsv.map((r) => [r.slug, r.name_en]));

  // アイテム name → id マップ
  const itemRows = await db.select({ id: items.id, name: items.name }).from(items);
  const itemIdMap = new Map(itemRows.map((i) => [i.name, i.id]));

  type PokemonType = (typeof pokemon.$inferInsert)['types'][number];
  type PokemonCategory = (typeof pokemon.$inferInsert)['category'];
  type FormType = (typeof pokemon.$inferInsert)['formType'];

  // 特性のslugからDB IDを解決するヘルパー
  function resolveAbilityId(slug: string | undefined): number | null {
    if (!slug) return null;
    const name = abilSlugToName.get(slug);
    if (!name) return null;
    return abilityIdMap.get(name) ?? null;
  }

  // パス1: 全件を baseFormId=null で挿入
  const data = rows.map((r) => {
    const ability0Id = resolveAbilityId(r.ability0_slug);
    if (!ability0Id)
      throw new Error(`ability not found: "${r.ability0_slug}" (pokemon: ${r.name_en})`);

    // アイテムの解決
    let fixedItemId: number | null = null;
    if (r.fixed_item) {
      const itemName = itemSlugToName.get(r.fixed_item);
      if (itemName) {
        fixedItemId = itemIdMap.get(itemName) ?? null;
      }
      if (!fixedItemId) {
        throw new Error(`item not found: "${r.fixed_item}" (pokemon: ${r.name_en})`);
      }
    }

    return {
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
      ability1Id: resolveAbilityId(r.ability1_slug),
      abilityHId: resolveAbilityId(r.abilityH_slug),
      weightkg: parseFloat(r.weight_kg),
      heightm: parseFloat(r.height_m),
      category: (r.category || 'normal') as PokemonCategory,
      spriteUrl: r.sprite_url || null,
      fixedItemId,
      fixedTeraType: (r.fixed_tera_type as PokemonType) || null,
      genderRate: toIntOrNull(r.gender_rate),
      formType: r.form_type as FormType,
      baseFormId: null,
      nfe: r.nfe === 'true',
    };
  });

  await batchInsert('pokemon pass1', data, (batch) =>
    db.insert(pokemon).values(batch).onConflictDoNothing()
  );

  // パス2: baseFormId 更新
  // name → id マップ
  const pkRows = await db.select({ id: pokemon.id, name: pokemon.name }).from(pokemon);
  const pokemonIdMap = new Map(pkRows.map((p) => [p.name, p.id]));

  // CSV slug → name_en マップ
  const pkCsv = parseCsv(resolve(EXPORT_DIR, 'pokemon.csv'));
  const pkSlugToName = new Map(pkCsv.map((r) => [r.slug, r.name_en]));

  const nonBase = rows.filter((r) => r.base_form_slug);
  let updated = 0;
  let warned = 0;
  for (const r of nonBase) {
    const baseFormName = pkSlugToName.get(r.base_form_slug);
    const baseFormId = baseFormName ? pokemonIdMap.get(baseFormName) : undefined;
    if (!baseFormId) {
      console.warn(`\n  WARN: base form not found: "${r.base_form_slug}" (for ${r.name_en})`);
      warned++;
      continue;
    }
    const selfId = pokemonIdMap.get(r.name_en)!;
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
  includePokemonSlugs?: string[];
}

async function seedRegulations(): Promise<number> {
  console.log('\n[5/6] regulations...');
  const defs: RegulationDef[] = JSON.parse(
    readFileSync(resolve(EXPORT_DIR, 'regulations.json'), 'utf-8')
  );

  for (const def of defs) {
    // regulation 挿入（nameで一意判定）
    await db
      .insert(regulations)
      .values({
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
      .where(eq(regulations.name, def.name))
      .limit(1);
    if (existing.length === 0) continue;
    const reg = existing[0];

    console.log(`  ${def.name} (id=${reg.id}): ポケモン登録中...`);

    // includePokemonSlugs が指定されている場合は slug ベースで対象を絞る
    // 指定がなければ従来通り includePokemonCategories で動的生成
    type PokemonCategory = (typeof pokemon.$inferSelect)['category'];
    type FormType = (typeof pokemon.$inferSelect)['formType'];

    let pkIds: { id: number }[];

    if (def.includePokemonSlugs && def.includePokemonSlugs.length > 0) {
      // slug → name_en マップを構築
      const pkCsv = parseCsv(resolve(EXPORT_DIR, 'pokemon.csv'));
      const slugToName = new Map(pkCsv.map((r) => [r.slug, r.name_en]));
      const targetNames = def.includePokemonSlugs
        .map((s) => slugToName.get(s))
        .filter((n): n is string => !!n);

      const TEAM_SLOT_FORM_TYPES: FormType[] = ['base', 'variant'];
      pkIds = await db
        .select({ id: pokemon.id })
        .from(pokemon)
        .where(
          and(inArray(pokemon.name, targetNames), inArray(pokemon.formType, TEAM_SLOT_FORM_TYPES))
        );
      console.log(`    slug指定: ${def.includePokemonSlugs.length}件 → DB一致: ${pkIds.length}件`);
    } else {
      const categories = def.includePokemonCategories as PokemonCategory[];
      const TEAM_SLOT_FORM_TYPES: FormType[] = ['base', 'variant'];
      pkIds = await db
        .select({ id: pokemon.id })
        .from(pokemon)
        .where(
          and(
            inArray(pokemon.category, categories),
            eq(pokemon.nfe, false),
            inArray(pokemon.formType, TEAM_SLOT_FORM_TYPES)
          )
        );
    }

    const rpData = pkIds.map((p) => ({ regulationId: reg.id, pokemonId: p.id }));

    // 既存レコードを削除してから再挿入
    await db.delete(regulationPokemon).where(eq(regulationPokemon.regulationId, reg.id));
    await batchInsert(`  ${def.name}`, rpData, (batch) =>
      db.insert(regulationPokemon).values(batch).onConflictDoNothing()
    );
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

  // CSVのslug→name_enマップを構築
  const pkCsv = parseCsv(resolve(EXPORT_DIR, 'pokemon.csv'));
  const pkSlugToName = new Map(pkCsv.map((r) => [r.slug, r.name_en]));
  const mvCsv = parseCsv(resolve(EXPORT_DIR, 'moves.csv'));
  const mvSlugToName = new Map(mvCsv.map((r) => [r.slug, r.name_en]));

  // pokemon.name → pokemon.id マッピング
  const pkRows = await db.select({ id: pokemon.id, name: pokemon.name }).from(pokemon);
  const pokemonIdMap = new Map(pkRows.map((p) => [p.name, p.id]));

  // moves.name → moves.id マッピング
  const mvRows = await db.select({ id: moves.id, name: moves.name }).from(moves);
  const moveIdMap = new Map(mvRows.map((m) => [m.name, m.id]));

  type LearnMethod = (typeof learnsets.$inferInsert)['method'];

  const data: (typeof learnsets.$inferInsert)[] = [];
  let skipped = 0;

  for (const r of rows) {
    // slug → name_en → DB id の2段階解決
    const pkName = pkSlugToName.get(r.pokemon_slug);
    const mvName = mvSlugToName.get(r.move_slug);
    const pokemonId = pkName ? pokemonIdMap.get(pkName) : undefined;
    const moveId = mvName ? moveIdMap.get(mvName) : undefined;

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
    console.log(`  スキップ（名前不一致）: ${skipped}件`);
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
