'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-pokemon-blue/5 transition-colors duration-200"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Navigation menu</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-cyan-500" align="end">
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-sm font-medium text-white rounded-md transition-all duration-200 hover:text-pokemon-yellow border-b-0 last:border-b-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </PopoverContent>
    </Popover>
  );
};
