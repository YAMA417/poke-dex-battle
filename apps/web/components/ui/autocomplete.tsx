'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface AutocompleteOption {
  label: string;
  value: string;
  id?: string | number;
  group?: string;
}

export interface AutocompleteProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'onSelect'
> {
  options: AutocompleteOption[];
  onSelect: (value: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
}

export const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(
  ({ options, onSelect, onClear, isLoading, className, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const listboxId = React.useId();
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState<string>(
      typeof props.value === 'string' ? props.value : ''
    );
    const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
    const [previousValue, setPreviousValue] = React.useState<string>('');

    // props.valueの変更を監視して inputValue を同期
    React.useEffect(() => {
      if (typeof props.value === 'string') {
        setInputValue(props.value);
      }
    }, [props.value]);

    const filteredOptions = React.useMemo(() => {
      if (!inputValue) return options;
      const lowerInput = inputValue.toLowerCase();
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(lowerInput) ||
          option.value.toLowerCase().includes(lowerInput)
      );
    }, [inputValue, options]);

    // highlightedIndexをfilteredOptionsの範囲内にリセット
    React.useEffect(() => {
      if (highlightedIndex >= filteredOptions.length) {
        setHighlightedIndex(filteredOptions.length - 1);
      }
    }, [filteredOptions, highlightedIndex]);

    // コンテナ外クリックでドロップダウンを閉じ、未選択なら元の値に戻す
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setOpen(false);
          setHighlightedIndex(-1);
          // 何も選択せずに外をクリックした場合、元の値に戻す
          if (previousValue && inputValue === '') {
            setInputValue(previousValue);
          }
        }
      };

      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [open]);

    const handleSelect = (value: string, label: string) => {
      setInputValue(label);
      onSelect(value);
      setOpen(false);
      setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            const option = filteredOptions[highlightedIndex];
            handleSelect(option.value, option.label);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setHighlightedIndex(-1);
          // 元の値に戻す
          if (previousValue) {
            setInputValue(previousValue);
          }
          break;
      }
    };

    const handleClear = () => {
      setInputValue('');
      setPreviousValue('');
      setOpen(false);
      setHighlightedIndex(-1);
      onClear?.();
    };

    const showClearButton = onClear && inputValue && !open;

    return (
      <div className="relative w-full" ref={containerRef}>
        <Input
          ref={ref}
          {...props}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setOpen(true);
            // フォーカス時に入力をクリアして全オプションを表示
            setPreviousValue(inputValue);
            setInputValue('');
          }}
          className={cn('w-full', showClearButton && 'pr-8', className)}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
        />
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="選択を解除"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {open && filteredOptions.length > 0 && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-input bg-background shadow-md"
          >
            {(() => {
              // グループごとにまとめてセクション化（sticky ヘッダーが正しく切り替わるように）
              const groups: {
                group: string | undefined;
                items: { option: AutocompleteOption; globalIndex: number }[];
              }[] = [];
              for (let i = 0; i < filteredOptions.length; i++) {
                const option = filteredOptions[i];
                const lastGroup = groups[groups.length - 1];
                if (!lastGroup || lastGroup.group !== option.group) {
                  groups.push({ group: option.group, items: [{ option, globalIndex: i }] });
                } else {
                  lastGroup.items.push({ option, globalIndex: i });
                }
              }

              return groups.map((section, sectionIndex) => (
                <div key={section.group ?? `section-${sectionIndex}`}>
                  {section.group && (
                    <div className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      {section.group}
                    </div>
                  )}
                  {section.items.map(({ option, globalIndex }) => (
                    <button
                      type="button"
                      key={option.id || `${option.value}-${globalIndex}`}
                      role="option"
                      aria-selected={highlightedIndex === globalIndex}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(option.value, option.label);
                      }}
                      onMouseEnter={() => setHighlightedIndex(globalIndex)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm focus:bg-accent focus:outline-none',
                        highlightedIndex === globalIndex ? 'bg-accent' : 'hover:bg-accent'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    );
  }
);

Autocomplete.displayName = 'Autocomplete';
