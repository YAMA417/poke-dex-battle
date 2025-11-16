'use client';

import { calcActualStats } from '@poke-dex-battle/shared';
import type { BaseStats, Stats, Nature } from '@poke-dex-battle/shared';
import Link from 'next/link';

// サンプル：ガブリアスの実数値計算
const gabiteBaseStats: BaseStats = {
  hp: 108,
  attack: 130,
  defense: 95,
  specialAttack: 80,
  specialDefense: 85,
  speed: 102,
};

const sampleIvs: Stats = {
  hp: 31,
  attack: 31,
  defense: 31,
  specialAttack: 31,
  specialDefense: 31,
  speed: 31,
};

const sampleEvs: Stats = {
  hp: 0,
  attack: 252,
  defense: 0,
  specialAttack: 0,
  specialDefense: 4,
  speed: 252,
};

export default function Home() {
  const actualStats = calcActualStats(
    gabiteBaseStats,
    sampleIvs,
    sampleEvs,
    50,
    'Jolly' as Nature
  );

  return (
    <div className="space-y-8">
      {/* ヒーローセクション */}
      <section className="text-center py-8">
        <h2 className="text-3xl font-bold mb-4">
          ポケモンダブルバトル支援アプリ
        </h2>
        <p className="text-gray-600 mb-8">
          ダメージ計算、パーティ管理、対戦履歴を統合的にサポート
        </p>
      </section>

      {/* 機能カード */}
      <section className="grid md:grid-cols-3 gap-6">
        <Link
          href="/calc"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2 text-pokemon-blue">
            ダメージ計算
          </h3>
          <p className="text-gray-600">
            ダブルバトル特有の要素を考慮した詳細なダメージ計算
          </p>
        </Link>

        <Link
          href="/parties"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2 text-pokemon-blue">
            パーティ管理
          </h3>
          <p className="text-gray-600">
            パーティの作成・編集・管理を効率的に
          </p>
        </Link>

        <Link
          href="/battles"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2 text-pokemon-blue">
            対戦履歴
          </h3>
          <p className="text-gray-600">
            対戦記録の保存と統計分析
          </p>
        </Link>
      </section>

      {/* サンプル：共通パッケージの動作確認 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">
          実数値計算サンプル（@poke-dex-battle/shared）
        </h3>
        <p className="text-gray-600 mb-4">
          ガブリアス（Lv.50, 陽気, A252 D4 S252）
        </p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-sm text-gray-500">HP</div>
            <div className="text-xl font-bold">{actualStats.hp}</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-sm text-gray-500">攻撃</div>
            <div className="text-xl font-bold">{actualStats.attack}</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-sm text-gray-500">防御</div>
            <div className="text-xl font-bold">{actualStats.defense}</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-sm text-gray-500">特攻</div>
            <div className="text-xl font-bold">{actualStats.specialAttack}</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-sm text-gray-500">特防</div>
            <div className="text-xl font-bold">{actualStats.specialDefense}</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-sm text-gray-500">素早</div>
            <div className="text-xl font-bold">{actualStats.speed}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
