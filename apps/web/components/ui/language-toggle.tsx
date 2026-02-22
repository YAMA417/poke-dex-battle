"use client";

import { useLanguage, type Locale } from "@/contexts/LanguageContext";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "ja", label: "JA" },
  { value: "en", label: "EN" },
];

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex gap-0.5 rounded-md border border-input p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            locale === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
