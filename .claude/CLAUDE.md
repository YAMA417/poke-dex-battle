# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ポケモンダブルバトル支援アプリ（Pokédex Battle）。npm workspaces モノレポ構成。

- `apps/web/` — Next.js 16 フロントエンド（App Router）
- `packages/shared/` — 共通ロジック・型定義・定数（tsup / dual CJS+ESM）
- `backend/api/` — Hono API（未着手）

## 開発コマンド

```bash
npm install              # 依存関係インストール
npm run dev              # 全サービス同時起動（shared watch + web + api）
npm run dev:frontend     # フロントエンドのみ
npm run build            # ビルド（shared → web）
npm run build:shared     # shared のみビルド（web 起動前に必須）
npm run lint             # Lint（web）
npm test -w @poke-dex-battle/shared          # テスト実行
npx vitest run -w packages/shared -- <path>  # テスト単体実行
npm run typecheck -w @poke-dex-battle/shared # 型チェック
```

---

## Claude の使い方

| やりたいこと | コマンド | 出力先 |
|------------|---------|--------|
| 機能の設計 → Copilot 指示書作成 | `/design-review` | `.claude/docs/{branch}/instructions.md` |
| Copilot 実装のセルフレビュー | `/review-impl` | 指示書内に追記 |
| 他人のブランチレビュー | `/review` | `.claude/docs/{branch}/review.md` |
| ブランチの変更を学習解説 | `/explain` | `.claude/docs/{branch}/explain.md` |
| レビューへの意見回答 | `/review-feedback` | コンソール |
| 進捗確認 | `/progress` | コンソール |
| ツイート生成 | `/tweet` | コンソール |

テストコードは Copilot が苦戦している場合のみ Claude が直接実装する。

---

## トークン効率化ルール

- コードを読む前に Glob/Grep で対象を絞り込む
- 大きなファイルは必要な行範囲のみ読む
- 冗長な説明を避け、簡潔に応答する
- 設計指示書は必要十分な情報量に留める

---

## 言語ルール

- 内部思考: 英語
- ユーザーへの応答: 日本語
- JSDoc: 英語
- コードコメント: 日本語
- コミットメッセージ: 英語（Conventional Commits）

---

## コーディング規約

`.github/copilot-instructions.md` に定義済み。Claude もレビュー時にこれを基準とする。
