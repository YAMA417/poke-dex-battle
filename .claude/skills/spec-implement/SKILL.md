---
name: spec-implement
description: spec-test が生成した失敗テスト（Red）を最小実装で通し（Green）、リファクタし、最後に build / test / typecheck で検証する。「実装して」「Green にして」「テスト通して」「spec-implement」「TDD の実装フェーズ」と言われたら必ず起動する。前提として requirements.md と失敗テストが存在する状態で呼ぶ。仕様外への逸脱（TBD 実装 / Should や Could を勝手に実装 / 規約違反）を強力に禁止する。Opus 4.7 の「明示指示への忠実さ」を最大化するために、禁止事項と検証コマンドを skill 本文に直接埋め込んでいる。実装者は Claude（このセッション）か Codex（codex exec で別エージェントに委譲）を選択可能。
metadata:
  type: workflow
---

# spec-implement — Red → Green → Refactor → Verify

このスキルは「失敗テストを最小実装で通し、リファクタし、すべての検証を通過させる」までを担う。終了条件（DoD）を満たすまで完了報告しない。

実装者は **Claude（このセッション）** または **Codex（codex exec で別エージェントに委譲）** を起動時に選択する。Codex 経路でも、最終 DoD 検証は必ず Claude 側で再実行する（Codex の自己申告を鵜呑みにしない）。

---

## 禁止事項（最初に読む。違反したら STOP）

- **TBD 項目を実装しない**。`requirements.md` の `## 7. TBD` に書かれた論点は実装対象外。
- **Should / Could 機能を実装しない**。`## 4. 機能一覧` で Must 以外に分類されたものに手を出さない。
- **`requirements.md` を書き換えない**。仕様変更が必要なら STOP して spec-define に戻る。
- **テストを書き換えない**（テストが間違っていると思ったら STOP し、ユーザーに確認）。
- **既存の通っているテストを壊さない**。Green を Red に戻す変更は禁止。
- **副作用コマンドを無確認で叩かない**（特に `npm run db:push` は必ずユーザー確認）。
- **TypeScript 規約違反**:
  - `any` 型禁止 → `unknown` + 型ガード
  - `as` キャスト禁止 → 型ガード or ジェネリクス（`as const` のみ許可）
  - `!`（non-null assertion）禁止 → optional chaining `?.` or 型ガード
  - `enum` 禁止 → `as const` オブジェクト or union 型
  - 関数の戻り値型は **必ず明示**
  - マジックナンバー / マジックストリング禁止 → 定数化
  - ネスト最大 3 階層（早期 return で浅くする）
  - 1 ファイル 300 行以内
  - named export のみ（default export 禁止）
  - 配列は非破壊（スプレッド / map / filter）
  - `??` を `||` より優先
- **コメント・JSDoc は日本語**。

---

## 前提条件チェック

```
if not exists(.claude/specs/<feature-slug>/requirements.md):
  STOP. 「spec-define を先に起動してください」

if not exists(.claude/specs/<feature-slug>/traceability.md):
  STOP. 「spec-test を先に起動してください」

# Red 確認
run: npx vitest run -w <対象 workspace> -- <test-path>
if 全て pass:
  STOP. 「Red が存在しません。実装済みかテスト不足です。spec-test に戻ってください」
if 1 件以上 fail:
  OK. 実装者選択フェーズに進む。

# codex 疎通確認（実装者選択のため。Codex 経路を出すかどうかの判定）
run: command -v codex
  → 空文字: CODEX_AVAILABLE=false（選択肢から「Codex」を外す）
  → パス取得: 次へ
run: codex --version
  → exit 0: CODEX_AVAILABLE=true
  → exit !=0: CODEX_AVAILABLE=false（選択肢から「Codex」を外す）
```

settings.json の `permissions.allow` に以下が無い場合は事前追加が必要（Codex 経路を使う場合のみ）:

