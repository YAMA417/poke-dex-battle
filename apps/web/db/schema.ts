import { integer, pgTable, real, text } from 'drizzle-orm/pg-core';

export const species = pgTable('species', {
  id: text('id').primaryKey(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  types: text('types').array().notNull(),
  hp: integer('hp').notNull(),
  atk: integer('atk').notNull(),
  def: integer('def').notNull(),
  spa: integer('spa').notNull(),
  spd: integer('spd').notNull(),
  spe: integer('spe').notNull(),
  ability0: text('ability_0').notNull(),
  ability1: text('ability_1'),
  abilityH: text('ability_h'),
  abilityS: text('ability_s'),
  weightkg: real('weight_kg').notNull(),
  heightm: real('height_m').notNull(),
});

export const moves = pgTable('moves', {
  id: text('id').primaryKey(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  basePower: integer('base_power').notNull(),
  accuracy: integer('accuracy'),
  pp: integer('pp').notNull(),
  priority: integer('priority').notNull().default(0),
  target: text('target').notNull(),
  shortDesc: text('short_desc'),
});

export const abilities = pgTable('abilities', {
  id: text('id').primaryKey(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  shortDesc: text('short_desc'),
});

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  num: integer('num').notNull(),
  name: text('name').notNull(),
  nameJa: text('name_ja').notNull(),
  desc: text('desc'),
  shortDesc: text('short_desc'),
});

export const learnsets = pgTable('learnsets', {
  speciesId: text('species_id')
    .primaryKey()
    .references(() => species.id),
  level: text('level').array().notNull(),
  machine: text('machine').array().notNull(),
});
