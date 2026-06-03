---
name: spec-review
description: 仕様駆動コンテキスト（.claude/specs/<slug>/ が存在する）で、要件定義書（requirements.md）への準拠とコード規約（.github/copilot-instructions.md）への準拠を二軸で照合レビューする。「レビューして」「PR 前チェック」「仕様準拠確認」「spec-review」と言われたら必ず起動する。主観コメントではなく、要件 ID 単位の照合・traceability の漏れ・TBD 逸脱・スコープ逸脱・規約違反・コミットメッセージ規約、の 6 章固定で出力する。Claude（このセッション）と Codex（codex exec）の並列レビュー → マージで第二の目を担保する。Opus 4.7 の暗黙補完を後段で検出する最後の砦。
metadata:
  type: workflow
---

# spec-review — 仕様 + 規約 ダブル照合レビュー（Claude × Codex 並列）

このスキルは「実装が仕様通りか」「実装がコード規約通りか」を**機械的に**照合する。感想ではなく事実ベースのレポートを出す。

Claude（このセッション）と Codex（codex exec）が **並列で同じ 6 章観点** をレビューし、結果を 1 つの `review.md` にマージする。マッチング キーは `(file, line_range, category)`。

---

## 禁止事項（最初に読む）

- 主観的な「もっとこうした方が良い」を本体レポートに混ぜない（`## 補足` セクションに隔離）。
- 実装コードを書き換えない（指摘するだけ）。
- `requirements.md` / `traceability.md` を書き換えない。
- 「OK っぽい」を OK と書かない。**根拠（ファイルパスと行番号）を必ず添える**。
- 規約違反の検出を「軽微だから」とスキップしない。
- codex のフォーマット逸脱出力を「だいたい合ってる」でマージしない（マージ不能なら `## 補足: codex 生レポート` に隔離する）。

---

## 前提条件チェック

```
if not exists(.claude/specs/<feature-slug>/requirements.md):
  STOP. 「spec-define が完了していません」

if not exists(.claude/specs/<feature-slug>/traceability.md):
  STOP. 「spec-test が完了していません」

# traceability.md の Must 行に未埋め項目があるか
for each Must / 異常系 / エラー 行:
  if テストパス == '-' or 実装パス == '-':
    レポート冒頭の「2. Traceability の漏れ」章に列挙
    （STOP はしない。レビュー継続。漏れがあること自体が指摘事項）

# codex 疎通確認
CODEX_AVAILABLE=true
run: command -v codex
  → 空文字: CODEX_AVAILABLE=false（フォールバック理由: "未導入"）
run: codex --version
  → exit !=0: CODEX_AVAILABLE=false（フォールバック理由: "認証 / 起動失敗"）
```

CODEX_AVAILABLE=false の場合は Claude 単独レビューで完走（フォールバック）。`review.md` の出典は全て `[claude]`、ヘッダの「codex 連携」欄にフォールバック理由を明記する。

settings.json の `permissions.allow` に以下が必要:

```
"Bash(codex exec:*)",
"Bash(codex --version)",
"Bash(command -v codex)",
"Bash(git diff:*)",
"Bash(git log:*)"
```

---

## 検査軸（6 章固定。Claude / Codex 両方とも同じ観点を独立に実施）

### 1. 仕様準拠 — `category: spec-compliance`

各 Must 要件の **受け入れ条件（AC-xxx-x）** が実装で満たされているかを照合。

**Claude 側手順**:

```
for each AC-xxx-x in requirements.md:
  該当する it() を test ファイルから検索（it 説明文に [AC-xxx-x] が埋まっているはず）
  そのテストが Green か（npx vitest run -w <pkg> で確認）
  実装ファイル内の該当ロジックを Read で確認
  判定 = OK / 要修正
```

### 2. Traceability の漏れ — `category: traceability-missing-test` / `traceability-orphan-test` / `traceability-orphan-impl`

```
for each 行 in traceability.md:
  if 要件 ID にテストパスが無い:
    category: traceability-missing-test
  if test ファイル内に要件 ID 紐付けの無い it() がある:
    category: traceability-orphan-test
  if 実装ファイルに traceability にない関数が追加されている:
    category: traceability-orphan-impl
```

