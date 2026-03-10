# poke-dex-battle 3月末開発計画

## Context

poke-dex-battleは、ポケモンダブルバトルの支援アプリ（Next.js 16 + App Router モノレポ）。
ダメージ計算機能（Phase 1-1）は完成済みで、以下3つを3月末までに実施する。

**チーム体制**: 2名（@YAMA417 + @ronarin）。@YAMA417のみClaude使用可。
**締切**: 3/29（土）までに実装完了 → 3/30-31でテスト・リリース
**稼働制約**: 平日はあまり時間が取れない（主に土日で進める想定）
**現状**: パーティ構築機能は `feat/party-register-ui` ブランチで約50%完成（編集ページが途中、未コミット分含む）

---

## スコープ判断

### 3月スコープ内
- ① UIの統一・トップページ修正
- ② パーティ構築機能（localStorage永続化 + マスターデータDB化）
- ③ CI/CD セットアップ + 初回デプロイ

### 3月スコープ外（明示的に除外）
- Phase 1-3 対戦履歴管理（全タスク未着手のため後回し）
- 計算履歴保存（IndexedDB）
- テラスタルタイプ対応

---

## 方針決定事項

### データ永続化
- **ポケモンマスターデータ**（種族値・技・特性等）: Supabase/Neon（クラウドDB）に格納。@YAMA417が対応。
- **パーティデータ**: localStorage（Phase 2でサーバーDB移行時はフック内部の差し替えのみ）

### ブランチ運用
- ①②は `feat/party-register-ui` マージ後に main から各ブランチを切る
- ③完了後は `main → develop → feature/*` のフローに移行

---

## ① UIの統一・トップページ修正

### 1-1. ヘッダーにナビゲーション追加

**修正:** `apps/web/app/layout.tsx`
**新規:** `apps/web/components/layout/Header.tsx`

- `<header>` 内に `/calc`, `/parties` へのナビゲーションリンクを追加
- `usePathname()` でアクティブルートをハイライト
- モバイルはハンバーガーメニュー（shadcn/ui `Sheet` を利用）
- `LanguageToggle` はヘッダー内に残す

### 1-2. トップページの改善

**修正:** `apps/web/app/page.tsx`

- 機能カードを `Button asChild` → shadcn/ui `<Card>` ベースに変更
- ガブリアス実数値計算のサンプルセクションを削除（開発確認用で不要）
- レスポンシブグリッド調整

### 1-3. 共通コンポーネントの整理

**移動:** `apps/web/components/damage-calc/SharedFormComponents.tsx` → `apps/web/components/shared/PokemonFormComponents.tsx`

- `TypeBadges`, `EvPreset`, `NatureModifierCompact` をパーティ画面でも再利用するため共通ディレクトリへ
- `AttackerInput.tsx`, `DefenderInput.tsx` の import パスを更新

---

## ② パーティ構築機能

### 2-1. パーティ永続化フック

**新規:** `apps/web/hooks/useParty.ts`

- localStorage CRUD（`LanguageContext.tsx` と同じパターン）
- SSR対策: `useEffect` 内でのみ localStorage を読む
- `Party.createdAt/updatedAt` は ISO文字列で保存、読み取り時に Date へ復元

```typescript
interface UsePartyReturn {
  parties: Party[];
  isLoading: boolean;
  createParty(input: CreatePartyInput): Party;
  updateParty(id: string, input: UpdatePartyInput): void;
  deleteParty(id: string): void;
  addPokemonToParty(partyId: string, pokemon: Pokemon): void;
  removePokemonFromParty(partyId: string, pokemonId: string): void;
  updatePokemonInParty(partyId: string, pokemon: Pokemon): void;
}
```

### 2-2. PartyContext

**新規:** `apps/web/contexts/PartyContext.tsx`
**修正:** `apps/web/app/layout.tsx`（`<PartyProvider>` 追加）

- `/calc` 画面からもパーティデータにアクセスするため Context で提供

### 2-3. パーティ一覧ページ

**修正:** `apps/web/app/parties/page.tsx`（プレースホルダー → 本実装）
**新規:**
- `apps/web/components/party/PartyList.tsx`
- `apps/web/components/party/PartyCard.tsx`
- `apps/web/components/party/CreatePartyDialog.tsx`（shadcn `Dialog`）

### 2-4. パーティ編集ページ

**新規:**
- `apps/web/app/parties/[id]/page.tsx`
- `apps/web/components/party/PartyEditor.tsx` — パーティ基本情報 + 6枠スロット
- `apps/web/components/party/PokemonSlot.tsx` — 空=追加ボタン / 埋=カード表示
- `apps/web/components/party/PokemonEditor.tsx` — ポケモン詳細入力

