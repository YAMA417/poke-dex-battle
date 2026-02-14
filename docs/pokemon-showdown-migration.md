# Pokemon Data Integration: PokeAPI → pokemon-showdown 移行設計

## Context

現在、ポケモンデータの取得はクライアント側からPokeAPI（外部HTTP API）を直接呼び出している。これにはレート制限リスク、ネットワーク遅延、ランタイム依存という課題がある。`pokemon-showdown` パッケージを導入し、ビルド時にデータをJSON抽出することで、外部APIへの依存を排除し、高速・安定なデータアクセスを実現する。

## 設計判断とベストプラクティス

### 1. API配置先: Next.js Route Handlers（推奨）

**理由:**
- ポケモンデータは読み取り専用の静的データ → Honoの担うステートフルCRUD（auth/parties/battles）とは責務が異なる
- 同一オリジン → CORS設定不要
- Next.jsの組み込みキャッシュ（ISR/static）を活用可能
- データ提供のために追加サーバー不要

### 2. ビルド時JSON抽出: 初回から実施（推奨）

**理由:**
- `pokemon-showdown` は巨大パッケージ（バトルシミュレータ全体を含む）→ プロダクションバンドルに含めるべきでない
- `devDependencies` にすることでプロダクション依存から排除
- 静的JSONはファイル読み込みのみ → Dex初期化のオーバーヘッドなし
- プロジェクトに既存パターンあり（name-map JSONの事前生成）

### 3. 既存PokeAPIコード: 完全削除

---

## 構成

```
[新規]
scripts/
  extract-showdown-data.ts          ビルド時にpokemon-showdown Dex(gen9)から静的JSONを生成

packages/shared/src/
  data/showdown/
    species.json                    全ポケモン種族データ（生成物、git管理対象外）
    moves.json                      全技データ（生成物）
    items.json                      全アイテムデータ（生成物）
    learnsets.json                  全習得技データ（生成物）
  types/
    showdown.ts                     抽出JSONの型定義（ShowdownSpecies, ShowdownMove等）
  services/
    pokemon-service.ts              species.jsonからポケモンデータを検索・変換
    move-service.ts                 moves.json + learnsets.jsonから技データを検索・変換
    item-service.ts                 items.jsonからアイテムデータを検索・変換

apps/web/app/api/
  pokemon/[name]/
    route.ts                        GET /api/pokemon/:name → PokemonSpeciesData
    learnset/route.ts               GET /api/pokemon/:name/learnset → string[]
  move/[name]/
    route.ts                        GET /api/move/:name → MoveData
  item/[name]/
    route.ts                        GET /api/item/:name → ItemData

[変更]
packages/shared/src/index.ts        エクスポート変更（pokeapi削除、services追加）
packages/shared/package.json        dexie削除、pokemon-showdown devDep追加
apps/web/hooks/usePokemonSearch.ts  fetch先を /api/pokemon/:name に変更
apps/web/hooks/useMoveSearch.ts     fetch先を /api/move/:name に変更
apps/web/hooks/useItemSearch.ts     fetch先を /api/item/:name に変更
apps/web/hooks/useAbilitySearch.ts  fetch先を /api/pokemon/:name に統合（abilities含む）
root package.json                   extract:showdown スクリプト追加

[保持]
packages/shared/src/data/pokemon-name-map.json    日本語名マップ（マージ元として使用）
packages/shared/src/data/move-name-map.json       日本語名マップ
packages/shared/src/data/ability-name-map.json    日本語名マップ
packages/shared/src/data/item-name-map.json       日本語名マップ
packages/shared/src/utils/*-name-resolver.ts      名前解決（インターフェース変更なし）
packages/shared/src/utils/damage-calc/            ダメージ計算（PokeAPI非依存、変更不要）
packages/shared/src/constants/                    定数（変更不要）

[削除]
packages/shared/src/api/pokeapi.ts                PokeAPI fetch関数
packages/shared/src/api/transform.ts              PokeAPIレスポンス変換
packages/shared/src/api/generate-pokemon-map.ts   PokeAPIからの名前マップ生成
packages/shared/src/api/generate-move-map.ts      同上
packages/shared/src/api/generate-ability-map.ts   同上
packages/shared/src/api/list-sv-items.ts          SVアイテムリスト（PokeAPI依存）
packages/shared/src/api/test.ts                   PokeAPIテスト
packages/shared/src/cache/pokemon-cache.ts        IndexedDBキャッシュ（Dexie）
packages/shared/src/types/pokeapi.ts              PokeAPIレスポンス型（※アプリ内部型は移動後に削除）

[型移動] pokeapi.ts → pokemon-data.ts
packages/shared/src/types/pokemon-data.ts         新設。以下のアプリ内部型を pokeapi.ts から移動:
  - PokemonSpeciesData                             サービス層の戻り値型、UI全体で使用
  - MoveData                                       同上
  - AbilityData                                    同上
  - ItemData                                       同上
  - TypeEffectiveness                              同上
  ※ PokeApi* レスポンス型（PokeApiPokemonResponse等）は移動せず削除
  ※ types/index.ts の re-export を pokemon-data.ts に差し替え
```