### 3. TBD 逸脱 — `category: tbd-violation`

```
for each TBD-XXX in requirements.md:
  TBD の論点に該当する実装コードが存在しないか grep
  存在すれば「TBD-XXX が無断で実装されている」と指摘
```

### 4. スコープ逸脱 — `category: scope-violation`

```
for each Should / Could in requirements.md の機能一覧:
  該当機能が実装されているか grep
  実装されていれば「Should/Could 機能 F-XXX が許可なく実装されている」と指摘
```

### 5. コード規約違反 — `category: typescript-* / react-* / comment-language`

`.github/copilot-instructions.md` の規約に基づき、変更ファイル全行を機械的にチェック。

| 違反                             | 検出パターン                                  | category 識別子             |
| -------------------------------- | --------------------------------------------- | --------------------------- | -------------------------------- | ------------------------ |
| `any` 型                         | `: any\b` / `<any>` / `as any`                | `typescript-any`            |
| `as` キャスト（`as const` 除く） | `\bas [A-Z]`                                  | `typescript-as-cast`        |
| `!` non-null assertion           | `\w+!\.` / `\w+!;` / `\w+!\[`                 | `typescript-non-null`       |
| `enum` 宣言                      | `^enum \w+` / `^export enum`                  | `typescript-enum`           |
| default export                   | `^export default`                             | `typescript-default-export` |
| 戻り値型未明示                   | 関数定義 `function ...)` の後 `: ` が無い     | `typescript-return-type`    |
| 破壊的配列メソッド               | `\.push\(` `\.splice\(` `\.pop\(` `\.shift\(` | `typescript-mutating-array` |
| `                                |                                               | ` フォールバック            | `\|\| ['"]` `\|\| 0` `\|\| null` | `typescript-or-fallback` |
| ネスト 4 階層以上                | インデント手動カウント                        | `typescript-nest`           |
| ファイル 300 行超                | `wc -l`                                       | `typescript-file-length`    |
| クラスコンポーネント             | `class \w+ extends (React\.)?Component`       | `react-class`               |
| インラインスタイル               | `style=\{\{`                                  | `react-style-inline`        |
| ハンドラ命名                     | `const on\w+ = ` （`handle` 始まりでない）    | `react-handler-name`        |
| 英語コメント                     | `// [A-Za-z]` （URL / コード片以外）          | `comment-language`          |

**注意**: 機械検出は false positive がある。`as const` は `typescript-as-cast` の対象外（許可されている）。grep ヒット後は人間判断（spec-review 起動中の Claude / codex）で確認する。

### 6. Conventional Commits — `category: commit-prefix / commit-body-language`

```
run: git log <base>..HEAD --format=%H%n%s%n%b
for each コミットメッセージ:
  プレフィックスが英語 Conventional Commits 形式か
    （feat: / fix: / chore: / refactor: / test: / docs: / build: / ci: / perf: / style: / revert:）
    違反 → category: commit-prefix
  本文が日本語か
    違反 → category: commit-body-language
```

`<base>` はデフォルトで `main`。ユーザーが指定すれば従う。

---

## 手順

### Step 1: 差分準備

```bash
FEATURE_SLUG="<feature-slug>"
BASE_REF="${BASE_REF:-main}"
TMP_DIFF="/tmp/codex-review-diff-${FEATURE_SLUG}-$(date +%s).patch"
TMP_LOG="/tmp/codex-review-log-${FEATURE_SLUG}-$(date +%s).txt"
TMP_LAST="/tmp/codex-review-${FEATURE_SLUG}-$(date +%s).md"

git diff "${BASE_REF}..HEAD" > "$TMP_DIFF"
git log "${BASE_REF}..HEAD" --format='%H%n%s%n%b%n---END---' > "$TMP_LOG"
```

### Step 2: 並列レビュー実行

Claude 側は 6 章観点で grep / Read を進める。同時に codex を `&` でバックグラウンド起動し、両者完了後にマージへ進む。

#### Step 2-A: Claude 側レビュー

