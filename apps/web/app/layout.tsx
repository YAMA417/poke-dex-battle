import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/ui/language-toggle';

export const metadata: Metadata = {
  title: 'ポケモンダブルバトル支援アプリ',
  description: 'ダメージ計算、パーティ管理、対戦履歴を統合的に支援',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        <LanguageProvider>
          <header className="bg-pokemon-blue text-white p-4 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
              <h1 className="text-xl font-bold">ポケモンダブルバトル支援</h1>
              <LanguageToggle />
            </div>
          </header>
          <main className="container mx-auto p-4">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
