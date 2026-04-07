-- Row Level Security (RLS) を全テーブルに適用
-- アプリは読み取り専用のため、anon ロールには SELECT のみ許可
-- service_role（シード・マイグレーション用）は全操作を許可
--
-- 実行方法:
--   psql $DATABASE_URL -f packages/db/sql/enable-rls.sql

BEGIN;

-- ========================================
-- 1. 全テーブルで RLS を有効化
-- ========================================
ALTER TABLE "regulations"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "abilities"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "items"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pokemon"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "moves"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learnsets"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "regulation_pokemon" ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. anon ロール: SELECT のみ許可
-- ========================================
CREATE POLICY "anon_select_regulations"        ON "regulations"        FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_abilities"          ON "abilities"          FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_items"              ON "items"              FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_pokemon"            ON "pokemon"            FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_moves"              ON "moves"              FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_learnsets"          ON "learnsets"          FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_regulation_pokemon" ON "regulation_pokemon" FOR SELECT TO anon USING (true);

-- ========================================
-- 3. authenticated ロール: SELECT のみ許可（将来のユーザー機能に備えて）
-- ========================================
CREATE POLICY "authenticated_select_regulations"        ON "regulations"        FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select_abilities"          ON "abilities"          FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select_items"              ON "items"              FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select_pokemon"            ON "pokemon"            FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select_moves"              ON "moves"              FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select_learnsets"          ON "learnsets"          FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select_regulation_pokemon" ON "regulation_pokemon" FOR SELECT TO authenticated USING (true);

-- ========================================
-- 4. service_role: 全操作許可（シード・管理用）
--    ※ service_role は bypassrls 権限を持つため本来ポリシー不要だが、
--      明示的に定義して意図を明確にする
-- ========================================
CREATE POLICY "service_all_regulations"        ON "regulations"        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_abilities"          ON "abilities"          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_items"              ON "items"              FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_pokemon"            ON "pokemon"            FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_moves"              ON "moves"              FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_learnsets"          ON "learnsets"          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_regulation_pokemon" ON "regulation_pokemon" FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
