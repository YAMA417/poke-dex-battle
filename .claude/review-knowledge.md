# レビューナレッジ

このファイルはセルフレビュー・PRレビューで発見された繰り返しやすい問題パターンを蓄積する。
evaluator エージェントがレビュー時に自動参照する。

## アクセシビリティ

### [A-01] button に type="button"

- 対象: form 外含む全 button 要素
- 見落としやすい: EVスロットトグル、Autocomplete listbox 内オプション
- チェック: `<button` を列挙 → `type="button"` 確認

### [A-02] label の htmlFor と id の対応

- 対象: `<label>` と対の全インタラクティブ要素
- 見落としやすい: Autocomplete など native input でないカスタムコンポーネント
- 補足: Autocomplete は `...props` で `id` を Input に渡す

### [A-03] aria-label に具体的コンテキスト

- 対象: リスト内の繰り返しボタン等
- NG: `aria-label="技を削除"` → OK: ``aria-label={`${move.nameJa}を削除`}``

### [A-04] Autocomplete に aria-label

- placeholder はアクセシブルな名前にならない
- 例: `<Autocomplete aria-label="技スロット 1" />`

### [A-05] icon-only ボタンに aria-label

- 対象: MoreVertical, Trash2, Copy 等のアイコンのみボタン
- チェック: `<button` の子にテキストノードがないものを特定

### [A-06] 素の HTML label は htmlFor+id 必須

- shadcn Label+Input なら省略可だが素の HTML タグでは必須

### [A-07] pointer-events-none だけでは無効化が不完全

- 対象: メガシンカ中のフォーム要素ロック等、CSS のみで操作を防いでいる箇所
- 見落としやすい: キーボード操作（Tab→Enter）で入力可能なまま残る、スクリーンリーダーに無効状態が伝わらない
- チェック: `pointer-events-none` を grep → `aria-disabled="true"` または `disabled` 属性が併設されているか確認

### [A-08] 複数インスタンスで id が衝突する固定 ID

- 対象: aria-controls / id をハードコードしているコンポーネント
- 見落としやすい: 単体では動くがリスト内で複数レンダリングされると同一 id が DOM に複数出現する
- チェック: `id="` をハードコードしている箇所を grep → 複数インスタンスの可能性があれば `React.useId()` に置き換え

## React

### [R-01] useEffect の依存配列と stale closure

- 対象: useEffect 内で state/props を参照するコールバック
- 見落としやすい: イベントリスナー登録系で外側の state を参照しているが依存配列に含めていない
- チェック: useEffect のコールバック内で参照している変数が依存配列に全て含まれているか確認

## ダメージ計算

### [D-01] 半減実の特殊ケース

- チランのみ (Chilan Berry / Normal) は `typeEffectiveness > 1` が成立しない
- 修正: `typeEffectiveness > 1 || resistBerryType === 'Normal'`

### [D-02] ランク変化の変数名

- NG: `ignoreAttackBoosts`（プラスのみ無視に読める）
- OK: `ignoreAttackStages`（全ランク変化を無視する意図が明確）

### [D-03] ポケモンゲーム仕様の閾値・倍率ハードコード

- 対象: ダメージ計算・回復量・発動条件等のゲーム仕様値
- 見落としやすい: 世代間で変更された仕様値（例: 混乱実の発動条件 Gen6以前 1/2 → Gen7+ 1/4）。ネット上の古い情報を参照すると誤った値を実装する
- チェック: HP割合の閾値（1/2, 1/3, 1/4等）や倍率を含むコードを確認 → Bulbapedia 等の公式ソースで Gen 9 の最新仕様と照合

## コード構造

### [S-01] 攻撃側/防御側コンポーネントのロジック重複

- 対象: AttackerInput.tsx / DefenderInput.tsx のメガシンカ・ゲンシカイキ等フォーム変形ロジック
- 見落としやすい: 片方だけ修正してもう片方を忘れる
- チェック: buildMegaData, handleMegaToggle 等のロジックが両ファイルに同一パターンで存在する場合、カスタムフックへの抽出を検討

### [S-02] ハードコードされた色クラス（ダークモード非対応）

- 対象: border-gray-200, bg-gray-50, text-gray-800 等の生カラークラス
- 見落としやすい: ライトモードでは問題なく見えるがダークモードで壊れる
- チェック: `gray-` `amber-` `red-` 等の色クラスを grep → セマンティックトークン（border-border, bg-muted, text-foreground 等）に置き換え可能か確認