上記「検査軸（6 章固定）」を Claude が直接実行。出力は **後述の中間 JSON ライク形式** で内部に保持（最終マージ用）。

#### Step 2-B: codex exec 起動

`-s read-only` でファイル読み取りのみ。`<<CODEX_PROMPT`（クォートなし）で bash 変数を展開する。本文中の バッククォートと `$` は展開を防ぐ目的でエスケープする。

```bash
timeout 600 codex exec \
  -C "$PWD" \
  -s read-only \
  --color never \
  -o "$TMP_LAST" \
  - <<CODEX_PROMPT &
あなたはコードレビュアーです。日本語で回答してください。

## 入力（自分で Read してください）

- 要件定義: \`.claude/specs/${FEATURE_SLUG}/requirements.md\`
- トレーサビリティ: \`.claude/specs/${FEATURE_SLUG}/traceability.md\`
- 共通スキーマ: \`.claude/specs/_schema.md\`
- コード規約: \`.github/copilot-instructions.md\`
- 変更差分: \`${TMP_DIFF}\`（git diff ${BASE_REF}..HEAD の出力）
- コミット履歴: \`${TMP_LOG}\`

read-only サンドボックスで起動しています。ファイル編集・git 操作・コマンド副作用は一切行わないでください。

## レビュー観点（6 章固定）

### 1. 仕様準拠 — category: spec-compliance
- 各 Must 要件 (F-XXX) の受け入れ条件 (AC-XXX-Y) が実装と紐付き、テストが Green か照合
- 該当する it() の説明文に [AC-XXX-Y] が埋まっているか
- 実装ファイル内の該当ロジックを読み、AC の要求を満たしているか

### 2. Traceability の漏れ — category: traceability-missing-test / traceability-orphan-test / traceability-orphan-impl
- traceability.md で「テストパス」「実装パス」が \`-\` のままの行
- テストファイル内の it() で要件 ID が紐付かないもの
- 実装ファイルで traceability.md に列挙されていない関数が新規追加されている

### 3. TBD 逸脱 — category: tbd-violation
- requirements.md の TBD-XXX に該当する実装が紛れ込んでいないか

### 4. スコープ逸脱 — category: scope-violation
- requirements.md の Should / Could 機能 (Must でないもの) が無断で実装されていないか

### 5. コード規約違反 — category: typescript-* / react-* / comment-language
\`.github/copilot-instructions.md\` に基づき、差分の全行を機械的にチェック。

| 違反 | 検出パターン | category |
|------|-------------|----------|
| any 型 | \`: any\\b\` / \`<any>\` / \`as any\` | typescript-any |
| as キャスト (as const 除く) | \`\\bas [A-Z]\` | typescript-as-cast |
| ! non-null assertion | \`\\w+!\\.\` / \`\\w+!;\` / \`\\w+!\\[\` | typescript-non-null |
| enum 宣言 | \`^enum \\w+\` / \`^export enum\` | typescript-enum |
| default export | \`^export default\` | typescript-default-export |
| 戻り値型未明示 | 関数定義 \`function ...)\` の後 \`: \` が無い | typescript-return-type |
| 破壊的配列メソッド | \`.push(\` \`.splice(\` \`.pop(\` \`.shift(\` | typescript-mutating-array |
| || フォールバック | \`|| ['\"]\` / \`|| 0\` / \`|| null\` | typescript-or-fallback |
| ネスト 4 階層以上 | インデント手動カウント | typescript-nest |
| ファイル 300 行超 | wc -l | typescript-file-length |
| クラスコンポーネント | \`class \\w+ extends (React\\.)?Component\` | react-class |
| インラインスタイル | \`style={{\` | react-style-inline |
| ハンドラ命名 (handle 始まりでない) | \`const on\\w+ = \` | react-handler-name |
| 英語コメント (URL/コード片除く) | \`// [A-Za-z]\` | comment-language |

### 6. Conventional Commits — category: commit-prefix / commit-body-language
- コミットメッセージのプレフィックスが英語 Conventional Commits 形式か
  （feat: / fix: / chore: / refactor: / test: / docs: / build: / ci: / perf: / style: / revert:）
- 本文が日本語か

## 出力フォーマット（厳守）

以下の Markdown を **そのまま** 出力してください。各指摘行は「ファイルパス:行範囲」と「category」を必ず含めること（マージ判定のキーになる）。

\`\`\`markdown
# Review (codex): <機能名>

実行日時: YYYY-MM-DD HH:MM
レビュー対象コミット: <BASE_REF..HEAD の最新 hash>

## 1. 仕様準拠
| 要件ID | 受け入れ条件 | 実装該当箇所 | 判定 | category | 備考 |
|--------|--------------|--------------|------|---------|------|
| F-001  | AC-001-1     | packages/shared/src/utils/move-priority.ts:8 | OK | spec-compliance | - |

## 2. Traceability の漏れ
- packages/shared/src/utils/move-priority.ts:42 / category: traceability-missing-test / 要件 F-002 にテスト無し

## 3. TBD 逸脱
- 該当なし

## 4. スコープ逸脱
- 該当なし

## 5. コード規約違反
| ファイル | 行 | category | 違反内容 | 該当規約 |
|---------|-----|---------|---------|---------|
| packages/shared/src/utils/move-priority.ts | 12 | typescript-as-cast | \`as Move\` キャスト | as キャスト禁止 |

## 6. Conventional Commits
- コミット <hash> / category: commit-prefix / プレフィックスが日本語

## サマリ
- 要修正: <N> 件
- OK: <N> 件
\`\`\`

**重要**:
- 各指摘は「ファイルパス + 行範囲 + category」をマージキーにします
- ファイルパスはリポジトリルートからの相対パス
- 行範囲は単一行なら \`12\`、複数行なら \`12-18\`
- category は上記表の固定値から選ぶこと（捏造禁止）
- 要件 ID は requirements.md に存在する ID のみ参照すること（捏造禁止）
CODEX_PROMPT
CODEX_PID=$!
```

