# spec-\* skill 共通スキーマ定義

要件駆動開発ハーネス（spec-define / spec-test / spec-implement / spec-review）が共通で読み書きするファイルのフォーマット仕様。**全 skill はここで定義された構造に従うこと**。

---

## 1. ID 体系

| プレフィックス | 用途                                       | 例         |
| -------------- | ------------------------------------------ | ---------- |
| `F-XXX`        | 機能要件（Must 機能）                      | `F-001`    |
| `AC-XXX-Y`     | 受け入れ条件（機能 F-XXX に紐付く Y 番目） | `AC-001-1` |
| `V-XXX-Y`      | バリデーション規則（異常系）               | `V-001-1`  |
| `E-XXX-Y`      | エラー定義（エラーケース）                 | `E-001-1`  |
| `TBD-XXX`      | 未確定事項                                 | `TBD-001`  |
| `NF-XXX`       | 非機能要件                                 | `NF-001`   |

ID は 3 桁ゼロ埋め。1 機能内で受け入れ条件が 10 を超える場合は 2 桁目を `AC-001-10` と素直に続ける。

---

## 2. `requirements.md` テンプレート

各 `.claude/specs/<feature-slug>/requirements.md` は以下の章立てを必ず持つ。空でも章は省略しない（後続 skill が章存在を前提に動く）。

```markdown
# <機能名>

## 1. 背景・目的

（なぜこの機能が必要か。誰のどんな課題を解くか）

## 2. ターゲットユーザー

（想定ユーザー像。複数いる場合は箇条書き）

## 3. 用語定義

| 用語         | 定義                                         |
| ------------ | -------------------------------------------- |
| 例: 先攻判定 | 同一ターン内で技を先に出す側を決めるロジック |

## 4. 機能一覧

| ID    | 機能                       | 分類   |
| ----- | -------------------------- | ------ |
| F-001 | 例: 技優先度比較           | Must   |
| F-002 | 例: 素早さ同値時の乱数判定 | Should |

## 5. Must 要件詳細

### F-001: <機能名>

**受け入れ条件**:

- AC-001-1: <条件>
- AC-001-2: <条件>

**入力 / 出力**:

- 入力: ...
- 出力: ...

**処理フロー**:

1. ...
2. ...

**バリデーション**:

- V-001-1: <条件> → <扱い>

**エラー定義**:

- E-001-1:
  - 条件: ...
  - メッセージ: ...
  - 再試行可否: ...
  - データ保存方針: ...

**永続化**:
（DB / localStorage / なし、など）

## 6. 非機能要件

- NF-001: <要件>

## 7. TBD（未確定事項）

- TBD-001: <未確定の論点と、保留している理由>

## 8. 決定事項（採用 / 却下した代替案）

- 採用: <案A> / 却下: <案B>（理由: ...）
```

**ルール**:

- 受け入れ条件は **テスト可能な粒度**で書く（「適切に処理する」ではなく「入力 X のとき出力 Y を返す」）。
- TBD 項目は本文で詳細化しない（曖昧さを「無いふり」しない）。
- Should / Could は `## 4. 機能一覧` に列挙するのみ。`## 5. Must 要件詳細` には書かない。

---

## 3. `traceability.md` テンプレート

全 spec-\* skill が読み書きする共通台帳。

```markdown
# Traceability: <機能名>

| 要件ID  | 種類   | 受け入れ条件       | テストパス                                      | 実装パス                                   | ステータス |
| ------- | ------ | ------------------ | ----------------------------------------------- | ------------------------------------------ | ---------- |
| F-001   | Must   | AC-001-1, AC-001-2 | packages/shared/src/utils/move-priority.test.ts | packages/shared/src/utils/move-priority.ts | Green      |
| V-001-1 | 異常系 | -                  | packages/shared/src/utils/move-priority.test.ts | packages/shared/src/utils/move-priority.ts | Green      |
| E-001-1 | エラー | -                  | packages/shared/src/utils/move-priority.test.ts | packages/shared/src/utils/move-priority.ts | Red        |
| TBD-001 | TBD    | -                  | -                                               | -                                          | TBD        |
```

**列の定義**:

| 列名         | 型     | 値の意味                                                                     |
| ------------ | ------ | ---------------------------------------------------------------------------- |
| 要件ID       | string | `F-` / `V-` / `E-` / `TBD-` / `NF-` のいずれかで始まる                       |
| 種類         | enum   | `Must` / `Should` / `Could` / `異常系` / `エラー` / `非機能` / `TBD`         |
| 受け入れ条件 | string | カンマ区切りで `AC-XXX-Y` を列挙。該当なしは `-`                             |
| テストパス   | string | リポジトリルートからの相対パス。複数行に渡る場合はカンマ区切り。未作成は `-` |
| 実装パス     | string | リポジトリルートからの相対パス。未実装は `-`                                 |
| ステータス   | enum   | `Defined` / `Red` / `Green` / `Reviewed` / `TBD`                             |

