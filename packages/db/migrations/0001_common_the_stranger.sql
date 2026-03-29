CREATE TYPE "public"."form_type" AS ENUM('base', 'mega', 'primal', 'tera', 'variant', 'battle_only');--> statement-breakpoint
ALTER TABLE "learnsets" DROP CONSTRAINT "learnsets_pokemon_id_move_id_method_unique";--> statement-breakpoint
ALTER TABLE "pokemon" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pokemon" ALTER COLUMN "category" SET DEFAULT 'normal'::text;--> statement-breakpoint
DROP TYPE "public"."pokemon_category";--> statement-breakpoint
CREATE TYPE "public"."pokemon_category" AS ENUM('normal', 'sub_legendary', 'restricted', 'mythical');--> statement-breakpoint
ALTER TABLE "pokemon" ALTER COLUMN "category" SET DEFAULT 'normal'::"public"."pokemon_category";--> statement-breakpoint
ALTER TABLE "pokemon" ALTER COLUMN "category" SET DATA TYPE "public"."pokemon_category" USING "category"::"public"."pokemon_category";--> statement-breakpoint
ALTER TABLE "regulations" ALTER COLUMN "from_date" SET DATA TYPE date USING NULL::date;--> statement-breakpoint
ALTER TABLE "regulations" ALTER COLUMN "to_date" SET DATA TYPE date USING NULL::date;--> statement-breakpoint
ALTER TABLE "learnsets" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "learnsets" ADD CONSTRAINT "learnsets_pokemon_id_move_id_method_pk" PRIMARY KEY("pokemon_id","move_id","method");--> statement-breakpoint
ALTER TABLE "pokemon" ADD COLUMN "form_type" "form_type" DEFAULT 'base' NOT NULL;--> statement-breakpoint
ALTER TABLE "pokemon" ADD COLUMN "base_form_id" bigint;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_base_form_id_pokemon_id_fk" FOREIGN KEY ("base_form_id") REFERENCES "public"."pokemon"("id") ON DELETE no action ON UPDATE no action;