#### Step 2-C: codex 完了待ち

```bash
wait $CODEX_PID
CODEX_EXIT=$?
```

### Step 3: マージ処理

両者の指摘を 1 つの `review.md` に統合する。

```
キー: (file, line_range, category)
行範囲オーバーラップ判定: [a,b] と [c,d] が a <= d && c <= b

for each cf in claude_findings:
  match = None
  for each cdx in codex_findings (まだ used でないもの):
    if cf.file == cdx.file and cf.category == cdx.category and ranges_overlap(cf.line_range, cdx.line_range):
      match = cdx
      break
  if match:
    merged.append({...cf, label: "[both]", codex_note: match.note})
    used.add(match)
  else:
    merged.append({...cf, label: "[claude]"})

for each cdx in codex_findings:
  if cdx not in used:
    merged.append({...cdx, label: "[codex]"})
```

### Step 4: codex フォーマット逸脱時の取り扱い

- codex が指定した表ヘッダ / category 識別子を満たさない出力を返した場合:
  - **マージ不能**として codex 側を全件破棄
  - `review.md` 末尾の `## 補足: codex 生レポート` 章に生テキストを貼り付け
  - ヘッダの「codex 連携」欄を「フォールバック（フォーマット逸脱）」とする
  - サマリの「Codex 件数」は 0 とカウント

### Step 5: review.md 出力

`.claude/specs/<feature-slug>/review.md` を `_schema.md` の「4. review.md テンプレート」に厳密に従って書く。各表に **出典列**（`[claude]` / `[codex]` / `[both]`）を必ず含める。

ヘッダ例:

```markdown
# Review: <機能名>

実行日時: 2026-MM-DD HH:MM
レビュー対象コミット: <commit hash or "uncommitted">
レビュー結果サマリ: OK <N> / 要修正 <N>
内訳: Claude <N>件 / Codex <M>件 / マージ後 <L>件（うち両者一致 <K>件）
codex 連携: <成功 / フォールバック（未導入）/ フォールバック（認証切れ）/ フォールバック（タイムアウト）/ フォールバック（フォーマット逸脱）>
```

### Step 6: traceability.md の Reviewed 遷移

