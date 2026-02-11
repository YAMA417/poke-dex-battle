# ダメージ計算エンジン リファクタリング設計

## Context

現在の `damage-calc.ts` は全ロジックが1ファイル（~496行）に集中しており、`calculateBaseDamage` が威力補正・ステータス補正・基礎ダメージ計算を一括処理するモノリシックな構造になっている。個別のmodifier関数（`calculateAttackerAbilityModifier` 等）は存在するが一部は未使用で、inline重複がある。やけど・壁・テスト用seed注入も未実装。

仕様に基づき、5つの独立した純粋関数モジュールに分解し、各フェーズを独立テスト可能にする。

## ブランチ名

`refactor/damage-calc-modularize`

---

## 1. 構成

```
packages/shared/src/
  types/
    damage.ts                          -- CalcPokemon, CalcMove, BattleContext を追加
  utils/
    damage-calc/                       -- 新モジュール群
      index.ts                         -- calculateDamageV2 + 全モジュールの再エクスポート
      resolve-base-power.ts            -- 技の最終威力を算出
      resolve-effective-stat.ts        -- ランク・急所・やけど考慮の実効ステータス算出
      calculate-base-damage.ts         -- 4引数の純粋数学関数
      calculate-modifier.ts            -- baseDamage後の全補正を公式順序で適用
      apply-random.ts                  -- 乱数幅(85-100) + seed注入
      poke-round.ts                    -- pokeRound関数の独立化（既存移動）
      apply-other-modifiers.ts         -- 4096ベース補正チェーン（既存移動）
      legacy-adapter.ts                -- DamageCalculationInput → 新型変換
    damage-calc-legacy.ts              -- 旧damage-calc.tsをリネーム（旧API互換ラッパー化）
  utils/__tests__/
    damage-calc/
      resolve-base-power.test.ts
      resolve-effective-stat.test.ts
      calculate-base-damage.test.ts
      calculate-modifier.test.ts
      apply-random.test.ts
      integration.test.ts             -- 新旧API同一結果の回帰テスト
    damage-calc.test.ts                -- 既存テスト（変更なし）
```

---

## 2. 新型定義（types/damage.ts に追加）

### CalcPokemon
- `level`: number
- `types`: PokemonType[]
- `stats`: `{ hp: number; atk: number; def: number; spa: number; spd: number; spe: number }`
- `boosts?`: `{ atk?: StatStage; def?: StatStage; spa?: StatStage; spd?: StatStage; spe?: StatStage }`
- `ability?`: string
- `item?`: string
- `status?`: `"burn" | "none"`
- `currentHp?`: number
- `maxHp?`: number
- `teraType?`: PokemonType
- `isTerastallized?`: boolean

### CalcMove
- `name`: string
- `power`: number
- `type`: PokemonType
- `category`: `"Physical" | "Special"`
- `isCritical?`: boolean
- `flags?`: MoveFlags（既存型を再利用）

### BattleContext
- `weather?`: Weather
- `field?`: Field
- `isDoubleBattle?`: boolean
- `isSpreadMove?`: boolean
- `isHelpingHand?`: boolean
- `reflect?`: boolean（新規）
- `lightScreen?`: boolean（新規）

---

## 3. コンポーネント設計

### 3-1. resolveBasePower

**ファイル**: `resolve-base-power.ts`
**目的**: 技の基礎威力に威力系補正を適用する

**公開インターフェース**:
- `resolveBasePower(move: CalcMove, attacker: CalcPokemon, defender: CalcPokemon, context: BattleContext): number`

**処理手順**:
- `power` を `move.power` で初期化
- てだすけ: `context.isHelpingHand` なら `floor(power * 1.5)`
- テクニシャン: `attacker.ability === "Technician"` かつ `move.power <= 60` なら `floor(power * 1.5)`
- てつのこぶし: `attacker.ability === "Iron Fist"` かつ `move.flags?.isPunchMove` なら `floor(power * 1.2)`
- すてみ: `attacker.ability === "Reckless"` かつ `move.flags?.isRecoilMove` なら `floor(power * 1.2)`
- たつじんのおび: `attacker.item === "Expert Belt"` かつ `calcTypeEffectiveness(move.type, defender.types) > 1` なら `floor(power * 1.2)`
- ノーマルジュエル: `attacker.item === "Normal Gem"` かつ `move.type === "Normal"` なら `floor(power * 1.3)`
- パンチグローブ: `attacker.item === "Punching Glove"` かつ `move.flags?.isPunchMove` なら `floor(power * 1.1)`
- `power` を返す

---

### 3-2. resolveEffectiveStat

