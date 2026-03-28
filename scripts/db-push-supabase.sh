#!/usr/bin/env bash
# Supabase へスキーマ反映 + シードデータ投入
# 事前準備: .env.supabase を作成（.env.supabase.example を参照）

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.supabase"

if [ ! -f "$ENV_FILE" ]; then
  echo "エラー: $ENV_FILE が見つかりません"
  echo "  .env.supabase.example をコピーして接続情報を設定してください"
  exit 1
fi

# .env.supabase から環境変数を読み込む
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "--- スキーマ反映 (db:push) ---"
cd "$REPO_ROOT"
npm run db:push -w @poke-dex-battle/db

echo ""
echo "--- シードデータ投入 (db:seed) ---"
npm run db:seed -w @poke-dex-battle/db

echo ""
echo "完了"
