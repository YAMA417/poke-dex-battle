# ポケモンダブルバトル支援アプリ 要件定義書

## 📋 プロジェクト概要

### プロジェクト名

ポケモンダブルバトル支援アプリ（仮称）

### 目的

- ポケモンダブルバトルにおけるパーティ管理、ダメージ計算、対戦履歴管理を統合的に支援
- チャンピオンズリーグなどから始める初心者〜中級者向けの便利ツール
- モダンな技術スタックでの開発経験・学習

### 対象ユーザー

- チャンピオンズリーグなどから始めるダブルバトル初心者
- ダブルバトルに少し触れたことがある中級者
- パーティ構築や対戦分析を効率化したいプレイヤー

### 対象ゲーム

- **現在**: ポケモン スカーレット・バイオレット
- **将来**: ポケモンチャンピオンズ（発売後アップデート対応）

---

## 🎯 機能要件

### 必須機能（優先度: 高）

#### 1. パーティ登録機能

ポケモンの詳細情報を管理し、複数のパーティを保存・編集できる機能

**管理項目**:

- パーティ情報
  - パーティ名
  - 作成日時・更新日時
  - レギュレーション（SV、チャンピオンズなど）
  - メモ（任意）

- ポケモン情報（1パーティにつき最大6匹）
  - 種族名
  - ニックネーム（任意）
  - レベル（デフォルト: 50）
  - 性別
  - 性格（25種類）
  - 特性（通常特性、隠れ特性）
  - テラスタイプ（18タイプ）
  - 持ち物
  - 個体値（HP/攻撃/防御/特攻/特防/素早さ: 0-31）
  - 努力値（HP/攻撃/防御/特攻/特防/素早さ: 0-252、合計510まで）
  - 技構成（4つ）
  - 実数値の自動計算表示

**CRUD操作**:

- パーティの新規作成
- パーティの編集
- パーティの削除
- パーティの複製
- パーティ一覧表示

**バリデーション**:

- 努力値の合計が510以下であることを確認
- 各ステータスの努力値が252以下であることを確認
- 技の重複チェック（警告表示）

**データ出力**:

- JSON形式でのエクスポート
- JSON形式でのインポート（バックアップ・復元用）

---

#### 2. ダメージ計算機能

ダブルバトル特有の要素を考慮した詳細なダメージ計算

**基本計算**:

- ポケモンの攻撃技による与ダメージ計算
- 被ダメージ計算
- 乱数を考慮した最小〜最大ダメージ表示
- 確定数表示（○○%で○発）

**ダブルバトル特有要素**:

- 全体技の威力減衰（×0.75）
- てだすけ効果（×1.5）
- フレンドガード効果（×0.75）
- いかく、威嚇などの能力ランク変動（±6段階）
- ひらいしん、よびみずなどの特性による無効化・吸引

**環境要素**:

- 天候効果
  - 晴れ（炎技1.5倍、水技0.5倍）
  - 雨（水技1.5倍、炎技0.5倍）
  - 砂嵐（岩タイプ特防1.5倍）
  - 雪（氷タイプ防御1.5倍）
- フィールド効果
  - エレキフィールド
  - グラスフィールド
  - サイコフィールド
  - ミストフィールド
- 壁・リフレクター、ひかりのかべ

**その他要素**:

- タイプ一致補正（×1.5 or ×2.0 適応力）
- タイプ相性（×0、×0.25、×0.5、×1、×2、×4）
- テラスタル時の補正
- 急所補正
- アイテム補正（命の珠、こだわりハチマキなど）

**UI要素**:

- 攻撃側ポケモン選択
- 防御側ポケモン選択
- 技選択
- 状況設定（天候、フィールド、サポート技など）
- 計算結果のリアルタイム表示

---

#### 3. 対戦履歴管理機能

過去の対戦データを記録・管理し、統計情報を表示する機能

**記録項目**:

- 対戦基本情報
  - 対戦日時
  - 対戦形式（ランクマッチ、カジュアル、大会、フレンド戦など）
  - 勝敗（勝ち/負け/引き分け）
  - 使用パーティ（登録済みパーティへの参照）
  - 選出ポケモン（3〜4匹）
  - メモ・振り返り（任意）

