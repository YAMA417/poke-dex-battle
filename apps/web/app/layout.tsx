import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { HeaderNavigation } from '@/components/HeaderNavigation';

export const metadata: Metadata = {
  title: 'ポケモンダブルバトル支援アプリ',
  description: 'ダメージ計算、パーティ管理、対戦履歴を統合的に支援',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        <LanguageProvider>
          <header className="bg-pokemon-blue p-4 text-white shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
              <Link href="/">
                <h1 className="text-xl font-bold hover:opacity-80 transition-opacity cursor-pointer">
                  ポケモンダブルバトル支援
                </h1>
              </Link>
              <div className="flex items-center gap-4">
                <HeaderNavigation />
                <LanguageToggle />
              </div>
            </div>
          </header>
          <main className="container mx-auto p-4">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