PokemonEditor の入力項目（既存 `Pokemon` 型に準拠）:
- ポケモン選択（既存 `Autocomplete` 流用）
- 性格・特性・持ち物
- IV/EV（`EvPreset` 流用 + 数値入力、合計510バリデーション）
- 技4つ（`MoveInput` パターン流用）
- ※テラスタルタイプは今回対象外

### 2-5. ダメージ計算との連携

**修正:** `apps/web/components/damage-calc/DamageCalculator.tsx`
**新規:** `apps/web/components/damage-calc/PartyPokemonSelector.tsx`

- `AttackerInput` / `DefenderInput` 上部に「パーティから読み込み」ボタン
- 選択時に `Pokemon` 型 → `AttackerData` / `DefenderData` 型に変換して注入

### 2-6. Export/Import 機能

- パーティデータをJSON形式でエクスポート/インポート
- ファイルダウンロード/アップロードで実現

### 2-7. ポケモンマスターデータのDB化（@YAMA417担当）

**目標**: ビルド時にPokemon Showdownからデータ抽出 → クラウドDB（Supabase/Neon）に格納 → アプリはDB経由でデータ参照

**ステップ:**

1. **Supabase/Neon プロジェクト作成 + 接続設定**
   - `.env` に `DATABASE_URL` を設定

2. **Prisma セットアップ + スキーマ定義**
   - `backend/api/` に Prisma を導入
   - テーブル: `species`, `moves`, `abilities`, `items`, `learnsets`
   - 既存の型定義（`packages/shared/src/types/showdown.ts`, `pokemon-data.ts`）を参考にスキーマ設計

3. **シードスクリプト**
   - 既存の `scripts/extract-showdown-data.ts` の出力JSONをDBに投入
   - `npx prisma db seed` で実行可能に

4. **Hono API エンドポイント実装**
   - `backend/api/src/routes/` に既存スタブがあるので、Prismaクエリに差し替え
   - `GET /api/pokemon?name=xxx` — ポケモン検索
   - `GET /api/moves?name=xxx` — 技検索
   - `GET /api/abilities?name=xxx` — 特性検索
   - `GET /api/items?name=xxx` — アイテム検索

5. **フロントエンドのサービス層改修**
   - `packages/shared/src/services/pokemon-service.ts` 等を同期→非同期に変更
   - または、`apps/web` 側に API クライアント層を新設し、既存の shared サービスは維持
   - カスタムフック（`usePokemonSearch` 等）を API 呼び出しに対応
   - ローディング状態の追加

**注意点:**
- 既存のダメージ計算画面のポケモン検索UIにも影響する（同期→非同期化）
- スプライトURLは引き続き GitHub の外部URLを参照（DBには入れない）

---

## ③ CI/CD セットアップ

### 3-1. Vercel 初回デプロイ

- Vercel プロジェクト作成 + GitHub連携
- Root Directory: `apps/web`、Build Command: `cd ../.. && npm run build`
- 動作確認

### 3-2. ブランチ戦略の構築

```
main (本番) ← develop からのPRのみ
  └── develop (開発統合) ← feature/* からのPR
        └── feature/* (機能開発)
```

### 3-3. CI ワークフロー

**新規:** `.github/workflows/ci.yml`

- トリガー: `pull_request` to `develop` or `main`
- ジョブ: lint → typecheck（shared + web）→ test（shared）
- Node.js 24.x
- `apps/web/package.json` に `"typecheck": "tsc --noEmit"` を追加

### 3-4. Branch Protection Rules

- `main`, `develop` に Required Status Checks 設定
- CI成功をマージ条件に

---

## 担当割り振り

**方針**: @ronarin = UI系、@YAMA417 = データ・ロジック層 + CI/CD

| タスク | 担当 | 備考 |
|--------|------|------|
| ①-1 ヘッダーナビゲーション | @ronarin | Header.tsx 作成、レスポンシブ対応 |
| ①-2 トップページ改善 | @ronarin | Card ベースに変更、レイアウト修正 |
| ①-3 共通コンポーネント整理 | @ronarin | SharedFormComponents 移動 |
| ②-1 useParty フック | @YAMA417 | localStorage CRUD ロジック |
| ②-2 PartyContext | @YAMA417 | Context 作成 + layout.tsx 統合 |
| ②-3 パーティ一覧ページ UI | @ronarin | PartyList, PartyCard, CreatePartyDialog |
| ②-4 パーティ編集ページ UI | @ronarin | PartyEditor, PokemonSlot, PokemonEditor |
| ②-5 ダメージ計算連携 | @YAMA417 | Pokemon→AttackerData/DefenderData 型変換 + PartyPokemonSelector |
| ②-6 Export/Import | @YAMA417 | JSON エクスポート/インポートロジック |
| ②-7 マスターデータDB化 | @YAMA417 | Supabase/Neon + Prisma + Hono API + フロントエンド改修 |
| ③ CI/CD | @YAMA417 | Vercel + GitHub Actions + ブランチ保護 |

---

## スケジュール（土日メイン）

