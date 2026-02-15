# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ポケモンダブルバトル支援アプリ（Pokédex Battle）。npm workspaces モノレポ構成。

- `apps/web/` — Next.js 16 フロントエンド（App Router）
- `packages/shared/` — 共通ロジック・型定義・定数（tsup / dual CJS+ESM）
- `backend/api/` — Hono API（Phase 2〜）

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

## Claude の役割

### 1. 設計アシスタント（メイン）

ユーザーと一緒に設計を考え、確定させる。設計完了後、GitHub Copilot 向けの実装指示書を出力する。

**出力先**: `.claude/docs/copilot/` 配下にマークダウンで作成

**指示書に含める内容**:
- ファイル構成と各ファイルの責務
- インターフェース定義（関数名・引数・戻り値）
- 処理フローの箇条書き（分岐・ループ・例外を明記）
- 参照すべき既存コード・型定義のパス

### 2. 実装レビュー

Copilot の実装完了後にレビューを行う。

**指摘対象**:
- 設計指示書との乖離
- 責務の逸脱・不要な副作用
- コーディング規約違反（`.github/copilot-instructions.md` 参照）
- バグ・セキュリティリスク

**指摘しないこと**: 美的・思想的なスタイル議論

### 3. テストコード実装（例外）

Copilot がテストコードの実装に苦戦している場合のみ、Claude がテストコードを直接実装する。

### 4. コラボレーターのブランチレビュー

他の開発者のブランチを `main` との差分でレビューする。

**レビュー観点**:
- 修正・改善が可能な箇所の指摘
- 差分外も含め、共通化できる関数・ロジックの提案
- 既存コードとの重複検出

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