### [S-03] splice による配列短縮とスロット番号のズレ

- 対象: 固定長スロット（技4枠、パーティ6枠等）から要素を削除する処理
- 見落としやすい: `splice(slot, 1)` は配列を詰めるため、後続スロットの番号が1つ前にずれる。固定スロット UI（`[0,1,2,3].map`）と組み合わせると意図しない位置に技が表示される
- チェック: スロット削除が `splice` か `arr[slot] = undefined` か確認 → UI がスロット番号固定なら後者を使う

### [S-04] カテゴリアイコン等の小コンポーネント重複

- 対象: MoveCategoryIcon / CategoryIcon のように同一ロジックが複数ファイルに存在するヘルパー
- 見落としやすい: 新しいコンポーネントで同じマッピングを再実装してしまう
- チェック: `Swords` `Sparkles` `ShieldHalf` のインポートが複数ファイルにある場合、共通化を検討

### [S-05] discriminated union の switch 内で `as any` キャスト

- 対象: discriminated union 型を switch/case で処理する関数
- 見落としやすい: union 型のバリアントごとのプロパティ（flag, type, types 等）にアクセスする際、switch 文内なら TypeScript が自動 narrowing するのに `as any` を使ってしまう
- チェック: `as any` を grep → switch の case 内であれば narrowing で除去可能か確認

### [S-06] 型定義と実データの condition 値の不整合

- 対象: JSONB カラムに格納される discriminated union（damageEffect 等）
- 見落としやすい: JSON データファイルに新しい condition 値を追加したが、TypeScript の union 型定義に追加し忘れる。`as any` で回避すると不整合が隠蔽される
- チェック: JSON データ内の condition 値を列挙 → 対応する TypeScript union 型のバリアントが全て定義されているか確認

### [S-07] slug → name 移行時の変数名・コメント残存

- 対象: slug カラム削除後のリファクタリング
- 見落としやすい: 変数名（pokemonSlug, regulationSlug）やコメント内の "slug" が残存する
- チェック: `slug` を grep → 変数名・コメントが実態（name/id ベース）と一致するか確認

### [S-08] useEffect 分割時の ref 間接依存と eslint-disable

- 対象: useEffect を複数に分割し、ref 経由で値を共有するパターン
- 見落としやすい: useEffect A で ref を更新し useEffect B で参照する設計は、実行順序への暗黙の依存がある。eslint-disable で依存配列の警告を抑制すると、将来の変更で stale closure バグを導入しやすい
- チェック: `eslint-disable-next-line react-hooks/exhaustive-deps` を grep → ref 経由の間接依存が安全であることのコメントが付いているか確認。useEffect 間の実行順序前提を明記しているか確認

### [S-09] 設定のみで参照されない ref（デッドコード予備軍）

- 対象: useRef で宣言し `.current =` で更新しているが、読み取り箇所がない ref
- 見落としやすい: 将来使う意図で宣言したが実装が追いつかず放置される。レビューで「使われている」と思い込みやすい
- チェック: ref の `.current =` を grep → 同じ ref の `.current` を読み取る箇所が存在するか確認

### [S-10] 死コード除去後のコメント内用語残存

- 対象: 変数・state を削除した後のコメント
- 見落としやすい: コードは削除されるがコメント内の旧用語（IV, slug 等）がそのまま残る。変数名の grep では検出できない
- チェック: 削除した概念のキーワードでコメントを含めて grep → コメント内に旧用語が残っていないか確認

### [S-11] Link (a) 要素の不正なネスト

- 対象: カード全体をクリッカブルにする際に `<Link>` で wrap し、内部にもメニュー用 `<Link>` がある構成
- 見落としやすい: `e.stopPropagation()` でイベントは制御できるが、HTML 仕様上 `<a>` 内に `<a>` はネスト不可。ブラウザによってはDOM ツリーが再構成される
- チェック: `<Link` の中に `<Link` がネストされていないか確認 → 内部リンクは `<button>` + `router.push()` に変更

### [S-12] 用語統一リファクタリング時のコンポーネント名・ファイル名の取り残し

- 対象: 概念レベルの用語変更（EV→能力ポイント等）でプロパティ名・内部変数はリネームしたが、コンポーネント名やファイル名が旧名のまま
- 見落としやすい: import/export 名とファイル名が不一致になっても TypeScript は通る。内部の props 名との矛盾に気づきにくい
- チェック: リネーム対象の旧用語でファイル名・export 名を grep → 新用語に統一されているか確認
