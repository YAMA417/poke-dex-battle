"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AutocompleteProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect'> {
  options: { label: string; value: string; id?: string | number }[];
  onSelect: (value: string) => void;
  isLoading?: boolean;
}

export const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(
  ({ options, onSelect, isLoading, className, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const listboxId = React.useId();
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState<string>(
      typeof props.value === "string" ? props.value : ""
    );
    const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

    // props.valueの変更を監視して inputValue を同期
    React.useEffect(() => {
      if (typeof props.value === "string") {
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

    // コンテナ外クリックでドロップダウンを閉じる
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setOpen(false);
          setHighlightedIndex(-1);
        }
      };

      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
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
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            const option = filteredOptions[highlightedIndex];
            handleSelect(option.value, option.label);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

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
          onFocus={() => setOpen(true)}
          className={cn("w-full", className)}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
        />

        {open && filteredOptions.length > 0 && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-md max-h-60 overflow-y-auto"
          >
            {filteredOptions.map((option, index) => (
              <button
                key={option.id || `${option.value}-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option.value, option.label);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm focus:bg-accent focus:outline-none",
                  highlightedIndex === index ? "bg-accent" : "hover:bg-accent"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Autocomplete.displayName = "Autocomplete";