```
"Bash(codex exec:*)",
"Bash(codex --version)",
"Bash(command -v codex)",
"Bash(git diff:*)",
"Bash(git log:*)"
```

未追加なら codex 関連の Bash 呼び出しで都度プロンプトが出る。skill 続行は可能だが運用負荷が高いため事前追加を推奨。

---

## 実装者選択フェーズ

前提条件チェック後、AskUserQuestion で実装者を選ぶ。

```
question: 「この機能の実装者を選んでください」
header: 実装者
multiSelect: false
options:
  - if CODEX_AVAILABLE:
      label: "Claude（現セッションで実装）"
      description: 「現在の Claude セッションが Red→Green→Refactor→Verify を逐次実行する。デフォルト推奨。」
    label: "Codex（codex exec で委譲）"
      description: 「codex CLI に TDD 一連を委譲し、終了後 Claude 側で DoD を再検証する。残コンテキスト節約・別モデル視点が欲しいときに有効。」
  - else（CODEX_AVAILABLE=false）:
      Codex 選択肢を提示せず、AskUserQuestion を出さずに Claude 経路へ直行
      （「codex CLI 未導入のため Claude 経路で実装します」と1行アナウンス）
```

選択結果に応じて以下のどちらかの経路に進む。

---

## 経路A: Claude（現セッション）

### A-1. Green フェーズ（最小実装）

**1 つずつ通す**。複数の `it()` をまとめて一気に実装しない。

```
for each failing test (順序: 正常系 → 異常系 → エラー):
  該当 it() の expect を満たす最小限のコードを書く
  該当テストだけ実行して Green を確認
  他のテストが Red に戻っていないことを確認
```

**最小限の例**:

Red:

```typescript
it('[AC-001-1] 優先度が高い方を返す', () => {
  expect(compareMovePriority({ priority: 1 }, { priority: 0 })).toBe(-1);
});
```

Green（最小）:

```typescript
export function compareMovePriority(a: Move, b: Move): number {
  return b.priority - a.priority;
}
```

「念のため」のロジックを足さない。**テストが要求する以上のことをしない**。

### A-2. Refactor フェーズ

**全テストが Green になってから**実施。Green の状態を保ったまま:

- 重複削除
- 命名改善（PascalCase / camelCase / handleXxx）
- 早期 return でネスト浅化
- 定数抽出（マジックナンバー / マジックストリング排除）
- 関数分割（300 行ルール / 単一責務）

各リファクタ後に `npx vitest run` で Green 維持を確認。

### A-3. Verify フェーズ

下記「共通 Verify フェーズ（DoD）」へ。

---

## 経路B: Codex（codex exec で委譲）

### B-1. 一時ファイル準備

```bash
FEATURE_SLUG="<feature-slug>"
TEST_PATH="<test-path>"      # 例: packages/shared/src/utils/move-priority.test.ts
IMPL_PATH="<impl-path>"      # 例: packages/shared/src/utils/move-priority.ts
ATTEMPT=1                    # リトライ回数（1..3）
PREV_FAIL=""                 # リトライ時のみ前回の失敗内容を入れる
TMP_LAST="/tmp/codex-implement-${FEATURE_SLUG}-$(date +%s).md"
```

### B-2. codex exec 起動

`-s workspace-write` でファイル編集を許可。プロンプトは `<<'CODEX_PROMPT'`（クォート）で `${VAR}` を文字列のまま codex に渡し、codex 側でリポジトリ内ファイルを読ませる。

