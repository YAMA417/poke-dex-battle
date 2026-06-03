---
name: spec-test
description: 要件定義書（requirements.md）の受け入れ条件から vitest の失敗テスト（Red）を生成する。「テスト書いて」「Red を書いて」「失敗テストから」「TDD で始めて」「spec-test」と言われたら必ず起動する。spec-define が完了した直後に呼ぶのが想定フロー。実装コードは絶対に書かず、テストファイルと最小スタブのみ作る。Opus 4.7 が暗黙補完で実装してしまうのを防ぐためにテストフェーズを物理的に分離している。
metadata:
  type: workflow
---

# spec-test — TDD の Red 担当

このスキルは `requirements.md` の受け入れ条件 (`AC-xxx-x`) / バリデーション (`V-xxx-x`) / エラー (`E-xxx-x`) を 1 対 1 で **失敗するテスト** に変換する。実装は次の skill (`spec-implement`) の責務。

---

## 禁止事項（最初に読む）

- **実装ロジックを書かない**。テストを Green にするための実コードは絶対に書かない。
- スタブ（型と空関数）は OK だが、戻り値を「テストが偶然通る値」にしない。例: `return 0` でテストが通ってしまうなら `throw new Error('not implemented')` にする。
- `requirements.md` に存在しない要件 ID をテストに登場させない。
- TBD 項目に対するテストを書かない（実装対象外）。
- Should / Could 機能のテストを書かない（Must のみ）。
- `requirements.md` を書き換えない（曖昧で書けない箇所があれば STOP して spec-define に戻す）。
- TypeScript 規約違反:
  - `any` 禁止 → `unknown` + 型ガード
  - `as` キャスト禁止
  - `!`（non-null assertion）禁止
  - 関数の戻り値型は明示

---

## 前提条件チェック

```
if not exists(.claude/specs/<feature-slug>/requirements.md):
  STOP. ユーザーに「spec-define を先に起動してください」と伝える。

if requirements.md に受け入れ条件 AC-xxx-x が 1 つも無い:
  STOP. ユーザーに「受け入れ条件が空です。spec-define に戻ってください」と伝える。

if not exists(.claude/specs/<feature-slug>/traceability.md):
  STOP. spec-define で初期化されていない。
```

---

## 手順

### 1. 対象 workspace のテストランナーを検出

`requirements.md` の対象モジュールから、テストを置く workspace を決定する。

```
if 対象が packages/shared/...:
  ランナー = vitest
  実行コマンド = npx vitest run -w packages/shared -- <path>
  ファイル拡張子 = .test.ts

elif 対象が apps/web/...:
  ユーザーに「web 側はテストランナーが未整備です。
   何を使いますか？（Playwright / RTL+vitest / 手動確認）」と確認。
  確認できるまで STOP。

elif 対象が packages/db/...:
  drizzle のスキーマ変更は migration 検証になる。
  ユーザーに「DB スキーマ変更ですか？ migration 生成も含めますか？」と確認。
  確認できるまで STOP。

else:
  ユーザーに対象 workspace を確認。
```

このプロジェクトで現状もっとも素直に動くのは **packages/shared + vitest**。

### 2. 失敗テスト生成

**原則**: 受け入れ条件 1 つ = 1 `it()`。

**describe 構造**:

```typescript
describe('<機能名>', () => {
  describe('正常系', () => {
    it('[AC-001-1] 入力 X のとき出力 Y を返す', () => { ... });
    it('[AC-001-2] ...', () => { ... });
  });

  describe('異常系', () => {
    it('[V-001-1] 入力が null のとき XxxError を投げる', () => { ... });
  });

  describe('エラーケース', () => {
    it('[E-001-1] ネットワーク失敗時に NetworkError を投げる', () => { ... });
  });
});
```

**重要ルール**:

- `it()` の説明文の **冒頭に必ず要件 ID を `[AC-001-1]` 形式で埋め込む**（spec-review が grep で照合する）
- 1 つの `it()` で複数の `expect` を書くのは OK だが、テスト対象の責務は 1 つに絞る
- `toBeCloseTo` など適切なアサーションを使う（プロジェクト既存の damage-calc.test.ts を参考）

### 3. スタブ作成

実装ファイルがまだ無い場合、最小スタブを作る。

```typescript
// packages/shared/src/utils/move-priority.ts
export function compareMovePriority(a: Move, b: Move): number {
  throw new Error('not implemented');
}
```

- 型は明示する（戻り値型も）
- 中身は `throw new Error('not implemented')` 固定（テストが偶然通らないように）
- このスタブは spec-implement で本実装に置き換えられる

### 4. Red 確認（**必須**）

テストを実行して **すべて失敗していること**を確認する。

```bash
npx vitest run -w packages/shared -- <test-path>
```

```
if 全てのテストが失敗:
  OK。traceability.md 更新へ進む。

if 一部が pass:
  そのテストはアサーションが弱い（自明な真）か、既に実装が存在する。
  ユーザーに該当テストを示して「期待値が緩いか、既存実装があります。確認してください」と伝える。

if テストが実行エラー（import 失敗など）:
  スタブの import path が間違っている。修正してから再度実行。
```

### 5. traceability.md 更新

各テストに対して `traceability.md` の対応行を埋める。

**更新前**:

```
| F-001 | Must | AC-001-1, AC-001-2 | - | - | Defined |
```

**更新後**:

```
| F-001 | Must | AC-001-1, AC-001-2 | packages/shared/src/utils/move-priority.test.ts | packages/shared/src/utils/move-priority.ts | Red |
```

- テストパス・実装パス（スタブの場所）を埋める
- ステータスを `Defined` → `Red` に変更
- TBD 行はそのまま（変更しない）

---

## 成果物

1. **テストファイル**: `packages/<pkg>/src/**/<feature>.test.ts`
2. **スタブ実装ファイル**: `packages/<pkg>/src/**/<feature>.ts`（throw のみ）
3. **traceability.md 更新**: テストパス / 実装パス / ステータス `Red`

---

## 完了時の出力

```
Red 生成完了。
- テストファイル: packages/<pkg>/src/.../<feature>.test.ts (<N> ケース)
- スタブ: packages/<pkg>/src/.../<feature>.ts
- 実行結果: <N> failed (全件 Red 確認 OK)
- traceability.md: <N> 行のステータスを Red に更新

次のステップ: 「spec-implement を起動して、Red を Green にする実装」してください。
```

---

## 参照

- 共通スキーマ: `.claude/specs/_schema.md`
- テストスタイル参考: `packages/shared/src/utils/damage-calc.test.ts`
- vitest 公式: https://vitest.dev/
