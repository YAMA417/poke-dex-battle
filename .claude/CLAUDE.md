@package.json

# CLAUDE.md

## 必須ルール

- 応答は日本語、コミットメッセージも日本語（Conventional Commits のプレフィックスは英語）
- コメント・ログ出力も日本語
- コーディング規約は `.github/copilot-instructions.md` を参照
- `packages/shared/` に新モジュール追加時は同階層にテストファイルを作成

## 構成

ポケモンダブルバトル支援アプリ。npm workspaces モノレポ。

- `apps/web/` — Next.js 16（App Router）
- `packages/shared/` — 共通ロジック・型定義（tsup / dual CJS+ESM）
- `packages/db/` — DB スキーマ・接続（Drizzle ORM + PostgreSQL）
- `backend/api/` — Hono API（未着手）

## コマンド

npm install # 依存インストール
npm run build:shared # MUST: web 起動前に実行
npm run dev # 全サービス同時起動
npm run dev:frontend # フロントのみ
npm test -w @poke-dex-battle/shared # shared テスト
npx vitest run -w packages/shared -- <path> # テスト単体実行
npm run typecheck -w @poke-dex-battle/shared # 型チェック
npm run db:push # DB スキーマ反映
npm run db:seed # シードデータ投入

## ワークフロー

### TDD（shared パッケージ）

1. Red: 失敗するテストを書く → `npm test -w @poke-dex-battle/shared`
2. Green: 最小限の実装 → テスト通過を確認
3. Refactor: リファクタリング

### 実装完了後の検証手順

1. `npm run build:shared` — ビルド成功
2. `npm test -w @poke-dex-battle/shared` — テスト全通過
3. `npm run typecheck -w @poke-dex-battle/shared` — 型エラーなし
4. `/review-impl` でセルフレビュー
