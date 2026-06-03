---
name: spec-define
description: 曖昧なアイデアを対話ヒアリングで要件定義書に落とし込む。「機能を追加したい」「実装前に要件を整理したい」「仕様を書きたい」「要件定義」「spec を書いて」と言われたら必ず起動する。新機能・大きな機能追加・複数ファイルにまたがる変更・受け入れ条件が曖昧な依頼でも積極的に呼ぶ。typo 修正・1行リファクタなど自明な変更には使わない。Opus 4.7 は暗黙補完を避ける性質があるため、実装に入る前に要件定義書を作っておくと後続 skill（spec-test / spec-implement / spec-review）が安定する。
metadata:
  type: workflow
---

# spec-define — 要件駆動サイクルの最上流

このスキルは「やりたいこと」を **テスト可能な受け入れ条件付きの要件定義書** に変換する。後続の spec-test / spec-implement / spec-review はここで作られた `requirements.md` と `traceability.md` を読む。

---

## 禁止事項（最初に読む）

- 曖昧表現を放置しない。「適切に処理する」「いい感じに」「必要なら」は **必ず深掘りする**（後述）。
- Should / Could 機能を `## 5. Must 要件詳細` に書かない（Must だけ詳細化する）。
- 未確定事項を本文に紛れ込ませない（`## 7. TBD` セクションに必ず分離）。
- 後続 skill（spec-test 等）の責務に踏み込まない（テストは書かない、実装はしない）。
- 既存の `requirements.md` を勝手に上書きしない（存在する場合は冒頭で確認）。
- 要件 ID は一度振ったら変更しない。

---

## 前提条件チェック

```
if user が機能スラグ（kebab-case の機能名）を提示していない:
  ヒアリングの一番最初に「機能スラグは何にしますか？（例: move-priority）」と聞く

if .claude/specs/<feature-slug>/requirements.md が既に存在:
  ユーザーに「上書き / 追記 / 別スラグで作成」を確認してから進める

# Step 8（codex 要件レビュー）は必須フェーズ。codex が呼べないと skill が完走しない
run: command -v codex
  → 空文字: STOP. 「codex CLI が未導入です。`npm i -g @openai/codex` で導入し `codex login` で認証後に再実行してください」
run: codex --version
  → exit !=0: STOP. 「codex のバージョン取得に失敗。`codex doctor` を実行してください」
```

settings.json の `permissions.allow` に以下が無い場合は事前追加が必要:

```
"Bash(codex exec:*)",
"Bash(codex --version)",
"Bash(command -v codex)"
```

---

## 手順（7 ステップヒアリング）

記事「Claude Opus 4.7と要件駆動開発」のフローを基準にする。**1 ステップずつユーザーと往復**する。バッチで全部聞かない。

### ステップ 1: 背景・目的

- なぜこの機能が必要か
- 誰のどんな課題を解くか
- 何ができるようになるとゴールか

### ステップ 2: ターゲットユーザー

- 想定ユーザー像（プレイヤー / 開発者 / 内部運用、など）
- 利用シーン

### ステップ 3: 機能洗い出し（Must / Should / Could 分類）

- 「最低限必要な機能（Must）」「あると嬉しい（Should）」「将来検討（Could）」を分けて列挙
- この段階では粒度が粗くて OK。次のステップで Must だけ深掘りする。

### ステップ 4: Must 要件の詳細化（**最重要ステップ**）

各 Must 機能について以下を全て確定させる。曖昧な回答が返ってきたら **その場で深掘り質問** を投げる。

**深掘りパターン**:
| ユーザー回答 | 深掘り質問 |
|--------------|-----------|
| 「適切にエラーを出す」 | 「どの条件で発生しますか？ メッセージ文言は？ ユーザーは次にどう動けますか？ 再試行可能ですか？ 失敗時に部分的なデータ保存はしますか？」 |
| 「画面に表示する」 | 「どの画面のどこに、どのデザインで表示しますか？ 表示順序の規則は？ 件数上限は？」 |
| 「保存する」 | 「どこに保存しますか？（DB / localStorage / メモリ）スキーマは？ 同時編集の扱いは？」 |
| 「バリデーションする」 | 「どの入力に対し、どの条件を満たさないとき、どのメッセージを返しますか？」 |

**確定させる項目**:

| 項目           | 内容                                                            |
| -------------- | --------------------------------------------------------------- |
| 要求仕様 ID    | `F-001` `F-002` ...                                             |
| 受け入れ条件   | `AC-001-1: 入力 X のとき出力 Y を返す` のようにテスト可能粒度で |
| 入力 / 出力    | 型と例を明記                                                    |
| 処理フロー     | 番号付き手順                                                    |
| バリデーション | `V-001-1: 入力が null のとき XxxError を投げる`                 |
| エラー定義     | `E-001-1: 条件 / メッセージ / 再試行可否 / データ保存方針`      |
| 永続化         | 場所 / スキーマ / 同時編集ポリシー                              |