**ファイル**: `resolve-effective-stat.ts`
**目的**: ランク補正・急所・やけど・持ち物を考慮した実効ステータスを算出

**公開インターフェース**:
- `resolveEffectiveAttack(attacker: CalcPokemon, move: CalcMove): number`
- `resolveEffectiveDefense(defender: CalcPokemon, move: CalcMove): number`

**resolveEffectiveAttack の処理手順**:
- Physical なら `baseStat = attacker.stats.atk`、`stage = attacker.boosts?.atk ?? 0`
- Special なら `baseStat = attacker.stats.spa`、`stage = attacker.boosts?.spa ?? 0`
- ランク補正: `stage >= 0` → `(2 + stage) / 2`、`stage < 0` → `2 / (2 - stage)`
- 急所時にstage < 0 → ランク補正を無視（baseStat のまま）。それ以外は `floor(baseStat * multiplier)`
- こだわりハチマキ/メガネ: 該当カテゴリなら `floor(値 * 1.5)`
- ちからのハチマキ/ものしりメガネ: 該当カテゴリなら `floor(値 * 1.1)`
- やけど: `attacker.status === "burn"` かつ Physical なら `floor(値 * 0.5)`
- 最終値を返す

> **仕様との差異**: 仕様では `resolveEffectiveStat(stat, boostStage, isCritical, status)` のプリミティブ引数を想定しているが、こだわりハチマキ等の持ち物補正はShowdown準拠でステータス段階に適用する必要がある。modifier phaseに移すと`floor`の適用順序が変わり計算結果がずれるため、ステータス解決フェーズに含める。

**resolveEffectiveDefense の処理手順**:
- Physical なら `baseStat = defender.stats.def`、`stage = defender.boosts?.def ?? 0`
- Special なら `baseStat = defender.stats.spd`、`stage = defender.boosts?.spd ?? 0`
- ランク補正: 攻撃と同じ計算式
- 急所時にstage > 0 → ランク補正を無視。それ以外は `floor(baseStat * multiplier)`
- 最終値を返す

---

### 3-3. calculateBaseDamage

**ファイル**: `calculate-base-damage.ts`
**目的**: 純粋な数学計算のみ

**公開インターフェース**:
- `calculateBaseDamage(level: number, power: number, attack: number, defense: number): number`

**処理手順**:
- `levelFactor = floor((level * 2) / 5) + 2`
- `damage = floor(floor(floor((levelFactor * power * attack) / defense) / 50) + 2)`
- `damage` を返す

---

### 3-4. calculateModifier

**ファイル**: `calculate-modifier.ts`
**目的**: baseDamage後の全補正を公式順序で適用し、min/maxダメージを返す

**公開インターフェース**:
- `calculateModifier(baseDamage: number, attacker: CalcPokemon, defender: CalcPokemon, move: CalcMove, context: BattleContext): { minDamage: number; maxDamage: number }`

> **仕様との差異**: 仕様では単一のnumberを返すが、乱数ステップでmin/maxに分岐するため `{minDamage, maxDamage}` を返す。

**処理手順（公式順序）**:
1. **Targets**: `isDoubleBattle && isSpreadMove` → `floor(値 * 0.75)`
2. **Weather**: `calculateWeatherModifier(move.type, context.weather)` を再利用 → `floor(値 * modifier)`
3. **Critical**: `move.isCritical` → `floor(値 * 1.5)`
4. **Random**: min に `floor(値 * 0.85)`、max に `floor(値 * 1.0)`
5. **STAB**: `calculateStab` を再利用 → `floor(値 * stab)`
6. **Type**: `calcTypeEffectiveness` を再利用 → `floor(値 * effectiveness)`
7. **Other**（4096チェーン）:
   - 壁: `context.reflect && category === "Physical" && !isCritical` → 0.5。`context.lightScreen && category === "Special" && !isCritical` → 0.5
   - いのちのたま: `attacker.item === "Life Orb"` → 1.3
   - 防御側特性: マルチスケイル、ハードロック/フィルター、もふもふ、あついしぼう
   - 防御側持ち物: 既存ロジック
   - `applyOtherModifiers(値, modifiers)` を適用

---

### 3-5. applyRandom

**ファイル**: `apply-random.ts`
**目的**: 乱数幅の適用。seed注入でテスト決定論を保証

**公開インターフェース**:
- `applyRandom(baseDamage: number, seed?: number): number`

**処理手順**:
- `seed` 未指定: `randomValue = floor(Math.random() * 16)` (0-15)
- `seed` 指定: `randomValue = seed` (0-15の範囲を期待)
- `factor = (85 + randomValue) / 100`
- `floor(baseDamage * factor)` を返す

