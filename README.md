# ポケモンダブルバトル支援アプリ

ポケモンダブルバトルにおけるパーティ管理、ダメージ計算、対戦履歴管理を統合的に支援するWebアプリです。

## 機能

- **ダメージ計算**: ダブルバトル特有の要素を考慮した詳細なダメージ計算
- **パーティ管理**: ポケモンの詳細情報（種族値、性格、技構成など）を管理
- **対戦履歴**: 過去の対戦データを記録・管理し、統計情報を表示

## 技術スタック

### フロントエンド（apps/web）
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**
- **Tailwind CSS**

### バックエンド（backend/api）
- **Hono** (Node.js)
- **Prisma** (Phase 2〜)
- **PostgreSQL** (Phase 2〜)

### 共通パッケージ（packages/shared）
- 型定義
- ダメージ計算ロジック
- 実数値計算
- バリデーション

---

## セットアップ

### 必要な環境

- **Node.js**: 20.x LTS以上
- **npm**: 10.x以上

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

#### 全てのサービスを同時に起動
```bash
npm run dev
```

#### フロントエンドのみ起動（http://localhost:3000）
```bash
npm run dev:web
```

#### バックエンドAPIのみ起動（http://localhost:8787）
```bash
npm run dev:api
```

---

## プロジェクト構成

```
poke-dex-battle/
├── package.json            # ルート（npm workspaces設定）
│
├── apps/
│   └── web/                # Next.jsアプリ（フロントエンド）
│       ├── app/            # App Router
│       │   ├── page.tsx    # ホーム
│       │   ├── calc/       # ダメージ計算
│       │   ├── parties/    # パーティ管理
│       │   └── battles/    # 対戦履歴
│       └── package.json
│
├── packages/
│   └── shared/             # 共通パッケージ
│       ├── src/
│       │   ├── types/      # 型定義
│       │   ├── utils/      # ユーティリティ（実数値計算など）
│       │   └── constants/  # 定数（タイプ相性など）
│       └── package.json
│
├── backend/
│   └── api/                # Hono API（バックエンド）
│       ├── src/
│       │   ├── index.ts    # エントリーポイント
│       │   └── routes/     # APIルート
│       └── package.json
│
└── docs/                   # ドキュメント
    ├── requirements.md     # 要件定義書
    ├── tech-stack.md       # 技術スタック
    └── schedule.md         # 開発スケジュール
```

---

## コマンド一覧

| コマンド | 説明 |
|----------|------|
| `npm install` | 依存関係をインストール |
| `npm run dev` | 全サービスを開発モードで起動 |
| `npm run dev:web` | フロントエンドのみ起動 |
| `npm run dev:api` | バックエンドAPIのみ起動 |
| `npm run build` | 全パッケージをビルド |
| `npm run lint` | ESLintでコードをチェック |
| `npm run clean` | ビルド成果物を削除 |

---

## APIエンドポイント

### 認証（Phase 2〜）
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/auth/register` | ユーザー登録 |
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/refresh` | トークン更新 |
| POST | `/api/auth/logout` | ログアウト |

### パーティ
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/parties` | パーティ一覧 |
| POST | `/api/parties` | パーティ作成 |
| GET | `/api/parties/:id` | パーティ詳細 |
| PUT | `/api/parties/:id` | パーティ更新 |
| DELETE | `/api/parties/:id` | パーティ削除 |

### 対戦履歴
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/battles` | 対戦履歴一覧 |
| POST | `/api/battles` | 対戦記録作成 |
| GET | `/api/battles/stats` | 統計情報 |
| GET | `/api/battles/:id` | 対戦詳細 |
| PUT | `/api/battles/:id` | 対戦記録更新 |
| DELETE | `/api/battles/:id` | 対戦記録削除 |

### 計算
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/calc/stats` | 実数値計算 |
| POST | `/api/calc/damage` | ダメージ計算 |

---

## 開発フェーズ

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 1-1 | ダメージ計算機能 | 開発中 |
| Phase 1-2 | パーティ登録機能 | 未着手 |
| Phase 1-3 | 対戦履歴管理 | 未着手 |
| Phase 2 | バックエンド + 認証 | 未着手 |
| Phase 3 | スマホアプリ化 | 未着手 |

詳細は [開発スケジュール](docs/schedule.md) を参照してください。

---

## ドキュメント

- [要件定義書](docs/requirements.md)
- [技術スタック](docs/tech-stack.md)
- [開発スケジュール](docs/schedule.md)

---

## 参考リンク

### 開発フレームワーク
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Hono ドキュメント](https://hono.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)

### ポケモン対戦ツール参考サイト
- [ポケモンデータバトルベース（SV）](https://sv.pokedb.tokyo/)
- [ダメージ計算ツール（シングル用）](https://sv.pokesol.com/calc)
- [ポケモン基礎知識（やっくん）](https://yakkun.com/)
- [PokéAPI](https://pokeapi.co/)

---

**最終更新**: 2025-11-22