実稼働日: 土日 = 8日間（3/1,2,8,9,15,16,22,23） + 平日は軽作業のみ
パーティ構築機能は約50%完成済み（編集ページ途中）のため、残り作業を前提にスケジュールを組む。

| 期間 | @ronarin（UI系） | @YAMA417（データ・ロジック + CI/CD） |
|------|-----------------|--------------------------------------|
| Week 1 (3/1-2) | ①-1,①-2 ヘッダーナビ + トップページ改善 | ②-1 usePartyフック + ②-2 PartyContext |
| Week 2 (3/8-9) | ①-3 共通コンポーネント整理 + ②-3 一覧ページUI | ②-7 マスターデータDB化（Supabase + Prisma + シード） |
| Week 3 (3/15-16) | ②-4 パーティ編集ページUI（残り部分） | ②-7 続き（Hono API + フロントエンド改修）+ ②-5 ダメージ計算連携 |
| Week 4 (3/22-23) | UI仕上げ・レスポンシブ調整 | ②-6 Export/Import + ③ Vercel デプロイ + CI/CD構築 |
| 平日 (3/24-28) | - | ③ GitHub Actions + Branch Protection |
| 3/29(土) | 実装凍結・バグ修正 | 実装凍結・バグ修正 |
| 3/30(日)-3/31(月) | 統合テスト・リリース | 統合テスト・リリース |

### 並行作業のポイント

- Week 1: @YAMA417がフック・Contextを先に作り、@ronarinのUI実装がそれを使える状態にする
- Week 2: @YAMA417がDB化の基盤（Supabase + Prisma + シード）を構築。@ronarinは共通コンポーネント整理 + 一覧UI
- Week 3: @YAMA417がAPI実装 + フロントエンド改修。ダメージ計算のポケモン検索が非同期に変わるため、@ronarinの②-4とは依存関係に注意
- Week 4: @ronarinのUI仕上げと@YAMA417のExport/Import + CI/CDが独立して進行

### リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| ②-7 フロントエンド同期→非同期改修が広範囲 | 既存ダメージ計算にも影響 | @YAMA417がClaude活用で集中対応。既存フックのインターフェースは極力維持 |
| ②-4 PokemonEditor の残り実装が複雑 | スケジュール遅延 | @YAMA417がClaudeでスケルトンを先行作成 |
| ②-5 型変換（Pokemon→AttackerData）が難航 | 連携機能が間に合わない | 最悪、連携は後回しにしてパーティ単体で完成させる |
| ③ Vercelモノレポ設定がはまる | デプロイ遅延 | Week 3 の平日に先行調査 |

### 最低限のリリース基準（間に合わない場合の優先度）

1. **必須**: ① UI統一 + ② パーティCRUD（一覧・作成・編集・削除） + ③ デプロイ
2. **重要**: ②-7 マスターデータDB化 + ②-5 ダメージ計算連携
3. **あれば良い**: ②-6 Export/Import + ③ CI自動化

---

## 主要参照ファイル

| ファイル | 用途 |
|---------|------|
| `apps/web/app/layout.tsx` | ナビゲーション追加・PartyProvider追加の起点 |
| `apps/web/contexts/LanguageContext.tsx` | useParty/PartyContext の実装パターン参照 |
| `apps/web/components/damage-calc/AttackerInput.tsx` | PokemonEditor で流用する最重要参照 |
| `apps/web/components/damage-calc/SharedFormComponents.tsx` | 共通化対象コンポーネント |
| `packages/shared/src/types/party.ts` | Party/CreatePartyInput/UpdatePartyInput 型定義 |
| `packages/shared/src/types/pokemon.ts` | Pokemon/Stats/Nature/Move 型定義 |
| `packages/shared/src/utils/stat-calc.ts` | 実数値計算（連携時に使用） |

---

## テスト計画（3/30-31）

### 機能テスト
1. **UI統一**: 各ページ巡回、ヘッダーナビの動作・アクティブ表示・レスポンシブ確認
2. **パーティCRUD**: 作成→ポケモン追加→編集→削除の一連フロー
3. **データ永続化**: ブラウザリロード後もパーティデータが維持されることを確認
4. **ダメージ計算連携**: パーティ登録済みポケモンをダメージ計算に読み込み、ステータス反映確認
5. **Export/Import**: JSON出力→別ブラウザで読み込み→データ復元確認
6. **DB化**: ポケモン・技・特性・アイテムの検索がDB経由で正常に動作することを確認

### デプロイ確認
7. **Vercel本番**: 本番URLでの動作確認（主要ブラウザ: Chrome, Safari, Firefox）
8. **CI/CD**: feature → develop PR で CI 実行、テスト・lint・型チェック通過確認

### リリース手順
1. develop → main へPR作成
2. CI通過確認
3. マージ → 本番自動デプロイ
4. 本番URLで最終動作確認