```bash
timeout 600 codex exec \
  -C "$PWD" \
  -s workspace-write \
  --color never \
  -o "$TMP_LAST" \
  - <<'CODEX_PROMPT'
あなたは TDD 実装エージェントです。日本語で思考・回答してください。

## ミッション

リポジトリ `.claude/specs/${FEATURE_SLUG}/requirements.md` に定義された Must 要件のうち、
失敗中の vitest テスト（Red）を **最小実装で Green にし、リファクタし、最終検証まで通す** こと。

## 入力ファイル（自分で Read してください）

- 要件定義: `.claude/specs/${FEATURE_SLUG}/requirements.md`
- トレーサビリティ: `.claude/specs/${FEATURE_SLUG}/traceability.md`
- 共通スキーマ: `.claude/specs/_schema.md`
- コード規約: `.github/copilot-instructions.md`
- 失敗中テスト: `${TEST_PATH}`
- スタブ実装: `${IMPL_PATH}`

## 絶対禁止事項（違反したら作業を即座に止めて報告すること）

1. **TBD 項目の実装禁止**
   - `requirements.md` の `## 7. TBD` に記載された TBD-XXX は実装対象外
2. **Should / Could 機能の実装禁止**
   - `## 4. 機能一覧` で Must 以外に分類されたものに手を出さない
3. **requirements.md / traceability.md / _schema.md / 既存テストファイルの書き換え禁止**
   - 仕様変更が必要と判断したら STOP し、報告のみ行う
4. **テストの編集禁止**
   - `${TEST_PATH}` を 1 文字も変更しない
   - テストが間違っていると思っても、勝手に修正しない（STOP して報告）
5. **既存 Green を Red に戻す変更禁止**
6. **副作用コマンド禁止**: `npm run db:push` / `git push` / `git commit` / `rm -rf` / `sudo` / `.env` の読み書き

## TypeScript 規約（11 項目、全て厳守）

- `any` 型禁止 → `unknown` + 型ガード
- `as` キャスト禁止 → 型ガードまたはジェネリクスで解決（`as const` のみ許可）
- `!`（non-null assertion）禁止 → optional chaining `?.` または型ガード
- `enum` 禁止 → `as const` オブジェクトまたは union 型
- 関数の戻り値型は必ず明示
- マジックナンバー / マジックストリング禁止 → 定数化
- ネスト最大 3 階層（早期 return で浅くする）
- 1 ファイル 300 行以内
- named export のみ（default export 禁止）
- 配列操作は非破壊（スプレッド / map / filter）
- nullish coalescing `??` を `||` より優先

JSDoc・コメントは日本語で記述すること。

## 作業フロー（厳密に順守）

### Phase 1: Red 確認

`npx vitest run -w packages/shared -- ${TEST_PATH}` を実行し、現在の失敗内容を把握する。
全件 pass している場合は「Red が存在しない」と報告して STOP。

### Phase 2: Green（1 つずつ）

失敗中の `it()` を順に通す。順序は「正常系 → 異常系 → エラーケース」。
1 件ごとに `npx vitest run` で該当テストを再実行し、Green を確認してから次に進む。

「念のため」のロジックを追加しない。テストが要求する以上の挙動を実装しない。

### Phase 3: Refactor

全テストが Green になってから:
- 重複削除 / 命名改善 / 早期 return / 定数抽出 / 関数分割
- 各リファクタ後に `npx vitest run -w packages/shared` で Green 維持を確認

### Phase 4: Verify

以下を全て実行し、全て成功することを確認する:
- `npx vitest run -w packages/shared -- ${TEST_PATH}` → 該当テスト Green
- `npm test -w @poke-dex-battle/shared` → 全テスト Green
- `npm run typecheck -w @poke-dex-battle/shared` → 型エラー 0
- `npm run build:shared` → ビルド成功

## 出力

最終メッセージに以下を **そのまま** 含めて返してください:

```

## 実装完了レポート

- 編集ファイル:
  - <path>: <変更概要>
- テスト結果:
  - 該当テスト: <N passed>
  - 全 shared テスト: <N passed>
- typecheck: OK
- build: OK

## 規約セルフチェック

- any 使用: なし
- as キャスト（as const 除く）: なし
- ! 使用: なし
- enum: なし
- default export: なし
- 戻り値型明示: OK
- 配列破壊メソッド: なし
- || フォールバック: なし
- ネスト 4 階層以上: なし
- 300 行超: なし
- 英語コメント: なし

## 残作業

- なし / <ある場合は箇条書き>

```