### ステップ 5: 非機能要件

- パフォーマンス（応答時間、計算量）
- アクセシビリティ
- ブラウザ対応
- 国際化（このプロジェクトは日本語のみで OK か）
- セキュリティ
- `NF-001` のように ID を振る

### ステップ 6: 未確定事項 TBD の分離

- ステップ 1〜5 で「決まらなかったこと」「保留にした論点」を `TBD-001` 形式で全て吐き出す
- TBD は後続 skill に **絶対に推測実装させない** ためのフラグ。明示することが大事。

### ステップ 7: 用語定義

- 機能内で使う独自用語を `## 3. 用語定義` に列挙
- Opus 4.7 は暗黙補完しないので、用語の揺れがあると後続のテスト生成が破綻する

---

## 成果物

### 1. `.claude/specs/<feature-slug>/requirements.md`

`_schema.md` の「2. requirements.md テンプレート」に厳密に従う。**章番号と章タイトルを変更しない**（後続 skill が章存在を前提に読む）。

### 2. `.claude/specs/<feature-slug>/traceability.md`

スキーマ（`_schema.md` の「3. traceability.md テンプレート」）に従う。この skill では以下のみ埋める:

| 要件ID  | 種類   | 受け入れ条件       | テストパス | 実装パス | ステータス |
| ------- | ------ | ------------------ | ---------- | -------- | ---------- |
| F-001   | Must   | AC-001-1, AC-001-2 | -          | -        | Defined    |
| V-001-1 | 異常系 | -                  | -          | -        | Defined    |
| TBD-001 | TBD    | -                  | -          | -        | TBD        |

テストパス / 実装パスは `-`、ステータスは `Defined` または `TBD` のみ。

---

## ステップ 8: codex による要件レビュー（必須）

`requirements.md` / `traceability.md` を生成し終えた後、**codex に第二の目として要件レビューさせる**。Claude（このセッション）はヒアリングと記述を担当し、codex は固定 6 観点で機械的に照合する役割分担。

### 8-1. codex exec 起動

````bash
FEATURE_SLUG="<feature-slug>"
TMP_LAST="/tmp/codex-define-${FEATURE_SLUG}-$(date +%s).md"
OUT_PATH=".claude/specs/${FEATURE_SLUG}/requirements-review-codex.md"

timeout 300 codex exec \
  -C "$PWD" \
  -s read-only \
  --color never \
  -o "$TMP_LAST" \
  - <<'CODEX_PROMPT'
あなたは要件定義レビュアーです。日本語で回答してください。

## 入力（自分で Read してください）

- 要件定義: `.claude/specs/${FEATURE_SLUG}/requirements.md`
- トレーサビリティ: `.claude/specs/${FEATURE_SLUG}/traceability.md`
- 共通スキーマ: `.claude/specs/_schema.md`
- コード規約: `.github/copilot-instructions.md`

read-only サンドボックスで起動しています。ファイル書き込み・編集・git 操作は一切しないでください。

## レビュー観点（6 軸固定）

1. **曖昧表現の残存**
   - 「適切」「いい感じ」「必要に応じて」「うまく」「柔軟に」「適切なエラー」などのワードが本文に残っていないか
   - 該当した場合は具体化の提案を添える
2. **Must AC の SMART 評価**
   - Specific（対象が明確か）
   - Measurable（観測・検証可能か）
   - Achievable（実装可能か）
   - Relevant（要件と整合するか）
   - Time-bound（応答時間や期限などが明示されているか）
   - 5 観点それぞれを OK / 要修正 で評価
3. **Should / Could の優先度妥当性**
   - Must に紛れ込んでいる Should/Could
   - Could に降格すべき Should
   - Must に昇格すべき Should
4. **TBD として分離すべき項目の見落とし**
   - 本文中で曖昧なまま記述されていて、TBD-XXX として切り出すべきもの
5. **用語定義の漏れ・矛盾**
   - `## 3. 用語定義` に未掲載で本文中に登場する独自用語
   - 同一用語が文脈で揺れている箇所
6. **受け入れ条件の機械的検証可能性**
   - vitest の expect 1 行で書けるか
   - 書けないなら「入力例 / 出力例 / 比較方法」を補足する提案を添える

## 出力フォーマット

以下の Markdown を **そのまま** 出力してください。冒頭・末尾に余計な解説を入れないでください。

