# 開発ガイドライン

## ブランチ命名規則

ブランチ名は以下の形式で作成します：

```
<type>/<description>
```

### タイプ一覧

| タイプ      | 説明                               | 例                             |
| ----------- | ---------------------------------- | ------------------------------ |
| `feat/`     | 新機能の追加                       | `feat/pokeapi-data-fetch`      |
| `fix/`      | バグ修正                           | `fix/damage-calculation-error` |
| `refactor/` | リファクタリング                   | `refactor/stat-calculation`    |
| `docs/`     | ドキュメントの追加・修正           | `docs/api-documentation`       |
| `chore/`    | 雑務（依存関係更新、設定変更など） | `chore/update-dependencies`    |
| `test/`     | テストの追加・修正                 | `test/add-damage-calc-tests`   |
| `perf/`     | パフォーマンス改善                 | `perf/optimize-pokemon-search` |

### 命名のポイント

- `<description>`は英語の小文字で記述
- 単語の区切りはハイフン（`-`）を使用
- 簡潔でわかりやすい名前を付ける

### 例

```bash
# 良い例
git checkout -b feat/pokemon-selection-ui
git checkout -b fix/ev-validation
git checkout -b refactor/damage-calculator

# 悪い例
git checkout -b newFeature          # タイプが不明
git checkout -b feat/new_feature    # アンダースコアは使わない
git checkout -b 機能追加             # 日本語は使わない
```

---

## コミットメッセージ規則

Conventional Commits形式に従います：

```
<type>: <subject>

[optional body]

[optional footer]
```

### タイプ一覧

ブランチ名と同じタイプを使用します：

- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `docs`: ドキュメント
- `chore`: 雑務
- `test`: テスト
- `perf`: パフォーマンス改善
- `style`: コードスタイルの修正（機能に影響しない）
- `ci`: CI/CD設定の変更

### コミットメッセージの例

```bash
# 良い例
git commit -m "feat: PokéAPIからポケモンデータを取得する機能を追加"
git commit -m "fix: ダメージ計算で特性補正が適用されない問題を修正"
git commit -m "refactor: ステータス計算ロジックを共通化"

# 詳細な説明が必要な場合
git commit -m "feat: IndexedDBによるキャッシュ機能を実装

- Dexie.jsを使用してポケモンデータをキャッシュ
- キャッシュ有効期限を7日間に設定
- オフライン時にキャッシュから読み込み"
```

### コミットメッセージのポイント

- 件名（subject）は日本語で簡潔に記述
- 件名の最初は動詞で始める（「追加」「修正」「削除」など）
- 件名の最後にピリオド（`.`）は付けない
- 詳細が必要な場合は空行を入れてbodyに記述

---

## Pull Request作成ガイドライン

### PRタイトル

コミットメッセージと同じ形式で記述：

```
feat: PokéAPIからデータ取得・キャッシュ機能
```

### PR説明文テンプレート

```markdown
## 概要

<!-- この変更の目的と背景を簡潔に説明 -->

## 変更内容

## <!-- 主な変更点を箇条書きで -->

-
-

## テスト方法

<!-- レビュアーが動作確認する手順 -->

1.
2.
3.

## スクリーンショット（任意）

<!-- UIに変更がある場合は画像を添付 -->

## チェックリスト

- [ ] 動作確認済み
- [ ] コードレビュー準備完了
- [ ] ドキュメント更新（必要な場合）
- [ ] テストコード追加（必要な場合）
```

---

## 開発フロー

### 1. ブランチを切る

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature
```

### 2. 開発・コミット

```bash
# 開発作業...
git add .
git commit -m "feat: 機能の説明"
```

### 3. プッシュ

```bash
git push origin feat/your-feature
```

### 4. Pull Request作成

- GitHubでPRを作成
- 上記のテンプレートに従って説明を記述
- レビュアーをアサイン（チーム開発の場合）

### 5. レビュー・マージ

- レビューのフィードバックに対応
- 承認後、mainブランチにマージ

---

## ローカル開発環境

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（全体）
npm run dev

# 個別起動
npm run dev:frontend  # フロントエンドのみ
npm run dev:backend   # バックエンドのみ
npm run dev:shared    # 共通パッケージのみ（ウォッチモード）
```

### ビルド

```bash
# 全体ビルド
npm run build

# 個別ビルド
npm run build:shared
npm run build:web
```

### リント・型チェック

```bash
# リント
npm run lint

# 型チェック（shared）
npm run typecheck -w @poke-dex-battle/shared
```

---

## データベース

マスターデータは PostgreSQL（Supabase）で管理。ORM は Drizzle を使用。

### アーキテクチャ

```
PokeAPI（外部）→ seed.ts → PostgreSQL → API Routes → フロントエンド
```

| テーブル | 内容 | 件数目安 |
|---------|------|---------|
| pokemon | ポケモンマスター（フォルム含む） | ~1,250 |
| moves | 技マスター | ~680 |
| abilities | 特性マスター | ~305 |
| items | アイテムマスター（対戦用+メガストーン） | ~125 |
| learnsets | ポケモン×覚える技 | ~52,000 |
| games | ゲームタイトル | 1 |
| regulations | レギュレーション | 1 |
| regulation_pokemon | レギュレーション別使用可否 | ~809 |

