import { boolean, integer, pgEnum, pgTable, primaryKey, real, text } from 'drizzle-orm/pg-core';

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

// ゲームタイトル
export const games = pgTable('games', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  battleSystems: text('battle_systems').array().notNull(),
});

// レギュレーション
export const regulations = pgTable('regulations', {
  id: text('id').primaryKey(),
  gameId: text('game_id')
    .notNull()
    .references(() => games.id),
  name: text('name').notNull(),
  restrictedCount: integer('restricted_count').notNull().default(0),
  mythicalAllowed: boolean('mythical_allowed').notNull().default(false),
});

// ポケモンマスターデータ
export const pokemon = pgTable('pokemon', {
  id: text('id').primaryKey(),
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
  ability0: text('ability_0').notNull(),
  ability1: text('ability_1'),
  abilityH: text('ability_h'),
  weightkg: real('weight_kg').notNull(),
  heightm: real('height_m').notNull(),
  category: pokemonCategoryEnum('category').notNull().default('normal'),
  spriteUrl: text('sprite_url'),
  fixedItem: text('fixed_item'),
  fixedTeraType: pokemonTypeEnum('fixed_tera_type'),
});

// レギュレーション別使用可否
export const regulationPokemon = pgTable(
  'regulation_pokemon',
  {
    regulationId: text('regulation_id')
      .notNull()
      .references(() => regulations.id),
    pokemonId: text('pokemon_id')
      .notNull()
      .references(() => pokemon.id),
  },
  (table) => [primaryKey({ columns: [table.regulationId, table.pokemonId] })]
);

// 技マスターデータ
export const moves = pgTable('moves', {
  id: text('id').primaryKey(),
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
});

// 特性マスターデータ
export const abilities = pgTable('abilities', {
  id: text('id').primaryKey(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  shortDesc: text('short_desc'),
});

// アイテムマスターデータ
export const items = pgTable('items', {
  id: text('id').primaryKey(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  shortDesc: text('short_desc'),
  isCompetitive: boolean('is_competitive').notNull().default(false),
});

// 覚える技
export const learnsets = pgTable(
  'learnsets',
  {
    pokemonId: text('pokemon_id')
      .notNull()
      .references(() => pokemon.id),
    moveId: text('move_id')
      .notNull()
      .references(() => moves.id),
    method: learnMethodEnum('method').notNull(),
    level: integer('level').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.pokemonId, table.moveId, table.method] })]
);
