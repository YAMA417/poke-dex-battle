---
name: pokemon-knowledge
description: poke-dex-battle プロジェクト固有のポケモン仕様ナレッジ（コア計算式、特性、技、アイテム、メガシンカ、内定ポケモン、ポケモンチャンピオンズ差分）を提供する。ダメージ計算・データ整合性・バトルロジック実装時に該当章のみ読み込んでオンデマンドで参照する。「ダメージ計算」「特性」「技」「アイテム」「メガシンカ」「内定」「チャンピオンズ」等のキーワードでトリガーする。
---

# Pokemon Knowledge (poke-dex-battle)

このプロジェクト固有のポケモン仕様ナレッジ。実装判断時に**必要な章だけ**読み込むこと（全部読むとコンテキスト消費が大きい）。

- コア計算式（ダメージ・ステータス・タイプ相性）: `@../../docs/pokemon-knowledge/core-mechanics.md`
- 特性: `@../../docs/pokemon-knowledge/abilities.md`
- 技: `@../../docs/pokemon-knowledge/moves.md`
- アイテム: `@../../docs/pokemon-knowledge/items.md`
- メガシンカ: `@../../docs/pokemon-knowledge/mega-evolutions.md`
- 内定ポケモン: `@../../docs/pokemon-knowledge/available-pokemon.md`
- ポケモンチャンピオンズ差分: `@../../docs/pokemon-knowledge/champions-changes.md`

## グローバル `pokemon-champions-knowledge` skill との棲み分け

- グローバル skill: ポケモン**一般仕様**（全世代）とチャンピオンズ差分の総合知識
- 本 skill: poke-dex-battle プロジェクトの**内定リスト・実装に直結する具体値**

両方トリガーされうるが、本 skill は実装作業の文脈で発火させる。