- 相手情報（任意）
  - 相手パーティのポケモン（種族のみでも可）
  - 相手の選出ポケモン
  - 印象的だった動き・戦術

- 動画情報
  - **Phase 1**: ローカル動画ファイルへの参照（mp4, mov等）
  - **Phase 2**: Supabase Storageへのアップロード
  - 動画のサムネイル表示（自動生成）

**機能**:

- 対戦記録の新規作成
- 対戦記録の編集
- 対戦記録の削除
- 動画ファイルの選択・保存（Expo Document Picker使用）
- 動画のプレビュー・再生（Expo AV使用）

**フィルタ・検索**:

- 日付範囲での絞り込み
- 勝敗での絞り込み
- 使用パーティでの絞り込み
- 対戦形式での絞り込み
- キーワード検索（メモ欄）

**統計表示**:

- 全体勝率
- パーティごとの勝率
- ポケモンごとの選出率・勝率
- 期間ごとの勝率推移（グラフ）
- よく対面するポケモンランキング

---

### 追加機能（優先度: 中）

#### 4. パーティ構築支援機能

パーティのバランスをチェックし、改善点を提案

**機能**:

- タイプ相性チェック（弱点の可視化）
- 役割分担の確認（物理アタッカー、特殊アタッカー、サポートなど）
- 素早さ順の表示
- 弱点カバー分析
- おすすめポケモン提案（弱点を補えるポケモン）

#### 5. データベース・図鑑機能

ポケモン、技、特性、持ち物の情報検索

**機能**:

- ポケモン図鑑（種族値、タイプ、特性一覧）
- 技検索（タイプ、威力、効果で検索）
- 特性検索（効果説明）
- 持ち物検索（効果説明）
- お気に入り登録

---

## 🏗️ 技術要件

### システム構成

```
┌─────────────────────────────────────┐
│   Frontend (Expo / React Native)    │
│   - Expo SDK 52+                    │
│   - Expo Router (File-based routing)│
│   - React Native Paper / NativeWind │
└──────────────┬──────────────────────┘
               │
               │ Phase 1: ローカルストレージ
               │ Phase 2: REST API
               │
┌──────────────▼──────────────────────┐
│       Backend API (Hono)            │
│   - Cloudflare Workers              │
│   - Hono Framework                  │
└──────────────┬──────────────────────┘
               │
               │ Phase 2〜
               │
┌──────────────▼──────────────────────┐
│          Supabase                   │
│   - PostgreSQL (Database)           │
│   - Supabase Auth (認証)            │
│   - Supabase Storage (動画保存)      │
└─────────────────────────────────────┘

External API: PokéAPI (ポケモンマスターデータ)
```

### フロントエンド（モバイルアプリ）

**フレームワーク**:

- **Expo** (SDK 52以上)
- **React Native**
- **Expo Router** (ファイルベースルーティング)

**主要ライブラリ**:

- **UI**: React Native Paper or NativeWind (Tailwind CSS for React Native)
- **状態管理**: Zustand or Jotai
- **フォーム**: React Hook Form
- **ローカルDB**: Expo SQLite (Phase 1)
- **ストレージ**: @react-native-async-storage/async-storage
- **動画選択**: expo-document-picker
- **動画再生**: expo-av
- **データ取得**: TanStack Query (React Query)
- **HTTP Client**: Axios or Fetch API

**開発環境**:

- **実機テスト**: Expo Go アプリ
- **Android**: エミュレータ（Windows）
- **iOS**: 実機（iPhone）

### バックエンド（API）

**フレームワーク**:

- **Hono** (高速軽量Webフレームワーク)

**デプロイ先**:

- **Cloudflare Workers** (エッジコンピューティング)

**認証**:

- Phase 1: なし
- Phase 2: Supabase Auth連携

**API設計**:

- RESTful API
- エンドポイント例:

  ```
  GET    /api/parties          # パーティ一覧取得
  POST   /api/parties          # パーティ作成
  GET    /api/parties/:id      # パーティ詳細取得
  PUT    /api/parties/:id      # パーティ更新
  DELETE /api/parties/:id      # パーティ削除

  GET    /api/battles          # 対戦履歴一覧
  POST   /api/battles          # 対戦記録作成
  GET    /api/battles/stats    # 統計情報取得

  POST   /api/damage-calc      # ダメージ計算
  ```

### データベース

**Phase 1**:

- Expo SQLite（ローカルDB）
- AsyncStorage（設定値など軽量データ）

**Phase 2以降**:

- **Supabase PostgreSQL**
  - パーティデータ
  - 対戦履歴データ
  - ユーザーデータ
- **Supabase Storage**
  - 対戦動画ファイル

### 外部API

**PokéAPI** (https://pokeapi.co/)

- ポケモンの種族値データ
- 技データ
- 特性データ
- タイプ相性データ

**データキャッシュ戦略**:

- 初回起動時にマスターデータをダウンロード
- ローカルに保存（SQLite）
- 定期的に更新チェック

---

## 📁 プロジェクト構成（モノレポ）

```
poke-dex-battle/
├── README.md
├── requirements.md                 # 本ドキュメント
├── package.json                    # ルートpackage.json (workspace設定)
├── .gitignore
│
├── apps/
│   └── mobile/                     # Expoアプリ
│       ├── app/                    # Expo Router (ファイルベースルーティング)
│       │   ├── (tabs)/            # タブナビゲーション
│       │   │   ├── index.tsx      # ホーム画面
│       │   │   ├── parties.tsx    # パーティ一覧
│       │   │   ├── calc.tsx       # ダメージ計算
│       │   │   └── battles.tsx    # 対戦履歴
│       │   ├── party/
│       │   │   ├── [id].tsx       # パーティ詳細
│       │   │   └── edit.tsx       # パーティ編集
│       │   ├── battle/
│       │   │   ├── [id].tsx       # 対戦詳細
│       │   │   └── new.tsx        # 対戦記録追加
│       │   └── _layout.tsx        # ルートレイアウト
│       ├── components/             # UIコンポーネント
│       │   ├── party/
│       │   ├── pokemon/
│       │   ├── calc/
│       │   └── battle/
│       ├── hooks/                  # カスタムフック
│       ├── utils/                  # ユーティリティ関数
│       ├── constants/              # 定数定義
│       ├── assets/                 # 画像・フォントなど
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                     # 共通ロジック（モバイル・バックエンド共通）
│   │   ├── src/
│   │   │   ├── types/             # TypeScript型定義
│   │   │   │   ├── pokemon.ts
│   │   │   │   ├── party.ts
│   │   │   │   ├── battle.ts
│   │   │   │   └── calc.ts
│   │   │   ├── utils/             # 共通ユーティリティ
│   │   │   │   ├── damage-calc.ts # ダメージ計算ロジック
│   │   │   │   ├── stat-calc.ts   # 実数値計算
│   │   │   │   └── validation.ts  # バリデーション
│   │   │   └── constants/         # 定数（タイプ相性など）
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api-client/                 # APIクライアント（Phase 2〜）
│       ├── src/
│       │   ├── client.ts
│       │   └── endpoints/
│       ├── package.json
│       └── tsconfig.json
│
└── backend/
    └── hono-api/                   # Hono API（Phase 2〜）
        ├── src/
        │   ├── index.ts           # エントリーポイント
        │   ├── routes/
        │   │   ├── parties.ts
        │   │   ├── battles.ts
        │   │   └── calc.ts
        │   ├── middleware/
        │   │   └── auth.ts
        │   └── db/
        │       └── supabase.ts
        ├── wrangler.toml           # Cloudflare Workers設定
        ├── package.json
        └── tsconfig.json
```

---

## 📊 データモデル

### Party（パーティ）

```typescript
interface Party {
  id: string; // UUID
  name: string; // パーティ名
  regulation: 'SV' | 'Champions'; // レギュレーション
  memo?: string; // メモ
  pokemons: Pokemon[]; // ポケモン配列（最大6）
  createdAt: Date;
  updatedAt: Date;
}
```

### Pokemon（ポケモン）

```typescript
interface Pokemon {
  id: string; // UUID
  speciesId: number; // 種族ID（PokéAPI参照）
  speciesName: string; // 種族名（例: ピカチュウ）
  nickname?: string; // ニックネーム
  level: number; // レベル（通常50）
  gender?: 'male' | 'female' | 'unknown';
  nature: Nature; // 性格
  ability: string; // 特性
  teraType: Type; // テラスタイプ
  item?: string; // 持ち物
  ivs: Stats; // 個体値
  evs: Stats; // 努力値
  moves: Move[]; // 技（最大4）
  actualStats?: Stats; // 実数値（計算値）
}

interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

type Nature =
  | 'Hardy'
  | 'Lonely'
  | 'Brave'
  | 'Adamant'
  | 'Naughty'
  | 'Bold'
  | 'Docile'
  | 'Relaxed'
  | 'Impish'
  | 'Lax'
  | 'Timid'
  | 'Hasty'
  | 'Serious'
  | 'Jolly'
  | 'Naive'
  | 'Modest'
  | 'Mild'
  | 'Quiet'
  | 'Bashful'
  | 'Rash'
  | 'Calm'
  | 'Gentle'
  | 'Sassy'
  | 'Careful'
  | 'Quirky';

type Type =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Electric'
  | 'Grass'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy';

interface Move {
  id: number; // 技ID
  name: string; // 技名
  type: Type; // タイプ
  category: 'Physical' | 'Special' | 'Status';
  power?: number; // 威力
  accuracy?: number; // 命中率
  pp: number; // PP
}
```

### Battle（対戦記録）

```typescript
interface Battle {
  id: string; // UUID
  date: Date; // 対戦日時
  format: BattleFormat; // 対戦形式
  result: 'win' | 'lose' | 'draw'; // 勝敗
  partyId: string; // 使用パーティID
  selectedPokemonIds: string[]; // 選出ポケモンID（3〜4匹）
  opponentParty?: OpponentPokemon[]; // 相手パーティ（任意）
  memo?: string; // メモ・振り返り
  videoUri?: string; // 動画ファイルURI or URL
  videoThumbnail?: string; // サムネイルURI
  createdAt: Date;
  updatedAt: Date;
}

type BattleFormat =
  | 'Ranked' // ランクマッチ
  | 'Casual' // カジュアルマッチ
  | 'Tournament' // 大会
  | 'Friendly'; // フレンド戦

interface OpponentPokemon {
  speciesName: string; // 種族名のみでOK
  item?: string;
  teraType?: Type;
  moves?: string[]; // 確認できた技
}
```

### DamageCalcInput（ダメージ計算入力）

```typescript
interface DamageCalcInput {
  attacker: {
    pokemon: Pokemon;
    move: Move;
    statBoosts: StatBoosts; // 能力ランク補正
    isCritical: boolean; // 急所
    isHelpingHand: boolean; // てだすけ
  };
  defender: {
    pokemon: Pokemon;
    statBoosts: StatBoosts;
    isFriendGuard: boolean; // フレンドガード
    isProtected: boolean; // まもる状態
  };
  field: {
    weather?: Weather; // 天候
    terrain?: Terrain; // フィールド
    isReflect: boolean; // リフレクター
    isLightScreen: boolean; // ひかりのかべ
    isMultiTarget: boolean; // 全体技かどうか
  };
}

interface StatBoosts {
  attack: number; // -6 〜 +6
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

type Weather = 'Sun' | 'Rain' | 'Sandstorm' | 'Snow';
type Terrain = 'Electric' | 'Grassy' | 'Psychic' | 'Misty';

interface DamageCalcResult {
  minDamage: number;
  maxDamage: number;
  minPercent: number; // 割合(%)
  maxPercent: number;
  koChance: {
    // 確定数
    ohko: number; // 1発で倒せる確率(%)
    thko: number; // 2発で倒せる確率(%)
  };
  description: string[]; // 計算説明テキスト
}
```

---

## 🚀 開発フェーズ

### Phase 1: ローカル版MVP（4〜6週間）

**目標**: ローカルストレージのみで動作する基本機能を実装

#### Week 1-2: 環境構築・基礎実装

- [ ] モノレポセットアップ（pnpm workspaces）
- [ ] Expoプロジェクト作成
- [ ] Expo Routerセットアップ
- [ ] UI基礎（タブナビゲーション、共通コンポーネント）
- [ ] PokéAPIからデータ取得・キャッシュ機能
- [ ] ローカルDB（Expo SQLite）セットアップ

#### Week 3-4: パーティ登録機能

- [ ] パーティ一覧画面
- [ ] パーティ作成・編集画面
- [ ] ポケモン選択UI（検索・フィルタ）
- [ ] ステータス入力フォーム（IV/EV）
- [ ] 実数値自動計算
- [ ] バリデーション実装
- [ ] CRUD操作（ローカルDB）
- [ ] Export/Import機能（JSON）

#### Week 5-6: ダメージ計算 & 対戦履歴

- [ ] ダメージ計算ロジック実装（packages/shared）
- [ ] ダメージ計算UI
- [ ] 計算結果表示（確定数など）
- [ ] 対戦履歴一覧画面
- [ ] 対戦記録作成画面
- [ ] 動画選択機能（expo-document-picker）
- [ ] 動画再生機能（expo-av）
- [ ] 統計表示（勝率など）

**成果物**:

- オフラインで動作するモバイルアプリ
- 3大機能（パーティ登録、ダメージ計算、対戦履歴）完成
- Export/Importでバックアップ可能

---

### Phase 2: クラウド同期（4〜6週間）

**目標**: バックエンドAPI構築、認証機能追加、データ同期

#### Week 7-8: バックエンド構築

- [ ] Honoプロジェクト作成（backend/hono-api）
- [ ] Cloudflare Workersセットアップ
- [ ] Supabaseプロジェクト作成
- [ ] データベーススキーマ設計・作成
- [ ] Supabase Auth設定
- [ ] REST API実装（CRUD）
- [ ] 認証ミドルウェア

#### Week 9-10: フロントエンド連携

- [ ] API Clientパッケージ作成（packages/api-client）
- [ ] 認証フロー実装（サインアップ/ログイン）
- [ ] データ同期機能（ローカル⇔クラウド）
- [ ] オフライン対応（キャッシュ戦略）
- [ ] 動画アップロード機能（Supabase Storage）
- [ ] エラーハンドリング・ローディング状態

#### Week 11-12: テスト・改善

- [ ] E2Eテスト
- [ ] パフォーマンス最適化
- [ ] UI/UX改善
- [ ] バグ修正

**成果物**:

- クラウド同期対応
- 複数デバイスでデータ共有可能
- 動画のクラウド保存

---

### Phase 3: 拡張機能（4〜8週間）

**目標**: パーティ構築支援、統計分析、チャンピオンズ対応

#### Week 13-14: パーティ構築支援

- [ ] タイプ相性チェック
- [ ] 弱点カバー分析
- [ ] おすすめポケモン提案
- [ ] 役割分担可視化

#### Week 15-16: 統計・分析強化

- [ ] 詳細な統計ダッシュボード
- [ ] グラフ表示（勝率推移など）
- [ ] 対面データ分析
- [ ] メタゲーム情報（流行ポケモン）

#### Week 17+: チャンピオンズ対応

- [ ] 新ポケモンデータ追加
- [ ] 新技・特性対応
- [ ] レギュレーション切り替え機能

**成果物**:

- 高度な分析機能
- チャンピオンズ完全対応

---

## 🎨 UI/UX要件

### デザイン方針

- **シンプル・直感的**: 初心者でも迷わず使える
- **ポケモンらしさ**: ゲームの世界観を尊重
- **モバイルファースト**: スマホでの操作性を最優先

### カラースキーム

- メインカラー: ポケモンブルー系
- アクセントカラー: イエロー（ピカチュウカラー）
- ダークモード対応

### 主要画面

#### 1. ホーム画面

- パーティ一覧（最近使用したもの）
- 最近の対戦記録
- クイックアクセス（ダメージ計算、新規パーティ作成）

#### 2. パーティ一覧

- カード形式で表示
- パーティ名、ポケモンアイコン6つ、作成日
- 検索・フィルタ機能
- スワイプで編集/削除

#### 3. パーティ詳細/編集

- ポケモン6匹のグリッド表示
- タップで詳細編集
- ステータス実数値表示
- タイプ相性簡易表示

#### 4. ダメージ計算

- 2カラムレイアウト（攻撃側/防御側）
- ドロップダウンで状況選択
- リアルタイム計算結果表示
- 履歴機能（よく使う計算を保存）

#### 5. 対戦履歴一覧

- リスト形式
- 日付、勝敗、使用パーティ、サムネイル
- フィルタ（期間、勝敗、パーティ）
- 統計サマリー（全体勝率など）

#### 6. 対戦詳細

- 対戦情報表示
- 動画プレイヤー
- メモ表示
- 編集・削除ボタン

---

## 🧪 テスト要件

### Phase 1

- **ユニットテスト**: ダメージ計算ロジック、実数値計算
- **手動テスト**: UI操作、データ保存・復元

### Phase 2以降

- **E2Eテスト**: 認証フロー、データ同期
- **APIテスト**: Hono APIエンドポイント
- **パフォーマンステスト**: 大量データ処理

---

## 📱 動作環境

### 開発環境

- **OS**: Windows
- **Android**: エミュレータ
- **iOS**: 実機（iPhone）
- **テスト**: Expo Go アプリ

### 本番環境（Phase 2以降）

- **Android**: Android 8.0以上
- **iOS**: iOS 13.0以上
- **ネットワーク**: オフライン動作可能（Phase 1）、同期時のみ必要（Phase 2）

---

## 🔒 非機能要件

### セキュリティ

- Phase 2: Supabase Auth使用（メール認証）
- 動画ファイルのアクセス制限（本人のみ）
- APIキーの環境変数管理

### パフォーマンス

- アプリ起動時間: 3秒以内
- ダメージ計算: リアルタイム（100ms以内）
- 動画読み込み: プログレッシブロード

### データ容量

- Phase 1: 端末ストレージに依存
- Phase 2: Supabase無料枠（500MB DB、1GB Storage）

---

## 📝 その他

### データソース

- **PokéAPI**: https://pokeapi.co/
  - 種族値、技、特性データ
  - 日本語名対応
  - キャッシュ必須（APIリクエスト削減）

### 参考資料

#### ポケモン対戦ツール（日本語）

- **ポケモンデータバトルベース（SV）**: https://sv.pokedb.tokyo/
  - ポケモンの基本データ、種族値、技、特性などの詳細情報
  - ダブルバトルのデータも充実
- **ダメージ計算ツール（シングル用）**: https://sv.pokesol.com/calc
  - ダメージ計算の仕様参考
  - UI/UXのデザイン参考
- **ポケモン基礎知識（やっくん）**: https://yakkun.com/
  - ポケモンの基礎知識
  - 図鑑データ、技データベース

#### 海外リソース

- ポケモン対戦データベース: https://pokemondb.net/
- ダメージ計算機: https://calc.pokemonshowdown.com/
- Smogon戦術解説: https://www.smogon.com/

### 今後の検討事項

- パーティ共有機能（QRコード、URL）
- コミュニティ機能（パーティ投稿・評価）
- プッシュ通知（大会情報など）
- 多言語対応

---

## 🎯 成功指標（KPI）

### Phase 1

- [ ] 3大機能の実装完了
- [ ] Expo Goでの動作確認（Android/iOS）
- [ ] データのExport/Import動作確認

### Phase 2

- [ ] クラウド同期の実装完了
- [ ] 認証フローの動作確認
- [ ] 動画アップロードの動作確認

### Phase 3

- [ ] チャンピオンズ対応完了
- [ ] 全機能の統合テスト完了

---

## 📞 問い合わせ・フィードバック

開発中の質問・提案は随時受け付けます。

---

**最終更新**: 2025-11-16
**バージョン**: 1.0