---

## コンポーネント設計

### 1. scripts/extract-showdown-data.ts

**目的**: ビルド時に `pokemon-showdown` の Gen9 Dex から必要フィールドのみを抽出し、静的JSONファイルを生成する。

**公開インターフェース**:
- `extractShowdownData(): Promise<void>` — メインエントリ（CLIから直接実行）

**処理手順**:
1. `Dex.mod('gen9')` でGen9インスタンスを生成
2. 既存の日本語名マップJSON（`pokemon-name-map.json` 等）を読み込み
3. `dex.species.all()` をループし、`exists === true` のもののみ抽出:
   - id, name, num, types, baseStats, abilities, weightkg, heightm
   - 日本語名マップから `nameJa` をマージ（name/idで突合、不一致は英語名フォールバック）
4. `dex.moves.all()` をループし同様に抽出:
   - id, name, num, type, category, basePower, accuracy, pp, priority, target
   - 日本語名マップから `nameJa` をマージ
5. `dex.items.all()` をループし同様に抽出:
   - id, name, num, desc, shortDesc
   - 日本語名マップから `nameJa` をマージ
6. 各ポケモンの `learnset` を取得し、技ID配列として保存
7. `packages/shared/src/data/showdown/` に4つのJSONファイルを書き出し
8. 抽出件数をコンソールに出力

---

### 2. packages/shared/src/types/showdown.ts

**目的**: 抽出JSONのTypeScript型定義

**型定義**:

| 型名 | フィールド |
|------|-----------|
| `ShowdownSpecies` | `id: string`, `num: number`, `name: string`, `nameJa: string`, `types: PokemonType[]`, `baseStats: Stats`, `abilities: { 0: string; 1?: string; H?: string }`, `weightkg: number`, `heightm: number` |
| `ShowdownMove` | `id: string`, `num: number`, `name: string`, `nameJa: string`, `type: PokemonType`, `category: MoveCategory`, `basePower: number`, `accuracy: number \| true`, `pp: number`, `priority: number`, `target: string` |
| `ShowdownItem` | `id: string`, `num: number`, `name: string`, `nameJa: string`, `desc: string`, `shortDesc: string` |
| `ShowdownLearnsetEntry` | `{ learnset: Record<string, string[]> }` |

---

### 3. packages/shared/src/services/pokemon-service.ts

**目的**: species.json からポケモンデータを検索し、`PokemonSpeciesData` 型で返す

**公開インターフェース**:

| 関数 | 引数 | 戻り値 |
|------|------|--------|
| `getPokemonByName(name: string)` | name: 英語名またはShowdown ID | `PokemonSpeciesData \| null` |
| `searchPokemon(query: string)` | query: 部分一致クエリ | `PokemonSpeciesData[]` |
| `getAllPokemonNames()` | なし | `Array<{ id: string; name: string; nameJa: string }>` |

**処理手順** (`getPokemonByName`):
1. species.json をインポート（モジュールキャッシュで1回のみ読み込み）
2. 入力を小文字化・正規化してShowdown ID形式にする
3. IDでJSONを検索
4. 見つからない場合、name resolverで英語名→IDに変換して再検索
5. `ShowdownSpecies` → `PokemonSpeciesData` に変換:
   - `baseStats` のキー名変換（hp/atk/def/spa/spd/spe → hp/attack/defense/specialAttack/specialDefense/speed）
   - `abilities` を配列に展開
   - `spriteUrl` は `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{num}.png` で構築
6. 見つからない場合 `null` を返す

---

### 4. packages/shared/src/services/move-service.ts

**目的**: moves.json + learnsets.json から技データを検索

**公開インターフェース**:

| 関数 | 引数 | 戻り値 |
|------|------|--------|
| `getMoveByName(name: string)` | name: 英語名またはShowdown ID | `MoveData \| null` |
| `getLearnset(pokemonName: string)` | pokemonName: ポケモン名 | `string[]`（技ID配列） |
| `getAllMoveNames()` | なし | `Array<{ id: string; name: string; nameJa: string }>` |

**処理手順** (`getMoveByName`):
1. moves.json をインポート
2. 入力を正規化してShowdown ID形式にする
3. IDで検索、見つからなければ move resolver で変換して再検索
4. `ShowdownMove` → `MoveData` に変換:
   - `accuracy: true` → `null`（必中技）
5. 見つからない場合 `null` を返す

**処理手順** (`getLearnset`):
1. learnsets.json をインポート
2. ポケモン名をShowdown IDに変換
3. 該当ポケモンのlearnsetオブジェクトからキー（技ID）を配列として返す
4. 見つからない場合空配列を返す

---

### 5. packages/shared/src/services/item-service.ts

**目的**: items.json からアイテムデータを検索

