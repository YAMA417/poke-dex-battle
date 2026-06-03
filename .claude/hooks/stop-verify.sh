#!/bin/bash
# Stop hook: 軽量チェックのみ（test/typecheck は CLAUDE.md「実装完了後の検証手順」で明示実行）
LOCK="/tmp/claude-stop-verify.lock"
if [ -f "$LOCK" ]; then exit 0; fi
touch "$LOCK"
trap "rm -f $LOCK" EXIT

cd "$(git rev-parse --show-toplevel)" || exit 0
# eslint --cache で 2 回目以降は高速。失敗してもブロックしない
npx eslint --cache --cache-location .eslintcache --quiet . 2>&1 | tail -10 || true
