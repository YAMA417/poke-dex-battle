'use client';

import { Button } from '@/components/ui/button';
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
  const actualStats = calcActualStats(gabiteBaseStats, sampleIvs, sampleEvs, 50, 'Jolly' as Nature);

  return (
    <div className="space-y-8">
      {/* ヒーローセクション */}
      <section className="py-8 text-center">
        <h2 className="mb-4 text-3xl font-bold">ポケモンダブルバトル支援アプリ</h2>
        <p className="mb-8 text-gray-600">ダメージ計算、パーティ管理、対戦履歴を統合的にサポート</p>
      </section>

      {/* 機能カード */}
      <section className="grid gap-6 md:grid-cols-3">
        <Button
          asChild
          variant="ghost"
          className="h-auto justify-start rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
        >
          <Link href="/calc">
            <div className="w-full text-left">
              <h3 className="mb-2 text-xl font-semibold text-pokemon-blue">ダメージ計算</h3>
              <p className="text-gray-600">ダブルバトル特有の要素を考慮した詳細なダメージ計算</p>
            </div>
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          className="h-auto justify-start rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
        >
          <Link href="/parties">
            <div className="w-full text-left">
              <h3 className="mb-2 text-xl font-semibold text-pokemon-blue">パーティ管理</h3>
              <p className="text-gray-600">パーティの作成・編集・管理を効率的に</p>
            </div>
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          className="h-auto justify-start rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
        >
          <Link href="/battles">
            <div className="w-full text-left">
              <h3 className="mb-2 text-xl font-semibold text-pokemon-blue">対戦履歴</h3>
              <p className="text-gray-600">対戦記録の保存と統計分析</p>
            </div>
          </Link>
        </Button>
      </section>

      {/* サンプル：共通パッケージの動作確認 */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-xl font-semibold">
          実数値計算サンプル（@poke-dex-battle/shared）
        </h3>
        <p className="mb-4 text-gray-600">ガブリアス（Lv.50, 陽気, A252 D4 S252）</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <div className="rounded bg-gray-100 p-2 text-center">
            <div className="text-sm text-gray-500">HP</div>
            <div className="text-xl font-bold">{actualStats.hp}</div>
          </div>
          <div className="rounded bg-gray-100 p-2 text-center">
            <div className="text-sm text-gray-500">攻撃</div>
            <div className="text-xl font-bold">{actualStats.attack}</div>
          </div>
          <div className="rounded bg-gray-100 p-2 text-center">
            <div className="text-sm text-gray-500">防御</div>
            <div className="text-xl font-bold">{actualStats.defense}</div>
          </div>
          <div className="rounded bg-gray-100 p-2 text-center">
            <div className="text-sm text-gray-500">特攻</div>
            <div className="text-xl font-bold">{actualStats.specialAttack}</div>
          </div>
          <div className="rounded bg-gray-100 p-2 text-center">
            <div className="text-sm text-gray-500">特防</div>
            <div className="text-xl font-bold">{actualStats.specialDefense}</div>
          </div>
          <div className="rounded bg-gray-100 p-2 text-center">
            <div className="text-sm text-gray-500">素早</div>
            <div className="text-xl font-bold">{actualStats.speed}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