### ローカル DB セットアップ（Docker）

```bash
# 1. PostgreSQL 起動
docker compose up -d

# 2. 環境変数設定
cp apps/web/.env.local.example apps/web/.env.local
# デフォルトでローカル接続（postgresql://postgres:postgres@localhost:5432/poke_dex_battle）が設定済み

# 3. スキーマをDBに反映
npx drizzle-kit push --config apps/web/drizzle.config.ts

# 4. シードデータ投入（PokeAPIから取得、約5〜10分）
npx tsx apps/web/db/seed.ts

# DB停止
docker compose down

# DB停止 + データ削除
docker compose down -v
```

### Supabase（本番）接続

`apps/web/.env.local` の `DATABASE_URL` を Supabase の接続文字列に変更する。

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
```

### スキーマ変更 → マイグレーション手順

スキーマ変更はローカルDBで検証してから本番に適用する。

#### 1. スキーマ定義を編集

```bash
# スキーマファイル
apps/web/db/schema.ts
```

#### 2. マイグレーションファイル生成

```bash
npx drizzle-kit generate --config apps/web/drizzle.config.ts
# → apps/web/db/migrations/ にSQLファイルが生成される
```

#### 3. ローカルDBに適用して検証

```bash
# .env.local がローカルDB向けになっていることを確認
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/poke_dex_battle

# マイグレーション適用
npx drizzle-kit migrate --config apps/web/drizzle.config.ts

# seed再実行（必要な場合）
npx tsx apps/web/db/seed.ts

# 動作確認
npm run dev:frontend
```

#### 4. 本番（Supabase）に適用

```bash
# .env.local を本番向けに切り替え
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres

# マイグレーション適用
npx drizzle-kit migrate --config apps/web/drizzle.config.ts

# seed再実行（必要な場合）
npx tsx apps/web/db/seed.ts

# 完了後、.env.local をローカルDB向けに戻す
```

> **`push` vs `migrate`**: `drizzle-kit push` はスキーマを直接DBに同期する開発用コマンド（マイグレーションファイルを生成しない）。初回セットアップや開発中の試行錯誤には便利だが、本番環境や変更履歴を残したい場合は `generate` → `migrate` を使うこと。

### seed.ts の構成

| 定数 | 用途 |
|------|------|
| `FORM_NAME_JA_MAP` | フォルム別の日本語名上書き（PokeAPI IDをキーとする） |
| `MEGA_STONE_MAP` | メガシンカポケモン → メガストーン |
| `FIXED_ITEM_MAP` | 固定アイテム（オーガポンの面、くちたけん等） |
| `FIXED_TERA_TYPE_MAP` | 固定テラスタイプ（オーガポン各種） |
| `FORM_LEARNSET_SUPPLEMENTS` | PokeAPIで欠落している技の手動補完 |

フォルム名の自動命名ルール:
- `-alola` → 「アローラのすがた」
- `-galar` → 「ガラルのすがた」
- `-hisui` → 「ヒスイのすがた」
- `-paldea` → 「パルデアのすがた」
- `-mega` / `-mega-x` / `-mega-y` → 「メガ○○」
- 上記以外 → PokeAPI の pokemon-form エンドポイントから日本語名取得、なければ英語サフィックスをカッコ付きで付与

### API Routes

| エンドポイント | 概要 |
|--------------|------|
| `GET /api/pokemon` | ポケモン一覧（?regulation=sv-reg-i でフィルタ、?q= で検索）、abilitiesテーブルJOINで特性日本語名付与 |
| `GET /api/pokemon/[id]` | ポケモン単体取得 |
| `GET /api/moves` | 技一覧 |
| `GET /api/moves/[id]` | 技単体取得 |
| `GET /api/abilities` | 特性一覧 |
| `GET /api/items` | アイテム一覧 |
| `GET /api/learnsets/[pokemon]` | 覚える技（level/machine/egg別、フォルム0件時はベースフォルムfallback） |

---

## コーディング規約

### TypeScript

- 厳格な型定義を使用（`any`の使用は最小限に）
- 明示的な型注釈を付ける（特に関数の引数と戻り値）
- `interface`よりも`type`を優先（一貫性のため）

### ファイル・ディレクトリ命名

- ファイル名: kebab-case（例: `pokemon-cache.ts`）
- コンポーネント: PascalCase（例: `PokemonCard.tsx`）
- ディレクトリ: kebab-case（例: `components/pokemon-list/`）

### インポート順序

```typescript
// 1. 外部ライブラリ
import React from 'react';
import { useState } from 'react';

// 2. 内部パッケージ
import { Pokemon } from '@poke-dex-battle/shared';

// 3. 相対インポート
import { PokemonCard } from './PokemonCard';
import styles from './styles.module.css';
```

---

**最終更新**: 2026-03-15
