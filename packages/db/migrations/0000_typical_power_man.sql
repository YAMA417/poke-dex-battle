CREATE TYPE "public"."learn_method" AS ENUM('level-up', 'machine', 'egg');--> statement-breakpoint
CREATE TYPE "public"."pokemon_category" AS ENUM('normal', 'sub_legendary', 'restricted', 'mythical', 'mega');--> statement-breakpoint
CREATE TYPE "public"."pokemon_type" AS ENUM('Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy');--> statement-breakpoint
CREATE TABLE "abilities" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"num" integer NOT NULL,
	"name" text NOT NULL,
	"name_ja" text NOT NULL,
	"short_desc" text,
	"short_desc_ja" text,
	CONSTRAINT "abilities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"num" integer NOT NULL,
	"name" text NOT NULL,
	"name_ja" text NOT NULL,
	"short_desc" text,
	"short_desc_ja" text,
	"is_competitive" boolean DEFAULT false NOT NULL,
	CONSTRAINT "items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "learnsets" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"pokemon_id" bigint NOT NULL,
	"move_id" bigint NOT NULL,
	"method" "learn_method" NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "learnsets_pokemon_id_move_id_method_unique" UNIQUE("pokemon_id","move_id","method")
);
--> statement-breakpoint
CREATE TABLE "moves" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"num" integer NOT NULL,
	"name" text NOT NULL,
	"name_ja" text NOT NULL,
	"type" "pokemon_type" NOT NULL,
	"category" text NOT NULL,
	"power" integer,
	"accuracy" integer,
	"pp" integer NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"target" text NOT NULL,
	"short_desc" text,
	"short_desc_ja" text,
	CONSTRAINT "moves_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pokemon" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"num" integer NOT NULL,
	"name" text NOT NULL,
	"name_ja" text NOT NULL,
	"types" "pokemon_type"[] NOT NULL,
	"hp" integer NOT NULL,
	"atk" integer NOT NULL,
	"def" integer NOT NULL,
	"spa" integer NOT NULL,
	"spd" integer NOT NULL,
	"spe" integer NOT NULL,
	"ability_0_id" bigint NOT NULL,
	"ability_1_id" bigint,
	"ability_h_id" bigint,
	"weight_kg" real NOT NULL,
	"height_m" real NOT NULL,
	"category" "pokemon_category" DEFAULT 'normal' NOT NULL,
	"sprite_url" text,
	"fixed_item" text,
	"fixed_tera_type" "pokemon_type",
	"gender_rate" integer,
	CONSTRAINT "pokemon_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "regulation_pokemon" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"regulation_id" bigint NOT NULL,
	"pokemon_id" bigint NOT NULL,
	CONSTRAINT "regulation_pokemon_regulation_id_pokemon_id_unique" UNIQUE("regulation_id","pokemon_id")
);
--> statement-breakpoint
CREATE TABLE "regulations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"battle_systems" text[] DEFAULT '{}' NOT NULL,
	"restricted_count" integer DEFAULT 0 NOT NULL,
	"mythical_allowed" boolean DEFAULT false NOT NULL,
	"from_date" integer,
	"to_date" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "regulations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "learnsets" ADD CONSTRAINT "learnsets_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnsets" ADD CONSTRAINT "learnsets_move_id_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."moves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_ability_0_id_abilities_id_fk" FOREIGN KEY ("ability_0_id") REFERENCES "public"."abilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_ability_1_id_abilities_id_fk" FOREIGN KEY ("ability_1_id") REFERENCES "public"."abilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_ability_h_id_abilities_id_fk" FOREIGN KEY ("ability_h_id") REFERENCES "public"."abilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_pokemon" ADD CONSTRAINT "regulation_pokemon_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_pokemon" ADD CONSTRAINT "regulation_pokemon_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE no action ON UPDATE no action;