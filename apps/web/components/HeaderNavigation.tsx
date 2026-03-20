'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Header navigation menu component.
 * Displays a dropdown menu with links to damage calculator and party manager.
 */
export const HeaderNavigation: React.FC = () => {
  const { locale } = useLanguage();

  const menuItems = locale === 'ja'
    ? [
        { label: 'ダメージ計算', href: '/calc' },
        { label: 'パーティ管理', href: '/parties' },
      ]
    : [
        { label: 'Damage Calc', href: '/calc' },
        { label: 'Party Manager', href: '/parties' },
      ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Navigation menu</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="end">
        <nav className="flex flex-col">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm hover:bg-gray-100 border-b last:border-b-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </PopoverContent>
    </Popover>
  );
};
