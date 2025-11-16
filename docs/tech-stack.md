# ポケモンダブルバトル支援アプリ 技術スタック

## システム構成

```
┌─────────────────────────────────────┐
│     Frontend (Next.js)              │
│   - Next.js 14+ (App Router)        │
│   - React 18+                       │
│   - Tailwind CSS / shadcn/ui        │
└──────────────┬──────────────────────┘
               │
               │ Phase 1: ローカルストレージ (IndexedDB)
               │ Phase 2: REST API
               │
┌──────────────▼──────────────────────┐
│   Backend (Hono + Node.js)          │
│   - Hono Framework                  │
│   - 自前JWT認証                      │
│   - Prisma ORM                      │
└──────────────┬──────────────────────┘
               │
               │ Phase 2〜
               │
┌──────────────▼──────────────────────┐
│     PostgreSQL (Docker)             │
│   ※将来Supabaseへ移行可能           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   Mobile (Expo) ※Phase 3〜         │
│   - Expo SDK 52+                    │
│   - React Native                    │
└─────────────────────────────────────┘

External API: PokéAPI (ポケモンマスターデータ)
```

---

## フロントエンド（Webアプリ）

### フレームワーク

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 14以上 | Reactフレームワーク（App Router） |
| React | 18以上 | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |

### 主要ライブラリ

| カテゴリ | ライブラリ | 用途 |
|---------|-----------|------|
| UI | Tailwind CSS + shadcn/ui | スタイリング・UIコンポーネント |
| 状態管理 | Zustand or Jotai | グローバル状態管理 |
| フォーム | React Hook Form + Zod | フォームバリデーション |
| ローカルDB | IndexedDB (Dexie.js) | ブラウザ内データ永続化 (Phase 1) |
| データ取得 | TanStack Query (React Query) | サーバー状態管理 |
| HTTP Client | Fetch API | API通信 |

### 開発環境

| 項目 | 内容 |
|------|------|
| パッケージマネージャー | npm |
| モノレポ | npm workspaces |
| コード品質 | ESLint + Prettier |
| テスト | Vitest + Testing Library |

---

## バックエンド（API）※Phase 2〜

### フレームワーク

| 技術 | 用途 |
|------|------|
| Hono | 高速軽量Webフレームワーク |
| Node.js | ランタイム（20.x LTS） |

### ORM

| 技術 | 用途 |
|------|------|
| Prisma | 型安全なDB操作、マイグレーション管理 |

### 認証

| 方式 | 内容 |
|------|------|
| 自前JWT | アクセストークン + リフレッシュトークン |
| bcrypt | パスワードハッシュ化 |

### API設計

RESTful API

```
# 認証
POST   /api/auth/register     # ユーザー登録
POST   /api/auth/login        # ログイン
POST   /api/auth/refresh      # トークン更新
POST   /api/auth/logout       # ログアウト

# パーティ
GET    /api/parties           # パーティ一覧取得
POST   /api/parties           # パーティ作成
GET    /api/parties/:id       # パーティ詳細取得
PUT    /api/parties/:id       # パーティ更新
DELETE /api/parties/:id       # パーティ削除

# 対戦履歴
GET    /api/battles           # 対戦履歴一覧
POST   /api/battles           # 対戦記録作成
GET    /api/battles/:id       # 対戦詳細取得
PUT    /api/battles/:id       # 対戦記録更新
DELETE /api/battles/:id       # 対戦記録削除
GET    /api/battles/stats     # 統計情報取得

# ダメージ計算（オプション）
POST   /api/damage-calc       # ダメージ計算
```

### デプロイ先（将来・無料枠あり）

| 用途 | サービス | 無料枠 |
|------|---------|--------|
| フロント | Vercel | 10万リクエスト/月 |
| フロント | Cloudflare Pages | 無制限 |
| API | Cloudflare Workers | 10万リクエスト/日 |
| DB | Neon | 0.5GB（PostgreSQL） |

---

## データベース ※Phase 2〜

### 開発環境

| 技術 | 用途 |
|------|------|
| PostgreSQL 16 | メインDB |
| Docker | ローカル環境構築 |

### Docker Compose（開発用）

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    container_name: poke-battle-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: poke_battle
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 本番環境（将来・無料枠あり）

| サービス | 無料枠 | 備考 |
|---------|--------|------|
| Neon | 0.5GB | サーバーレスPostgreSQL、Prisma対応◎（推奨） |
| Supabase | 500MB | PostgreSQL + 認証 + Storage |
| Turso | 9GB | SQLite互換、エッジ対応 |

---

## モバイルアプリ（Phase 3〜）

### フレームワーク

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Expo | SDK 52以上 | 開発フレームワーク |
| React Native | - | UIフレームワーク |
| Expo Router | - | ファイルベースルーティング |

### 主要ライブラリ

| カテゴリ | ライブラリ | 用途 |
|---------|-----------|------|
| UI | NativeWind (Tailwind CSS) | スタイリング（Webと共通化） |
| ローカルDB | Expo SQLite | ローカルデータ永続化 |
| 動画選択 | expo-document-picker | ファイル選択UI |
| 動画再生 | expo-av | メディア再生 |

---

## 外部API

### PokéAPI

