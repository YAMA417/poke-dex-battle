import 'dotenv/config';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { species, moves, abilities, items, learnsets } from './schema';
import { sql } from 'drizzle-orm';

// .env.local からDB接続情報を読み込み
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL が設定されていません');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

// JSONデータの読み込み（__dirnameからの相対パス）
const dataDir = resolve(__dirname, '../../../packages/shared/src/data/showdown');
const speciesData = require(resolve(dataDir, 'species.json'));
const movesData = require(resolve(dataDir, 'moves.json'));
const abilitiesData = require(resolve(dataDir, 'abilities.json'));
const itemsData = require(resolve(dataDir, 'items.json'));
const learnsetsData = require(resolve(dataDir, 'learnsets.json'));

async function seed() {
  console.log('シード開始...');

  // 全テーブル削除（外部キー制約の順序に注意）
  await db.delete(learnsets);
  await db.delete(species);
  await db.delete(moves);
  await db.delete(abilities);
  await db.delete(items);
  console.log('既存データ削除完了');

  // Species
  const speciesRows = Object.values(speciesData).map((s: any) => ({
    id: s.id,
    num: s.num,
    name: s.name,
    nameJa: s.nameJa,
    types: s.types,
    hp: s.baseStats.hp,
    atk: s.baseStats.atk,
    def: s.baseStats.def,
    spa: s.baseStats.spa,
    spd: s.baseStats.spd,
    spe: s.baseStats.spe,
    ability0: s.abilities['0'],
    ability1: s.abilities['1'] ?? null,
    abilityH: s.abilities['H'] ?? null,
    abilityS: s.abilities['S'] ?? null,
    weightkg: s.weightkg,
    heightm: s.heightm,
  }));
  await db.insert(species).values(speciesRows);
  console.log(`Species: ${speciesRows.length}件`);

  // Moves
  const moveRows = Object.values(movesData).map((m: any) => ({
    id: m.id,
    num: m.num,
    name: m.name,
    nameJa: m.nameJa,
    type: m.type,
    category: m.category,
    basePower: m.basePower,
    accuracy: typeof m.accuracy === 'number' ? m.accuracy : null,
    pp: m.pp,
    priority: m.priority,
    target: m.target,
    shortDesc: m.shortDesc ?? null,
  }));
  await db.insert(moves).values(moveRows);
  console.log(`Moves: ${moveRows.length}件`);

  // Abilities
  const abilityRows = Object.values(abilitiesData).map((a: any) => ({
    id: a.id,
    num: a.num,
    name: a.name,
    nameJa: a.nameJa,
    shortDesc: a.shortDesc ?? null,
  }));
  await db.insert(abilities).values(abilityRows);
  console.log(`Abilities: ${abilityRows.length}件`);

  // Items
  const itemRows = Object.values(itemsData).map((i: any) => ({
    id: i.id,
    num: i.num,
    name: i.name,
    nameJa: i.nameJa,
    desc: i.desc ?? null,
    shortDesc: i.shortDesc ?? null,
  }));
  await db.insert(items).values(itemRows);
  console.log(`Items: ${itemRows.length}件`);

  // Learnsets
  const learnsetRows = Object.entries(learnsetsData).map(
    ([speciesId, data]: [string, any]) => ({
      speciesId,
      level: data.level ?? [],
      machine: data.machine ?? [],
    })
  );
  // speciesテーブルに存在するIDのみ投入（外部キー制約）
  const speciesIds = new Set(speciesRows.map((s) => s.id));
  const validLearnsetRows = learnsetRows.filter((l) =>
    speciesIds.has(l.speciesId)
  );
  await db.insert(learnsets).values(validLearnsetRows);
  console.log(
    `Learnsets: ${validLearnsetRows.length}件 (スキップ: ${learnsetRows.length - validLearnsetRows.length}件)`
  );

  console.log('シード完了');
  await client.end();
}

seed().catch((e) => {
  console.error('シード失敗:', e);
  process.exit(1);
});
