# Pokédex Battle - GitHub Copilot Instructions

## プロジェクト概要

ポケモンダブルバトル支援アプリ。ダメージ計算・パーティ管理・対戦記録をWebで提供する。Phase 1はフロントのみ。

---

## 技術スタック

- Next.js 16 / React 19 / TypeScript / TailwindCSS / shadcn/ui
- npm workspaces モノレポ
- Hono + Prisma + PostgreSQL（Phase 2〜）
- PokéAPI（外部ポケモンマスターデータ）

---

## ディレクトリ構成

```
poke-dex-battle/
├── apps/
│   └── web/                    # Next.js フロントエンド（App Router）
│       ├── app/                # ページ（App Router）
│       ├── components/         # UIコンポーネント
│       │   ├── ui/             # shadcn/ui
│       │   ├── calc/           # ダメージ計算用
│       │   ├── party/          # パーティ用
│       │   └── battle/         # 対戦履歴用
│       ├── hooks/              # カスタムフック
│       └── lib/                # ユーティリティ
├── packages/
│   └── shared/                 # 共通ロジック・型定義・定数
│       └── src/
│           ├── types/          # TypeScript型定義
│           ├── utils/          # 共通ユーティリティ（ダメージ計算等）
│           └── constants/      # 定数（タイプ相性など）
└── backend/
    └── api/                    # Hono API（Phase 2〜）
```

---

## コーディング規約

### TypeScript

- `any` 型の使用禁止（`unknown` を使用し、型ガードで絞り込む）
- 型推論ではなく明示的な型指定を推奨
- interface 優先（type は union / intersection / mapped types のみ）
- `as` によるキャスト禁止（型ガードまたはジェネリクスで解決する）
- 非nullアサーション `!` 禁止（optional chaining `?.` または型ガードを使用）
- enum 禁止（`as const` オブジェクトまたは union 型を使用）
- 関数の戻り値型は必ず明示する
- マジックナンバー/マジックストリング禁止（定数として定義する）
- ネストは最大3階層まで（早期returnで浅くする）
- 1ファイル300行以内を目安に分割する
- named export のみ使用（default export 禁止）
- 配列操作は破壊的メソッド（push, splice等）を避け、スプレッド構文や map/filter を使用
- nullish coalescing `??` を `||` より優先する

### React

- ファイル命名: PascalCase（MyComponent.tsx）
- hooks のみ使用（クラスコンポーネント禁止）
- Props の型定義は interface で
- コンポーネントは named export の arrow function で定義
- useEffect の依存配列は必ず正確に指定する（eslint-plugin-react-hooks に従う）
- イベントハンドラは `handle` + 動詞（handleClick, handleSubmit）で命名

### TailwindCSS

- カスタムクラスは tailwind.config.ts で定義
- インラインスタイル禁止

---

## 言語ルール

- **JSDoc / Docstring**: 英語で記述
- **コードコメント**（実装の背景や理由）: 日本語で記述
- **コミットメッセージ**: 英語で記述（Conventional Commits形式）

---

## PokéAPI 連携ルール

- レート制限を考慮（100req/min）
- キャッシュを積極的に活用（IndexedDB）
- エラーハンドリング必須
- 型定義を厳密に

---

## コンポーネント開発ルール

- shadcn/ui コンポーネントを優先使用
- カスタムコンポーネントは再利用可能に設計
- Props はインターフェースで定義
- ローディング/エラー状態を実装