- **URL**: https://pokeapi.co/
- **取得データ**:
  - ポケモンの種族値データ
  - 技データ
  - 特性データ
  - タイプ相性データ

### データキャッシュ戦略

**Phase 1（フロントのみ）:**
1. 初回アクセス時にPokéAPIからデータ取得
2. IndexedDBにキャッシュ
3. 次回以降はキャッシュから読み込み

**Phase 2（バックエンドあり）:**
1. バックエンドでPokéAPIをプロキシ（オプション）
2. PostgreSQLにマスターデータを保存
3. 定期的に更新チェック

---

## プロジェクト構成（モノレポ）

```
poke-dex-battle/
├── README.md
├── docs/
│   ├── requirements.md         # 要件定義書
│   ├── tech-stack.md           # 本ドキュメント
│   └── schedule.md             # 開発スケジュール
├── package.json                # ルートpackage.json (workspace設定)
├── package-lock.json
├── docker-compose.yml          # PostgreSQL（Phase 2〜）
├── .gitignore
├── .env.example
│
├── apps/
│   ├── web/                    # Next.jsアプリ
│   │   ├── app/                # App Router
│   │   │   ├── page.tsx        # ホーム画面
│   │   │   ├── calc/           # ダメージ計算
│   │   │   │   └── page.tsx
│   │   │   ├── parties/        # パーティ管理
│   │   │   │   ├── page.tsx    # 一覧
│   │   │   │   ├── [id]/       # 詳細
│   │   │   │   └── new/        # 新規作成
│   │   │   ├── battles/        # 対戦履歴
│   │   │   │   ├── page.tsx    # 一覧
│   │   │   │   ├── [id]/       # 詳細
│   │   │   │   └── new/        # 新規作成
│   │   │   └── layout.tsx      # ルートレイアウト
│   │   ├── components/         # UIコンポーネント
│   │   │   ├── ui/             # shadcn/ui
│   │   │   ├── calc/           # ダメージ計算用
│   │   │   ├── party/          # パーティ用
│   │   │   └── battle/         # 対戦履歴用
│   │   ├── hooks/              # カスタムフック
│   │   ├── lib/                # ユーティリティ
│   │   ├── public/             # 静的ファイル
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                 # Expoアプリ（Phase 3〜）
│       ├── app/                # Expo Router
│       ├── components/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                 # 共通ロジック（Web・API・Mobile共通）
│   │   ├── src/
│   │   │   ├── types/          # TypeScript型定義
│   │   │   │   ├── pokemon.ts
│   │   │   │   ├── party.ts
│   │   │   │   ├── battle.ts
│   │   │   │   └── calc.ts
│   │   │   ├── utils/          # 共通ユーティリティ
│   │   │   │   ├── damage-calc.ts  # ダメージ計算ロジック
│   │   │   │   ├── stat-calc.ts    # 実数値計算
│   │   │   │   └── validation.ts   # バリデーション
│   │   │   └── constants/      # 定数（タイプ相性など）
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api-client/             # APIクライアント（Phase 2〜）
│       ├── src/
│       │   ├── client.ts
│       │   └── endpoints/
│       ├── package.json
│       └── tsconfig.json
│
└── backend/
    └── api/                    # Hono API（Phase 2〜）
        ├── src/
        │   ├── index.ts        # エントリーポイント
        │   ├── routes/
        │   │   ├── auth.ts     # 認証
        │   │   ├── parties.ts  # パーティ
        │   │   ├── battles.ts  # 対戦履歴
        │   │   └── calc.ts     # ダメージ計算
        │   ├── middleware/
        │   │   └── auth.ts     # JWT認証ミドルウェア
        │   ├── lib/
        │   │   ├── jwt.ts      # JWT生成・検証
        │   │   └── password.ts # パスワードハッシュ
        │   └── prisma/
        │       └── schema.prisma
        ├── package.json
        └── tsconfig.json
```

---

## 動作環境

### 開発環境

| 項目 | 内容 |
|------|------|
| OS | Windows |
| Node.js | 20.x LTS |
| Docker | PostgreSQL用 |
| ブラウザ | Chrome, Firefox, Safari, Edge |

### 本番環境（将来）

| プラットフォーム | 要件 |
|-----------------|------|
| Web | モダンブラウザ（ES2020対応） |
| フロントデプロイ | Vercel / Cloudflare Pages |
| バックエンドデプロイ | Cloudflare Workers / Railway |
| DBデプロイ | Supabase / Railway / Neon |

### Phase 3 モバイル環境

| プラットフォーム | 最小バージョン |
|-----------------|---------------|
| Android | 8.0以上 |
| iOS | 13.0以上 |

---

## 非機能要件

### セキュリティ

- JWT認証（アクセストークン + リフレッシュトークン）
- パスワードはbcryptでハッシュ化
- CORS設定
- 環境変数で機密情報管理

### パフォーマンス

| 項目 | 目標値 |
|------|--------|
| 初回ロード | 3秒以内 |
| ダメージ計算 | リアルタイム（100ms以内） |
| API応答 | 200ms以内 |
| Lighthouse Score | 90以上 |

### データ容量

| Phase | 制限 |
|-------|------|
| Phase 1 | ブラウザのIndexedDB制限に依存 |
| Phase 2 | PostgreSQL（ローカルは無制限） |

---

**最終更新**: 2025-11-22
