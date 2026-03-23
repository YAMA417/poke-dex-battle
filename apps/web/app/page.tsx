'use client';

import { Button } from '@/components/ui/button';
import { calcActualStats } from '@poke-dex-battle/shared';
import type { BaseStats, Stats, Nature } from '@poke-dex-battle/shared';
import Link from 'next/link';
import { Zap, Users, BarChart3 } from 'lucide-react';

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
    <div className="min-h-screen bg-white">
      {/* ヒーローセクション - グラデーション背景 */}
      <section className="hero-gradient relative overflow-hidden px-4 py-20 text-white sm:py-32">
        {/* 背景パターン装飾 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-300 blur-3xl" />
          <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-blue-400 blur-3xl" />
        </div>

        {/* コンテンツ */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            🎮 ポケモンダブルバトル支援アプリ
          </div>
          <p className="mb-4 text-lg text-white/90 sm:text-xl">
            初級者から上級者まで、ダブルバトルを徹底サポート！
          </p>
          <p className="mb-4 text-lg text-white/90 sm:text-xl">
            ダブルバトルで勝利を掴もう！
          </p>
          <Button
            asChild
            className="h-14 rounded-lg bg-white px-8 text-lg font-bold text-pokemon-blue shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-white/50 hover:bg-yellow-400 hover:text-black"
          >
            <Link href="/calc">今すぐ始める</Link>
          </Button>
        </div>
      </section>

      {/* 機能カード */}
      <section className="space-y-8 px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-6xl">

          <div className="grid gap-8 md:grid-cols-3">
            {/* ダメージ計算カード */}
            <Link href="/calc">
              <div className="group relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-8 shadow-md card-hover-safe cursor-pointer">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pokemon-blue/5 transition-transform duration-300 group-hover:scale-150" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-4 inline-block rounded-lg bg-pokemon-blue/10 group-hover:bg-yellow-400 p-3 w-fit transition-colors duration-200">
                    <Zap className="h-6 w-6 text-pokemon-blue group-hover:text-black" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-pokemon-blue">ダメージ計算</h3>
                  <p className="text-gray-600 leading-relaxed opacity-0 transform translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 mt-auto">
                    ダブルバトル特有の要素を考慮した詳細なダメージ計算が行えます。
                  </p>
                </div>
              </div>
            </Link>

            {/* パーティ管理カード */}
            <Link href="/parties">
              <div className="group relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-200 p-8 shadow-md card-hover-safe cursor-pointer">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pokemon-blue/5 transition-transform duration-300 group-hover:scale-150" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-4 inline-block rounded-lg bg-pokemon-blue/10 group-hover:bg-yellow-400 p-3 w-fit transition-colors duration-200">
                    <Users className="h-6 w-6 text-pokemon-blue group-hover:text-black" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-pokemon-blue">パーティ管理</h3>
                  <p className="text-gray-600 leading-relaxed opacity-0 transform translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 mt-auto">
                    自身のパーティを詳細な条件で効率的に作成・編集・管理が行えます。
                  </p>
                </div>
              </div>
            </Link>

            {/* 対戦履歴カード */}
            <div className="group relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-100 p-8 shadow-md opacity-50 cursor-not-allowed">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pokemon-blue/5" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4 inline-block rounded-lg bg-pokemon-blue/10 p-3 w-fit">
                  <BarChart3 className="h-6 w-6 text-pokemon-blue" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-pokemon-blue">対戦履歴</h3>
                <p className="text-gray-600 leading-relaxed mt-auto">
                  対戦記録の保存・分析機能は、実装予定
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* フッターセクション */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-gray-600">
            © 2026 Pokédex Battle. ポケモンダブルバトル支援アプリ
          </p>
        </div>
      </section>
    </div>
  );
}
