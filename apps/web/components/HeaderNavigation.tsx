'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * ヘッダーナビゲーションコンポーネント。
 * ダメージ計算機とパーティマネージャーへのリンクを含む、常に表示されるフラットなナビゲーションメニューを表示する。
 * 現在のページは黄色のテキストと太字で強調される。
 */
export const HeaderNavigation: React.FC = () => {
  const { locale } = useLanguage();
  const pathname = usePathname();

  const menuItems =
    locale === 'ja'
      ? [
          { label: 'ダメージ計算', href: '/calc' },
          { label: 'パーティ管理', href: '/parties' },
        ]
      : [
          { label: 'Damage Calc', href: '/calc' },
          { label: 'Party Manager', href: '/parties' },
        ];

  // 現在のパス名で対応するナビゲーションリンクがアクティブかを判定する
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="overflow-x-auto">
      <ul className="flex items-center gap-6 whitespace-nowrap">
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive(item.href)
                  ? 'font-bold text-pokemon-yellow'
                  : 'text-white hover:text-pokemon-yellow'
              } `}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
