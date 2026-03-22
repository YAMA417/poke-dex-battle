# CLAUDE.md

## IMPORTANT: 必須ルール

- 応答は日本語、コミットは英語（Conventional Commits）
- `packages/shared/` に新しいモジュールを追加したら、同階層にテストファイルを作成すること
- `npm run build:shared` を実行してから web を起動すること（shared が未ビルドだと型エラーが出る）
- コーディング規約は `.github/copilot-instructions.md` を参照すること
- テストコードは Copilot が苦戦している場合のみ Claude が直接実装する

## WHAT: 構成

ポケモンダブルバトル支援アプリ。npm workspaces モノレポ。

```
apps/web/          Next.js 16（App Router）
packages/shared/   共通ロジック・型定義（tsup / dual CJS+ESM）
packages/db/       DB スキーマ・接続（Drizzle ORM + PostgreSQL）
backend/api/       Hono API（未着手）
```

## HOW: コマンド

```bash
npm install                                        # 依存関係インストール
npm run build:shared                               # MUST: web 起動前に実行
npm run dev                                        # 全サービス同時起動
npm run dev:frontend                               # フロントエンドのみ
npm test -w @poke-dex-battle/shared                # テスト実行
npx vitest run -w packages/shared -- <path>        # テスト単体実行
npm run typecheck -w @poke-dex-battle/shared       # 型チェック
npm run db:push                                    # DB スキーマ反映（開発用）
npm run db:seed                                    # シードデータ投入
```

## スキル

| やりたいこと          | コマンド           |
| --------------------- | ------------------ |
| 機能設計 → 指示書作成 | `/design-review`   |
| 実装のセルフレビュー  | `/review-impl`     |
| ブランチレビュー      | `/review`          |
| 変更の学習解説        | `/explain`         |
| レビューへの意見回答  | `/review-feedback` |
