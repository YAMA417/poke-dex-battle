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
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState<string>(
      typeof props.value === "string" ? props.value : ""
    );

    const filteredOptions = React.useMemo(() => {
      if (!inputValue) return options;
      const lowerInput = inputValue.toLowerCase();
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(lowerInput) ||
          option.value.toLowerCase().includes(lowerInput)
      );
    }, [inputValue, options]);

    const handleSelect = (value: string, label: string) => {
      setInputValue(label);
      onSelect(value);
      setOpen(false);
    };

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          {...props}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className={cn("w-full", className)}
          autoComplete="off"
        />

        {open && filteredOptions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-gray-200 bg-white rounded-md shadow-md max-h-60 overflow-y-auto">
            {filteredOptions.map((option, index) => (
              <button
                key={option.id || `${option.value}-${index}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option.value, option.label);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
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