```
if マージ後の「要修正」総数 == 0:
  全 Must 行のステータスを Green → Reviewed に更新
else:
  ステータスは Green のまま据え置き
  review.md 内に「未 Reviewed: マージ後の要修正 <N> 件のため」と記す
```

---

## マージ判定の動作確認例（3 ケース）

実装が壊れていないかを確認するための擬似入出力例。

### ケース 1: 完全一致 → `[both]`

```
claude: file=foo.ts line=12 category=typescript-as-cast note="as Move キャスト"
codex:  file=foo.ts line=12 category=typescript-as-cast note="型キャストを使用"
→ merged: file=foo.ts line=12 category=typescript-as-cast label=[both]
   note="as Move キャスト" / codex_note="型キャストを使用"
```

### ケース 2: オーバーラップ + 同カテゴリ → `[both]`

```
claude: file=foo.ts line=12-15 category=typescript-nest note="if のネストが 4 階層"
codex:  file=foo.ts line=14    category=typescript-nest note="ネスト深すぎ"
→ ranges_overlap([12,15], [14,14]) = true
→ merged: label=[both]
```

### ケース 3: ファイルは同じだがカテゴリ違い → 別件

```
claude: file=foo.ts line=12 category=typescript-as-cast
codex:  file=foo.ts line=12 category=typescript-any
→ category 不一致なのでマージしない
→ merged: 2 件、それぞれ label=[claude] / [codex]
```

---

## エラーハンドリング（フォールバック方針）

| 事象                                                 | 検出                                       | 挙動                                                                                       |
| ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| codex CLI 未導入                                     | `command -v codex` 空                      | Claude 単独で完走。出典は全て `[claude]`。ヘッダに「codex 連携: フォールバック（未導入）」 |
| 認証切れ                                             | stderr に `auth`/`unauthorized`/`login`    | Claude 単独で完走。「フォールバック（認証切れ）」                                          |
| ネットワーク失敗                                     | stderr に `network`/`timeout`/`connection` | 最大 2 回リトライ → フォールバック                                                         |
| タイムアウト                                         | bash `timeout` exit 124                    | フォールバック（タイムアウト）                                                             |
| codex 出力ファイル空                                 | `[ ! -s "$TMP_LAST" ]`                     | フォールバック（空応答）                                                                   |
| フォーマット逸脱（表ヘッダ欠如 / category 不明など） | Claude 側パース失敗                        | Step 4 参照（codex 生レポートを `## 補足` に隔離）                                         |

**重要**: spec-define / spec-implement と異なり、spec-review は codex 不在でも **完走可能**（Claude 単独でも本来の責務を果たせるため）。

---

## 完了時の出力

```
レビュー完了。
- 機能: <feature-slug>
- レポート: .claude/specs/<feature-slug>/review.md
- 内訳: Claude <N>件 / Codex <M>件 / マージ後 <L>件（うち両者一致 <K>件）
- サマリ: OK <N> / 要修正 <N>
- traceability.md ステータス: <Reviewed に更新 / Green のまま据え置き>
- codex 連携: <成功 / フォールバック（理由）>

要修正項目（要修正がある場合のみ列挙、出典ラベル付き）:
- <要件ID or ファイル:行> [label]: <内容>

次のステップ:
- 要修正あり: 「spec-implement に戻り、指摘事項を修正してから再度 spec-review」
- 全 OK: 「コミット → PR 作成」（Conventional Commits の英語プレフィックス、本文は日本語）
```

---

## 動作確認

- `SPEC_SKILL_DRYRUN=1` 環境変数で起動された場合は codex 呼び出しを `echo "[dryrun] codex exec をスキップ"` に置換し、Claude 単独でレビューが完走することを確認（出典は全て `[claude]`、codex 連携欄は「フォールバック（dryrun）」）

---

## 参照

- 共通スキーマ: `.claude/specs/_schema.md`
- コード規約: `.github/copilot-instructions.md`
- 関連 skill: `spec-define`（要件定義 + codex 要件レビュー）/ `spec-test`（Red 生成）/ `spec-implement`（実装者 Claude/Codex 選択）
