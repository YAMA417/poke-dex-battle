'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Header navigation component.
 * Displays a flat, always-visible navigation menu with links to damage calculator and party manager.
 * Current page is highlighted with yellow text and bold font weight.
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

  /**
   * Determine if a nav link is active based on current pathname.
   * 現在のパスが href と一致するかを判定
   */
  const isActive = (href: string): boolean => {
    return pathname === href;
  };

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