```markdown
# Requirements Review (codex): <機能名>

実行日時: YYYY-MM-DD HH:MM
レビュー対象: .claude/specs/${FEATURE_SLUG}/requirements.md

## 1. 曖昧表現の残存
| 該当箇所 | 該当語 | 判定 | 提案 |
|---------|--------|------|------|
| 行 NN / AC-XXX-Y | 「適切」 | 要修正 | 「入力 X のとき Y を返す」に具体化 |

## 2. Must AC の SMART 評価
| 要件ID | AC | S | M | A | R | T | 総合 | 提案 |
|--------|----|---|---|---|---|---|------|------|
| F-001 | AC-001-1 | OK | OK | OK | OK | 要修正 | 要修正 | 応答時間の閾値を明記 |

## 3. Should / Could 優先度
| 要件ID | 現在の分類 | 推奨分類 | 理由 |
|--------|-----------|----------|------|
| F-005 | Must | Should | コア機能に依存しない |

## 4. TBD 分離漏れ
| 該当箇所 | 内容 | TBD 候補ID | 理由 |
|---------|------|-----------|------|
| 行 NN | 「同時編集時の挙動は未確定」 | TBD-00X | 仕様未決のため実装不能 |

## 5. 用語定義の漏れ・矛盾
| 用語 | 状況 | 提案 |
|------|------|------|
| 「先攻判定」 | 未掲載 | `## 3. 用語定義` に追加 |

## 6. 受け入れ条件の機械的検証可能性
| AC | 検証可能性 | 提案 |
|----|-----------|------|
| AC-001-1 | OK | - |
| AC-002-1 | 要修正 | 入力例 `{ a: 1 }` 出力例 `{ b: 2 }` の追記を推奨 |

## サマリ
- OK: <N> 件
- 要修正: <N> 件
- 提案: <N> 件
````

各表で該当なしの場合は「該当なし」と 1 行だけ書くこと。テーブルヘッダを省略しないこと。
要件 ID は requirements.md に存在する ID のみ参照すること（捏造禁止）。
CODEX_PROMPT

````

**注**: `<<'CODEX_PROMPT'`（シングルクォート）で heredoc を囲んでいるため、`${FEATURE_SLUG}` は **bash で展開されず文字列としてそのまま codex に渡る**。codex 側で文字列を見てファイルパスを組み立てる。

### 8-2. codex 出力の取り込み

```bash
if [ ! -s "$TMP_LAST" ]; then
  echo "codex から空応答を受領。STOP します。"
  exit 1
fi
# Claude は $TMP_LAST を Read で取得し、Write で $OUT_PATH に保存する
````

### 8-3. エラーハンドリング

| 事象                                                           | 挙動                                               |
| -------------------------------------------------------------- | -------------------------------------------------- |
| codex CLI 未導入                                               | 前提条件チェックで STOP 済み（ここまで到達しない） |
| 認証切れ（stderr に `auth`/`unauthorized`/`login`）            | STOP. 「`codex login` を実行してください」         |
| ネットワーク失敗（stderr に `network`/`timeout`/`connection`） | 最大 2 回リトライ → STOP                           |
| トークン超過（stderr に `token`/`context too long`）           | STOP. 「要件定義の分割を検討してください」         |
| codex 出力ファイル空                                           | STOP. 「codex から空応答」                         |
| タイムアウト（exit 124）                                       | STOP. 「codex 実行が 5 分でタイムアウト」          |

Step 8 は **必須フェーズ** のため、失敗時は半端な状態（requirements.md だけ生成されてレビュー無し）で完了報告しない。エラー時は「requirements.md / traceability.md は生成済み。codex 復旧後に再度 spec-define を実行するか、Step 8 のみ手動で codex に走らせてください」と案内する。

---

## 完了時の出力

ユーザーに以下を伝える:

```
要件定義完了。
- requirements.md: .claude/specs/<feature-slug>/requirements.md
- traceability.md: .claude/specs/<feature-slug>/traceability.md
- codex レビュー: .claude/specs/<feature-slug>/requirements-review-codex.md
  - OK: <N> 件 / 要修正: <N> 件 / 提案: <N> 件
- 機能数: Must <N>件 / Should <N>件 / Could <N>件
- TBD: <N>件

次のステップ:
- codex 指摘の「要修正」が 0 件: 「spec-test を起動して、受け入れ条件から失敗テストを生成」してください。
- 要修正 1 件以上: requirements.md を反映してから spec-test に進んでください（spec-define を再実行するか、部分修正で進めるかはユーザー判断）。
```

TBD 件数が多い場合（5 件以上）は「TBD が多いので、実装前に追加ヒアリングを推奨」と明示的に警告する。

---

## 動作確認

- `SPEC_SKILL_DRYRUN=1` 環境変数で起動された場合は Step 8 の codex 呼び出しをスキップし、`requirements-review-codex.md` の代わりに「[dryrun] codex 呼び出しをスキップしました」と書かれたプレースホルダを出力する（ヒアリング〜成果物生成までのフローが壊れていないことを確認する用）。

---

## 参照

- 共通スキーマ: `.claude/specs/_schema.md`
- 元記事: [Claude Opus 4.7と要件駆動開発](https://zenn.dev/yamk/articles/opus-47-requirements-driven)
- 関連 skill: `spec-test`（Red 生成）/ `spec-implement`（実装者を Claude/Codex から選択）/ `spec-review`（Claude+Codex 並列レビュー）
