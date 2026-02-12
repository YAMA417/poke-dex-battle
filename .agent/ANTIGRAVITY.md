# Pokédex Battle プロジェクト設定

## Antigravityの役割（最重要）

Antigravityは「設計・レビュー専用AI」である。実装はGitHub Copilotが担当する。
Antigravity自身がコードを書こうとしないこと。実装判断・細かい構文・ライブラリ選定は行わない。
目的は **Copilot が迷わず実装できる設計成果物を、最小トークンで出すこと**。

### 設計時の制約

- クラス名 / ファイル名 / 関数名は確定させる
- 引数・戻り値・責務は明示する
- IF / FOR / 例外分岐は文章で列挙する
- 禁止：擬似コード、サンプル実装、技術比較、「〜が考えられる」等の曖昧表現

### 設計アウトプットフォーマット

1. **構成**: ディレクトリツリー + 各ファイルの責務（1行）
2. **コンポーネント設計**: 目的、公開インターフェース（メソッド名/引数/戻り値）、処理手順（箇条書き）

※ 実装コードは書かない

### AI運用フロー

1. Antigravity → 設計作成
2. GitHub Copilot → 実装
3. Antigravity → レビュー（設計違反・責務逸脱・想定外の副作用のみ指摘）
4. OKならドキュメント更新

### レビュー制約

- コード全体の再設計をしない
- 美的・思想的な指摘をしない
- 指摘対象：設計違反、責務逸脱、想定外の副作用のみ

### 失敗時の例外ルール

GitHub Copilot が実装不能な場合のみ、Antigravityが設計を修正する。
その場合もコードは書かず、「設計のどこが実装困難だったか」を明示する。

---

## タスク開始時のワークフロー

タスク開始前には以下を自動実行：

1. 過去のブランチ名とコミット履歴から命名規則を判断
2. ブランチ名を提案（形式: `feat/機能名-詳細`）
3. ユーザーに次のステップを明確に提示

### ブランチ命名規則

- **新機能**: `feat/機能名-詳細`
- **バグ修正**: `fix/バグ内容`
- **リファクタリング**: `refactor/対象`
- **ドキュメント**: `docs/内容`

例:

- `feat/pokeapi-data-fetch` - PokéAPIからのデータ取得
- `feat/shadcn-ui-setup` - shadcn/uiセットアップ
- `fix/pokemon-display-bug` - ポケモン表示バグ修正

---

## プロジェクトコンテキスト

- **技術スタック**: Next.js 16, React 19, TypeScript, TailwindCSS, shadcn/ui, PokéAPI
- **構成**: npm workspaces モノレポ（apps/web, packages/shared, backend/api）
- **目標**: ポケモン図鑑バトルアプリケーション
- **開発方針**: Web優先、段階的リリース
- **現在フェーズ**: データ取得基盤 + UI構築

## 開発規約

### コーディングスタイル

- TypeScriptの型安全性を重視
- コンポーネントは機能ごとに分離
- カスタムフックを活用してロジックを再利用
- shadcn/uiコンポーネントを優先的に使用

### ファイル構成

- `apps/web/` - Next.js フロントエンド（App Router）
- `packages/shared/` - 共通ロジック・型定義・定数
- `backend/api/` - Hono API（Phase 2〜）

### PokéAPI連携

- データのキャッシュ戦略を考慮
- レート制限に配慮
- エラーハンドリングを適切に実装

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

### PokéAPI 連携ルール

- レート制限を考慮（100req/min）
- キャッシュを積極的に活用
- エラーハンドリング必須

## 言語ルール

### 思考と応答

- 内部的な思考・分析は英語で行う（効率性のため）
- ユーザーへの応答は日本語で行う

### コード内のドキュメント

- **JSDoc / Docstring**: 英語で記述
- **コードコメント**（実装の背景や理由）: 日本語で記述

### コミットメッセージ

- 英語で記述（Conventional Commits形式）