## リトライ時の追加コンテキスト

（リトライでない場合は無視）
直前の試行で以下の検証が失敗しました:
```

${PREV_FAIL}

```
原因を特定して修正してください。テストの修正は禁止です（実装側を直す）。
試行回数: ${ATTEMPT} / 3
CODEX_PROMPT
```

### B-3. codex 完了後の Claude 側 DoD 再検証（必須）

codex の自己申告レポートを **そのまま信用しない**。Claude が以下を **必ず** 再実行する:

```bash
# 1. 変更ファイル把握
git status
git diff

# 2. 規約セルフチェック（spec-review と同じ grep を予防的に）
CHANGED_FILES=$(git diff --name-only)
grep -Hn ': any\b\|<any>\|as any' $CHANGED_FILES || echo "any: OK"
grep -Hn '\bas [A-Z]' $CHANGED_FILES | grep -v 'as const' || echo "as cast: OK"
grep -Hn '\w!\.\|\w!;\|\w!\[' $CHANGED_FILES || echo "non-null: OK"
grep -Hn '^enum \|^export enum ' $CHANGED_FILES || echo "enum: OK"
grep -Hn '^export default' $CHANGED_FILES || echo "default export: OK"
for f in $CHANGED_FILES; do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 300 ]; then echo "$f: $lines 行 (300 超過)"; fi
done

# 3. ビルド・テスト・型
npx vitest run -w packages/shared -- "$TEST_PATH"
npm test -w @poke-dex-battle/shared
npm run typecheck -w @poke-dex-battle/shared
npm run build:shared
```

いずれかが失敗 → `PREV_FAIL` に失敗内容を入れて B-2 から **最大 3 回リトライ**。

```
if ATTEMPT < 3 and 検証失敗:
  ATTEMPT += 1
  PREV_FAIL = <失敗内容（stderr のサマリ）>
  goto B-2

if ATTEMPT == 3 and still failing:
  STOP. AskUserQuestion で:
    question: 「Codex で 3 回失敗しました。Claude 経路に切替えますか？」
    options:
      - "Claude 経路に切替えて続行"
      - "停止してユーザーに引き渡す"
```

### B-4. Verify フェーズ

下記「共通 Verify フェーズ（DoD）」へ。

---

## 共通 Verify フェーズ（DoD: 完了の定義）

**両経路ともに以下すべてを満たすまで完了報告しない**。

### V-1. 検証コマンド（workspace 別）

| workspace       | build                                     | test                                            | typecheck                                      |
| --------------- | ----------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| packages/shared | `npm run build:shared`                    | `npm test -w @poke-dex-battle/shared`           | `npm run typecheck -w @poke-dex-battle/shared` |
| apps/web        | `npm run build -w web`                    | （未整備の場合は報告のみ）                      | （`tsc --noEmit` を web で実行）               |
| packages/db     | （migration 系は副作用注意 / 無確認禁止） | `npm test -w @poke-dex-battle/db`（存在すれば） | `npm run typecheck -w @poke-dex-battle/db`     |

### V-2. traceability.md 更新

全 Must 行・異常系行・エラー行の **実装パス**と**ステータス**を更新する（両経路共通。Codex 経路の場合も Claude が最終更新を行う）。

**更新例**:

```
| F-001 | Must | AC-001-1, AC-001-2 | packages/shared/src/utils/move-priority.test.ts | packages/shared/src/utils/move-priority.ts | Green |
```

ステータス: `Red` → `Green`。TBD 行は触らない。

### V-3. DoD チェックリスト

```
[ ] 該当機能の全テストが Green
[ ] プロジェクト全体の build が成功（npm run build:shared）
[ ] プロジェクト全体の test が全通過（npm test -w @poke-dex-battle/shared）
[ ] typecheck エラー 0（npm run typecheck -w @poke-dex-battle/shared）
[ ] traceability.md の全 Must 行のステータスが Green
[ ] TBD 行は TBD のまま（実装していないことの確認）
[ ] Should / Could に該当する実装ファイルが追加されていない
[ ] 禁止事項リストの規約違反がない（次の spec-review でも再チェックされるが、ここで予防する）
```

---

## 失敗時の挙動

### Claude 経路

```
if build / test / typecheck のいずれかが失敗:
  失敗内容を読み、原因を特定して修正
  3 回試して直らなければ STOP し、ユーザーに状況報告
  （勝手に「テストを書き換える」「any でごまかす」をしない）

