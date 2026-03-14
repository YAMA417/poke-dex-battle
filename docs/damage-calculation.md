# ポケモン ダメージ計算式

このドキュメントでは、ポケモンのダメージ計算式と、各種補正がどのタイミングで適用されるかを説明します。

## 参考資料

- [shadowtag.xyz](https://shadowtag.xyz/) - ダメージ計算ツール
- [Bulbapedia - Damage](https://bulbapedia.bulbagarden.net/wiki/Damage)
- [ポケモンWiki - ダメージ計算式](https://wiki.xn--rckteqa2e.com/wiki/%E3%83%80%E3%83%A1%E3%83%BC%E3%82%B8)

## 基本計算式

ダメージは以下の手順で計算されます（第5世代以降）：

```
基本ダメージ = (((レベル × 2 ÷ 5 + 2) × 技威力 × 攻撃 ÷ 防御) ÷ 50 + 2)
最終ダメージ = 基本ダメージ × Targets × Weather × Critical × random × STAB × Type × other
```

### 計算の流れ

1. **基本ダメージ計算**
   - レベル、技威力、攻撃、防御から基本ダメージを算出
   - この段階で威力補正と攻撃補正が適用される

2. **段階的な補正適用**
   - 各補正を順番に適用し、それぞれの後で切り捨て処理

## 補正の適用タイミング

### 【1】威力補正（技の威力に適用）

技の威力自体を変更する補正。基本ダメージ計算の前に適用されます。

| 補正名           | 効果                 | 倍率  | 適用例                                |
| ---------------- | -------------------- | ----- | ------------------------------------- |
| てだすけ         | 技の威力を上げる     | 1.5倍 | 味方の「てだすけ」を受けた時          |
| テクニシャン     | 威力60以下の技を強化 | 1.5倍 | 威力60以下の技を使用時                |
| てつのこぶし     | パンチ技を強化       | 1.2倍 | パンチ技使用時                        |
| すてみ           | 反動技を強化         | 1.2倍 | 反動技使用時                          |
| たつじんのおび   | 効果抜群時に強化     | 1.2倍 | 効果抜群の技を使用時                  |
| ノーマルジュエル | ノーマル技を強化     | 1.3倍 | ノーマルタイプの技を使用時（1回のみ） |
| パンチグローブ   | パンチ技を強化       | 1.1倍 | パンチ技使用時                        |

**適用コード例:**

```typescript
// 威力補正（calculateBaseDamageで適用）
let finalPower = movePower;

if (condition.isHelpingHand) {
  finalPower = Math.floor(finalPower * 1.5);
}

if (condition.attackerAbility === 'Technician' && movePower <= 60) {
  finalPower = Math.floor(finalPower * 1.5);
}
```

### 【2】攻撃補正（攻撃実数値に適用）

攻撃または特攻の実数値を変更する補正。基本ダメージ計算の前に適用されます。

| 補正名           | 効果               | 倍率  | 適用例                 |
| ---------------- | ------------------ | ----- | ---------------------- |
| こだわりハチマキ | 物理攻撃を強化     | 1.5倍 | 物理技使用時           |
| こだわりメガネ   | 特殊攻撃を強化     | 1.5倍 | 特殊技使用時           |
| ちからのハチマキ | 物理攻撃を強化     | 1.1倍 | 物理技使用時           |
| ものしりメガネ   | 特殊攻撃を強化     | 1.1倍 | 特殊技使用時           |
| ランク補正       | 能力変化による補正 | 変動  | つるぎのまい等で上昇時 |

**ランク補正の倍率:**

| ランク | 倍率         |
| ------ | ------------ |
| +6     | 4.0倍 (8/2)  |
| +5     | 3.5倍 (7/2)  |
| +4     | 3.0倍 (6/2)  |
| +3     | 2.5倍 (5/2)  |
| +2     | 2.0倍 (4/2)  |
| +1     | 1.5倍 (3/2)  |
| 0      | 1.0倍 (2/2)  |
| -1     | 0.67倍 (2/3) |
| -2     | 0.5倍 (2/4)  |
| -3     | 0.4倍 (2/5)  |
| -4     | 0.33倍 (2/6) |
| -5     | 0.29倍 (2/7) |
| -6     | 0.25倍 (2/8) |

**適用コード例:**

```typescript
// 攻撃補正（calculateBaseDamageで適用）
let finalAttack = attackerAttack;

// ランク補正
const attackMultiplier = getStatStageMultiplier(attackStage);
finalAttack = Math.floor(finalAttack * attackMultiplier);

// こだわりハチマキ
if (condition.attackerItem === 'Choice Band' && moveCategory === 'Physical') {
  finalAttack = Math.floor(finalAttack * 1.5);
}
```

### 【3】基本ダメージ計算後の補正

基本ダメージ計算後、以下の順序で補正が適用されます：

#### 3-1. Targets（全体技補正）

- ダブルバトルで複数のポケモンに攻撃する技は0.75倍

#### 3-2. Weather（天候補正）

| 天候            | 効果  |
| --------------- | ----- |
| はれ + ほのお技 | 1.5倍 |
| はれ + みず技   | 0.5倍 |
| あめ + みず技   | 1.5倍 |
| あめ + ほのお技 | 0.5倍 |

#### 3-3. Critical（急所補正）

- 急所に当たった場合: 1.5倍
- 攻撃側の能力ダウンと防御側の能力アップを無視

#### 3-4. Random（乱数）

- 0.85〜1.00の16段階（0.85, 0.86, ..., 0.99, 1.00）
- ここで最小ダメージと最大ダメージが分岐

#### 3-5. STAB（タイプ一致補正）

| 状況                               | 倍率  |
| ---------------------------------- | ----- |
| タイプ一致（通常）                 | 1.5倍 |
| テラスタル時（元のタイプと一致）   | 2.0倍 |
| テラスタル時（元のタイプと不一致） | 1.5倍 |

#### 3-6. Type（タイプ相性）

- 0倍、0.25倍、0.5倍、1倍、2倍、4倍

#### 3-7. Other（その他のダメージ補正）

**ダメージに直接かかる補正:**

| 補正名                  | 効果                         | 倍率                     |
| ----------------------- | ---------------------------- | ------------------------ |
| いのちのたま            | すべての技のダメージを上げる | 1.3倍                    |
| マルチスケイル          | HP満タン時にダメージを半減   | 0.5倍（防御側）          |
| ハードロック/フィルター | 効果抜群のダメージを軽減     | 0.75倍（防御側）         |
| もふもふ（接触）        | 接触技のダメージを半減       | 0.5倍（防御側）          |
| もふもふ（ほのお）      | ほのお技のダメージを倍増     | 2.0倍（防御側）          |
| あついしぼう            | ほのお・こおり技を半減       | 0.5倍（防御側）          |
| 半減きのみ              | 効果抜群時にダメージ半減     | 0.5倍（防御側・1回のみ） |

**適用コード例:**

```typescript
// calculateDamageで適用
let damage = baseDamage;

// 1. Targets
damage = Math.floor(damage * spreadModifier);

// 2. Weather
damage = Math.floor(damage * weatherModifier);

// 3. Critical
damage = Math.floor(damage * criticalModifier);

// 4. Random
damage = Math.floor(damage * randomValue); // 0.85〜1.00

// 5. STAB
damage = Math.floor(damage * stab);

// 6. Type
damage = Math.floor(damage * typeEffectiveness);

// 7. Other（4096ベースの連鎖計算）
damage = applyOtherModifiers(damage, [
  lifeOrbModifier,
  defenderAbilityModifier,
  defenderItemModifier,
]);
```

## Other補正の特殊な計算方法

Other補正（いのちのたま、マルチスケイル等）は、4096ベースの固定小数点演算で連鎖させます。

```typescript
function applyOtherModifiers(baseDamage: number, modifiers: number[]): number {
  const INIT_VAL = 4096;
  let chain = INIT_VAL;

  // 補正を4096ベースで連鎖
  for (const modifier of modifiers) {
    if (modifier !== 1.0) {
      const modifier4096 = Math.floor(modifier * INIT_VAL);
      chain = Math.round((chain * modifier4096) / INIT_VAL);
    }
  }

  // 最後に五捨五超入で適用
  return pokeRound((baseDamage * chain) / INIT_VAL);
}
```

### 五捨五超入（pokeRound）

ポケモンの計算で使用される特殊な丸め処理：

- 小数部分が0.5より大きい → 切り上げ
- 小数部分が0.5ちょうど → 切り捨て
- 小数部分が0.5未満 → 切り捨て

```typescript
function pokeRound(value: number): number {
  const decimal = value - Math.floor(value);
  if (decimal > 0.5) {
    return Math.ceil(value); // 切り上げ
  } else {
    return Math.floor(value); // 切り捨て（0.5を含む）
  }
}
```

## 計算順序のまとめ

```
【基本ダメージ計算前】
├─ 威力補正: てだすけ、テクニシャン、たつじんのおび等
├─ 攻撃補正: こだわりハチマキ、ランク補正等
└─ 防御補正: ランク補正等

【基本ダメージ計算】
((レベル × 2 ÷ 5 + 2) × 技威力 × 攻撃 ÷ 防御) ÷ 50 + 2

【基本ダメージ計算後】
├─ 1. Targets（全体技補正）
├─ 2. Weather（天候補正）
├─ 3. Critical（急所補正）
├─ 4. Random（乱数: 0.85〜1.00）
├─ 5. STAB（タイプ一致補正）
├─ 6. Type（タイプ相性）
└─ 7. Other（いのちのたま、マルチスケイル等のダメージ補正）
```

## 実装の注意点

1. **補正のタイミング**
   - 威力補正は技の威力に適用（基本ダメージ計算前）
   - 攻撃補正は攻撃実数値に適用（基本ダメージ計算前）
   - ダメージ補正は最終ダメージに適用（基本ダメージ計算後）

2. **切り捨て処理**
   - 各補正を適用した後、必ず`Math.floor()`で切り捨て
   - Other補正のみ、4096ベースの連鎖計算後に五捨五超入

3. **急所の特殊処理**
   - 攻撃側の能力ダウンを無視
   - 防御側の能力アップを無視
   - リフレクター/ひかりのかべの効果を無視

4. **テラスタル**
   - テラスタイプと技タイプが一致
     - 元のタイプにも含まれていた → 2.0倍
     - 元のタイプに含まれていない → 1.5倍
   - テラスタイプと技タイプが不一致 → 補正なし

## テストケース

実装が正しいか確認するためのテストケース：

### ①カイリューのげきりん → ガブリアス

- 威力: 120
- タイプ一致: 1.5倍
- タイプ相性: 2倍（ドラゴン→ドラゴン）
- 期待値: 240〜284

### ②てだすけ使用時

- 威力: 80 → 120（てだすけで1.5倍）
- 期待値: 102〜121（最小値）

### ③こだわりハチマキ

- 攻撃: 150 → 225（ハチマキで1.5倍）
- 期待値: 68〜81（最小値）

### ④いのちのたま

- ダメージ補正: 1.3倍
- 期待値: 58〜70（最小値）

## 関連ファイル

- 実装: `packages/shared/src/utils/damage-calc.ts`
- テスト: `packages/shared/src/utils/__tests__/damage-calc.test.ts`
- 型定義: `packages/shared/src/types/damage.ts`