---

### 3-6. calculateDamageV2（エントリポイント）

**ファイル**: `damage-calc/index.ts`
**目的**: 新APIのオーケストレーション

**公開インターフェース**:
- `calculateDamageV2(attacker: CalcPokemon, defender: CalcPokemon, move: CalcMove, context: BattleContext): DamageResult`

**処理手順**:
- `power = resolveBasePower(move, attacker, defender, context)`
- `attack = resolveEffectiveAttack(attacker, move)`
- `defense = resolveEffectiveDefense(defender, move)`
- `baseDamage = calculateBaseDamage(attacker.level, power, attack, defense)`
- `{ minDamage, maxDamage } = calculateModifier(baseDamage, attacker, defender, move, context)`
- `defenderHp = defender.maxHp ?? defender.stats.hp ?? 100`
- DamageResult を構築して返す

---

### 3-7. legacy-adapter

**ファイル**: `legacy-adapter.ts`
**目的**: `DamageCalculationInput` → `CalcPokemon` + `CalcMove` + `BattleContext` 変換

**公開インターフェース**:
- `convertLegacyInput(input: DamageCalculationInput): { attacker: CalcPokemon; defender: CalcPokemon; move: CalcMove; context: BattleContext }`

**処理手順**:
- attacker: level, types, stats（moveCategoryに応じてatk/spaに攻撃実数値をマッピング）, boosts, ability, item, teraType, isTerastallized を変換
- defender: types, stats（def/spdに防御実数値をマッピング）, boosts, ability, item, currentHp, maxHp を変換
- move: power, type, category, isCritical, flags を変換
- context: weather, field, isDoubleBattle, isSpreadMove, isHelpingHand を変換（reflect/lightScreen は undefined）

---

## 4. ファイルパス解決

旧 `utils/damage-calc.ts` → `utils/damage-calc-legacy.ts` にリネーム。`utils/damage-calc/index.ts` が新エントリポイントとなり、`packages/shared/src/index.ts` の `export * from "./utils/damage-calc"` はディレクトリの index.ts を解決する。`damage-calc/index.ts` 内で旧API互換の関数群も re-export する。

---

## 5. 実装順序

1. `poke-round.ts` — 既存関数の移動
2. `apply-other-modifiers.ts` — 既存関数の移動
3. `calculate-base-damage.ts` — 純粋数学、依存なし
4. `apply-random.ts` — 依存なし
5. `types/damage.ts` に CalcPokemon, CalcMove, BattleContext 追加
6. `resolve-base-power.ts` — 新型 + calcTypeEffectiveness に依存
7. `resolve-effective-stat.ts` — 新型 + getStatStageMultiplier に依存
8. `calculate-modifier.ts` — 新型 + calculateStab, calculateWeatherModifier, calcTypeEffectiveness, applyOtherModifiers に依存
9. `legacy-adapter.ts` — 新旧型に依存
10. `damage-calc/index.ts` — 全モジュール統合
11. `damage-calc-legacy.ts` — 旧APIを新エンジン経由に書き換え
12. 各テストファイル（各モジュール実装直後に作成）

---

## 6. 検証方法

1. **既存テスト回帰**: `damage-calc.test.ts` が全パスすることを確認（`npm run test`）
2. **新モジュール単体テスト**: 各 `.test.ts` でモジュール単位のカバレッジ 90%以上
3. **統合テスト**: `integration.test.ts` で新API `calculateDamageV2` と旧API `calculateDamage` に同一入力を渡し、同一結果を確認
4. **Showdownクロスバリデーション**: 既存のshadowtag.xyz期待値（カイリュー→ガブリアス等）と差分 <= 1

---

## 7. 再利用する既存関数

- `calcTypeEffectiveness` / `getTypeEffectiveness` — [types.ts](packages/shared/src/constants/types.ts)
- `getStatStageMultiplier` — 現 damage-calc.ts から移動
- `calculateStab` — 現 damage-calc.ts から移動
- `calculateWeatherModifier` — 現 damage-calc.ts から移動
- `pokeRound` — 現 damage-calc.ts から独立モジュール化
- `applyOtherModifiers` — 現 damage-calc.ts から独立モジュール化

---

## 対象外（将来タスク）

- UI側の `DamageCalculator.tsx` を新API `calculateDamageV2` に切り替え
- BattleConditionInput にリフレクター/ひかりのかべ UI追加
- やけど状態の UI入力追加
- Multi-hit moves, Dynamax/Terastal拡張