if 仕様の不備に気づいた（requirements.md が曖昧 / 矛盾している）:
  STOP. ユーザーに「仕様の不備を発見。spec-define に戻ります」と伝える。
  自分で勝手に仕様を補完して実装しない。
```

### Codex 経路

| 事象                           | 検出                                       | 挙動                                                                                     |
| ------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| codex CLI 未導入               | `command -v codex` 空                      | 実装者選択フェーズで選択肢から除外。本フェーズには到達しない                             |
| 認証切れ                       | stderr に `auth`/`unauthorized`/`login`    | STOP し「`codex login` を実行してから再起動してください」                                |
| ネットワーク失敗               | stderr に `network`/`timeout`/`connection` | 最大 2 回リトライ → STOP                                                                 |
| サンドボックス書き込み拒否     | stderr に `sandbox`                        | STOP し「`.codex/config.toml` の `sandbox_writable_roots` に `$PWD` を追加してください」 |
| プロンプト過長（トークン超過） | stderr に `token`/`context too long`       | STOP し「対象テストの分割が必要です」                                                    |
| codex 出力ファイル空           | `[ ! -s "$TMP_LAST" ]`                     | STOP し「codex から空応答」                                                              |
| タイムアウト                   | `timeout` exit 124                         | STOP し「codex 実行が 10 分でタイムアウト」                                              |
| DoD 検証 3 回連続失敗          | Claude 側で再検証 NG ×3                    | AskUserQuestion で「Claude 経路に切替」「停止」を選択                                    |

---

## 完了時の出力

```
実装完了。
- 機能: <feature-slug>
- 実装者: <Claude | Codex>
  - Codex の場合: 試行回数 <N>/3
- 変更ファイル:
  - packages/<pkg>/src/.../<feature>.ts
- テスト結果: <N> passed
- build: OK
- typecheck: OK
- traceability.md: <N> 行のステータスを Green に更新

DoD 全項目クリア。

次のステップ: 「spec-review を起動して、仕様準拠 + コード規約のダブル照合レビュー」してください。
```

---

## 動作確認（リグレッション）

実装者切替の追加で既存 Claude 経路を壊していないことを確認する手順:

1. 既存の Red 状態 spec を準備（例: `.claude/specs/move-priority/`）
2. `/spec-implement` を起動 → 実装者選択で「Claude」を選ぶ → 従来通り Green 化されることを確認
3. `SPEC_SKILL_DRYRUN=1` 環境変数を立てて起動した場合、codex 呼び出し部を `echo "[dryrun] codex exec をスキップ"` に置換し、Claude 側 DoD 再検証ロジックがエラーなく動くことを確認（B-3 の `git diff` 系チェックは本物の差分が無くても完走する）

---

## 参照

- 共通スキーマ: `.claude/specs/_schema.md`
- コード規約: `.github/copilot-instructions.md`（本 skill 本文に再掲済み）
- 既存実装スタイル参考: `packages/shared/src/utils/damage-calc.ts`
- 関連 skill: `spec-define`（要件定義 / 末尾で codex 要件レビュー）/ `spec-test`（Red 生成）/ `spec-review`（Claude+Codex 並列レビュー）