**ステータス遷移**:

```
Defined → Red → Green → Reviewed
   ↑                         |
   └─── 仕様変更 ────────────┘

TBD は単独状態（実装されない）
```

| ステータス | 設定する skill | 条件                           |
| ---------- | -------------- | ------------------------------ |
| `Defined`  | spec-define    | 要件定義のみ完了、テスト未作成 |
| `Red`      | spec-test      | 失敗テスト作成完了、未実装     |
| `Green`    | spec-implement | テスト通過、実装完了           |
| `Reviewed` | spec-review    | 仕様準拠＋規約レビュー OK      |
| `TBD`      | spec-define    | 未確定事項として保留           |

---

## 4. `review.md` テンプレート

spec-review の出力。6 章固定。**Claude / Codex 並列レビューのマージ結果**を含むため、各表に「出典」列を持つ。出典列の値は `[claude]` / `[codex]` / `[both]` のいずれか。

```markdown
# Review: <機能名>

実行日時: YYYY-MM-DD HH:MM
レビュー対象コミット: <commit hash or "uncommitted">
レビュー結果サマリ: OK <N> / 要修正 <N>
内訳: Claude <N>件 / Codex <M>件 / マージ後 <L>件（うち両者一致 <K>件）
codex 連携: <成功 / フォールバック（未導入）/ フォールバック（認証切れ）/ フォールバック（タイムアウト）/ フォールバック（フォーマット逸脱）>

## 1. 仕様準拠

| 要件ID | 受け入れ条件 | 実装該当箇所       | 判定 | 出典   | 備考 |
| ------ | ------------ | ------------------ | ---- | ------ | ---- |
| F-001  | AC-001-1     | path/to/file.ts:42 | OK   | [both] | -    |

## 2. Traceability の漏れ

- path/to/file.ts:42 / 要件 F-002 にテスト無し [claude]

## 3. TBD 逸脱

- （TBD-XXX に該当する実装が紛れ込んでいないか。各指摘の末尾に [claude]/[codex]/[both]）

## 4. スコープ逸脱

- （Should / Could が無許可で実装されていないか。各指摘の末尾に出典ラベル）

## 5. コード規約違反

| ファイル        | 行  | 違反内容           | 該当規約        | 出典   |
| --------------- | --- | ------------------ | --------------- | ------ |
| path/to/file.ts | 12  | `as Move` キャスト | as キャスト禁止 | [both] |

## 6. Conventional Commits

- コミット <hash>: <内容> [claude]

---

## 補足（主観コメント / マージ対象外）

（照合結果と分離する。本体ではない。Claude のみが出す主観メモを隔離）

## 補足: codex 生レポート（フォーマット逸脱時のみ）

（codex 出力がカテゴリ識別子を満たさずマージ不能だった場合、ここに生テキストを貼る）
```

**出典の確定ルール**（spec-review で適用）:

- マッチング キー: `(file, line_range, category)`
- 行範囲オーバーラップ判定: `[a,b]` と `[c,d]` が `a <= d && c <= b` ならマージ対象
- 完全一致 or オーバーラップ + 同一カテゴリ → `[both]`（両者の指摘文を備考でマージ）
- 片方のみ → `[claude]` または `[codex]`

**カテゴリ識別子（固定）**:

```
spec-compliance
traceability-missing-test / traceability-orphan-test / traceability-orphan-impl
tbd-violation / scope-violation
typescript-any / typescript-as-cast / typescript-non-null / typescript-enum / typescript-default-export / typescript-return-type / typescript-mutating-array / typescript-or-fallback / typescript-nest / typescript-file-length
react-class / react-style-inline / react-handler-name
comment-language
commit-prefix / commit-body-language
```

---

## 5. ファイル配置

```
.claude/specs/
├── _schema.md           # このファイル（変更しない）
└── <feature-slug>/
    ├── requirements.md
    ├── traceability.md
    └── review.md
```

`<feature-slug>` は kebab-case。例: `move-priority`、`damage-calc-critical`、`party-export-csv`。

---

## 6. skill が遵守する原則

1. **既存ファイルを尊重**: 各 skill は自分の責務範囲のみ書き換える。spec-test が `requirements.md` を書き換えてはいけない（仕様変更が必要なら STOP して `spec-define` に戻す）。
2. **ID は不変**: 一度振った要件 ID は変更しない。仕様変更でも新 ID を発番する（古い ID は `traceability.md` に `削除` ステータスで残す案もあるが、初版では単純削除可）。
3. **空欄は `-`**: 未確定値を空白にしない（パース時の曖昧さを排除）。
