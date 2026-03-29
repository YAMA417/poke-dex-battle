import {
  AnyPgColumn,
  bigint,
  bigserial,
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  unique,
} from 'drizzle-orm/pg-core';

// Enum定義
export const pokemonTypeEnum = pgEnum('pokemon_type', [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
]);

export const learnMethodEnum = pgEnum('learn_method', ['level-up', 'machine', 'egg']);

export const pokemonCategoryEnum = pgEnum('pokemon_category', [
  'normal',
  'sub_legendary',
  'restricted',
  'mythical',
]);

export const formTypeEnum = pgEnum('form_type', [
  'base',
  'mega',
  'primal',
  'tera',
  'variant',
  'battle_only',
]);

// レギュレーション（gamesテーブルを廃止・統合）
export const regulations = pgTable('regulations', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  battleSystems: text('battle_systems').array().notNull().default([]),
  restrictedCount: integer('restricted_count').notNull().default(0),
  mythicalAllowed: boolean('mythical_allowed').notNull().default(false),
  fromDate: date('from_date'),
  toDate: date('to_date'),
  isDefault: boolean('is_default').notNull().default(false),
});

// 特性マスターデータ（pokemonが参照するため先に定義）
export const abilities = pgTable('abilities', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  slug: text('slug').notNull().unique(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  shortDesc: text('short_desc'),
  shortDescJa: text('short_desc_ja'),
});

// アイテムマスターデータ
export const items = pgTable('items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  slug: text('slug').notNull().unique(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  shortDesc: text('short_desc'),
  shortDescJa: text('short_desc_ja'),
  isCompetitive: boolean('is_competitive').notNull().default(false),
});

// ポケモンマスターデータ
export const pokemon = pgTable('pokemon', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  slug: text('slug').notNull().unique(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  types: pokemonTypeEnum('types').array().notNull(),
  hp: integer('hp').notNull(),
  atk: integer('atk').notNull(),
  def: integer('def').notNull(),
  spa: integer('spa').notNull(),
  spd: integer('spd').notNull(),
  spe: integer('spe').notNull(),
  ability0Id: bigint('ability_0_id', { mode: 'number' })
    .notNull()
    .references(() => abilities.id),
  ability1Id: bigint('ability_1_id', { mode: 'number' }).references(() => abilities.id),
  abilityHId: bigint('ability_h_id', { mode: 'number' }).references(() => abilities.id),
  weightkg: real('weight_kg').notNull(),
  heightm: real('height_m').notNull(),
  category: pokemonCategoryEnum('category').notNull().default('normal'),
  spriteUrl: text('sprite_url'),
  fixedItem: text('fixed_item'),
  fixedTeraType: pokemonTypeEnum('fixed_tera_type'),
  genderRate: integer('gender_rate'),
  formType: formTypeEnum('form_type').notNull().default('base'),
  baseFormId: bigint('base_form_id', { mode: 'number' }).references((): AnyPgColumn => pokemon.id),
});

// 技マスターデータ
export const moves = pgTable('moves', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  slug: text('slug').notNull().unique(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  type: pokemonTypeEnum('type').notNull(),
  category: text('category').notNull(),
  power: integer('power'),
  accuracy: integer('accuracy'),
  pp: integer('pp').notNull(),
  priority: integer('priority').notNull().default(0),
  target: text('target').notNull(),
  shortDesc: text('short_desc'),
  shortDescJa: text('short_desc_ja'),
});

// 覚える技
export const learnsets = pgTable(
  'learnsets',
  {
    pokemonId: bigint('pokemon_id', { mode: 'number' })
      .notNull()
      .references(() => pokemon.id),
    moveId: bigint('move_id', { mode: 'number' })
      .notNull()
      .references(() => moves.id),
    method: learnMethodEnum('method').notNull(),
    level: integer('level').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.pokemonId, table.moveId, table.method] })]
);

// レギュレーション別使用可否
export const regulationPokemon = pgTable(
  'regulation_pokemon',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    regulationId: bigint('regulation_id', { mode: 'number' })
      .notNull()
      .references(() => regulations.id),
    pokemonId: bigint('pokemon_id', { mode: 'number' })
      .notNull()
      .references(() => pokemon.id),
  },
  (table) => [unique().on(table.regulationId, table.pokemonId)]
);