**公開インターフェース**:

| 関数 | 引数 | 戻り値 |
|------|------|--------|
| `getItemByName(name: string)` | name: 英語名またはShowdown ID | `ItemData \| null` |
| `getAllItemNames()` | なし | `Array<{ id: string; name: string; nameJa: string }>` |

**処理手順**: move-service と同パターン

---

### 6. Next.js Route Handlers（4ファイル共通パターン）

**目的**: クライアントからのデータ取得エンドポイント

**共通パターン**:

| エンドポイント | サービス関数 |
|---------------|-------------|
| `GET /api/pokemon/[name]` | `getPokemonByName(name)` |
| `GET /api/pokemon/[name]/learnset` | `getLearnset(name)` |
| `GET /api/move/[name]` | `getMoveByName(name)` |
| `GET /api/item/[name]` | `getItemByName(name)` |

**処理手順**（全エンドポイント共通）:
1. `params.name` を取得（URLデコード）
2. 対応するサービス関数を呼び出し
3. データあり → `Response.json(data)` ステータス200
4. データなし → `Response.json({ error: "Not found" })` ステータス404
5. 例外 → `Response.json({ error: message })` ステータス500

---

### 7. Hooks変更（usePokemonSearch.ts 等）

**変更方針**: fetch先URLのみ変更。デバウンス・ローディング・エラー管理のロジックは維持。

**変更点**:
- `resolvePokemonName()` + `fetchPokemon()` + `fetchPokemonSpecies()` → `fetch('/api/pokemon/' + encodeURIComponent(name))`
- `fetchMove()` → `fetch('/api/move/' + encodeURIComponent(name))`
- `fetchItem()` → `fetch('/api/item/' + encodeURIComponent(name))`
- 名前解決はサーバー側（service層）で実行されるため、クライアント側での resolver 呼び出しは不要

---

### 8. 日本語名の扱い

- `pokemon-showdown` は英語名のみ
- 既存の `*-name-map.json` を日本語名のマスターデータとして保持
- `extract-showdown-data.ts` 実行時に、Showdownデータと既存マップをname/idで突合してマージ
- name resolver のインターフェースは変更なし（内部データソースが同じJSONのため）

---

### 9. 影響を受けないファイル

- `packages/shared/src/utils/damage-calc/` — CalcPokemon/CalcMove型はPokeAPI非依存
- `packages/shared/src/constants/` — TYPE_EFFECTIVENESS等は独立定義
- `backend/api/` — Honoバックエンドは変更なし
- `apps/web/components/damage-calc/` — ダメージ計算UIはサービス層経由に間接的に依存するが、型は変更なし

---

## damage-calc-refactoring-design.md との関係

本設計は [damage-calc-refactoring-design.md](damage-calc-refactoring-design.md) と以下の関係がある。

### 影響なし（独立）
- ダメージ計算ロジック全体（`utils/damage-calc/`）— `CalcPokemon`, `CalcMove`, `BattleContext` はPokeAPI非依存
- 定数（`constants/types.ts`）— 両設計から参照されるが変更なし

### 要注意: `index.ts` エクスポート変更
両設計とも `packages/shared/src/index.ts` を変更する:
- damage-calc設計: `export * from "./utils/damage-calc"` 追加（実装済み）
- 本設計: `export * from "./api/pokeapi"` 削除、`export * from "./services/*"` 追加

衝突はしないが、実装時に既存のdamage-calcエクスポートを壊さないこと。

### 要注意: `types/pokeapi.ts` → `types/pokemon-data.ts` 移動
`pokeapi.ts` 内のアプリ内部型（`PokemonSpeciesData` 等）は damage-calc では直接使用していないが、`types/index.ts` の re-export 構造に影響する。`types/index.ts` で `pokemon-data.ts` を re-export すること。

---

## npm scripts

```
root package.json:
  "extract:showdown": "tsx scripts/extract-showdown-data.ts"
  "prebuild": "npm run extract:showdown"

packages/shared/package.json:
  devDependencies に pokemon-showdown 追加
  dependencies から dexie 削除
```

`.gitignore` に `packages/shared/src/data/showdown/` を追加（生成物のため）

---

## 検証手順

1. `npm run extract:showdown` を実行 → `data/showdown/*.json` が生成されることを確認
2. JSONの件数確認（species: ~1000+, moves: ~900+, items: ~200+）
3. `npm run build:shared` → 共有パッケージのビルド成功を確認
4. `npm run dev:frontend` → Next.js起動
5. ブラウザで `/api/pokemon/garchomp` にアクセス → 正しいJSONレスポンス
6. ブラウザで `/api/pokemon/ガブリアス` にアクセス → 日本語名でも検索可能
7. ブラウザで `/api/pokemon/invalid` にアクセス → 404エラー
8. ダメージ計算画面でポケモン名を入力 → データが正しく表示される
9. `npm run build` → プロダクションビルド成功（pokemon-showdownがバンドルに含まれないこと）
