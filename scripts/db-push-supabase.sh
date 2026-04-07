#!/usr/bin/env bash
# Supabase へスキーマ反映 + シードデータ投入
# 事前準備: .env.supabase を作成（.env.supabase.example を参照）
#
# 使い方:
#   ./scripts/db-push-supabase.sh           # マイグレーション適用 + シード（デフォルト）
#   ./scripts/db-push-supabase.sh migrate   # マイグレーション適用のみ（シードなし）
#   ./scripts/db-push-supabase.sh seed      # シードのみ（スキーマ変更なし）
#   ./scripts/db-push-supabase.sh reset     # 全テーブル削除 → マイグレーション → シード
#   ./scripts/db-push-supabase.sh rls       # RLS ポリシー適用のみ

set -e

MODE="${1:-default}"

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

cd "$REPO_ROOT"

# RLS ポリシー適用関数
apply_rls() {
  echo "--- RLS ポリシー適用 ---"
  psql "$DATABASE_URL" -f "$REPO_ROOT/packages/db/sql/enable-rls.sql"
}

case "$MODE" in
  default)
    echo "--- マイグレーション適用 (db:migrate) ---"
    npm run db:migrate -w @poke-dex-battle/db

    apply_rls

    echo ""
    echo "--- シードデータ投入 (db:seed) ---"
    npm run db:seed -w @poke-dex-battle/db
    ;;

  migrate)
    echo "--- マイグレーション適用 (db:migrate) ---"
    npm run db:migrate -w @poke-dex-battle/db
    ;;

  seed)
    echo "--- シードデータ投入 (db:seed) ---"
    npm run db:seed -w @poke-dex-battle/db
    ;;

  reset)
    echo "⚠️  全テーブルを削除して再構築します"
    echo "   対象: $DATABASE_URL"
    echo ""
    read -r -p "続行しますか？ (yes/N): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "キャンセルしました"
      exit 0
    fi

    echo ""
    echo "--- リセット + マイグレーション + シード (db:reset) ---"
    npm run db:reset -w @poke-dex-battle/db

    apply_rls
    ;;

  rls)
    apply_rls
    ;;

  *)
    echo "エラー: 不明なモード '$MODE'"
    echo ""
    echo "使い方:"
    echo "  $0             # マイグレーション + RLS + シード（デフォルト）"
    echo "  $0 migrate     # マイグレーションのみ"
    echo "  $0 seed        # シードのみ"
    echo "  $0 reset       # 全削除 → マイグレーション → シード → RLS"
    echo "  $0 rls         # RLS ポリシー適用のみ"
    exit 1
    ;;
esac

echo ""
echo "完了"
