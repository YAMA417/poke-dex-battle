"use client";

import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PokemonType } from "@poke-dex-battle/shared";
import { getTypeDisplayName } from "@poke-dex-battle/shared";

// --- タイプカラーマッピング ---

const TYPE_COLORS: Record<string, string> = {
  Normal: "bg-gray-400",
  Fire: "bg-red-500",
  Water: "bg-blue-500",
  Electric: "bg-yellow-400",
  Grass: "bg-green-500",
  Ice: "bg-cyan-300",
  Fighting: "bg-orange-700",
  Poison: "bg-purple-500",
  Ground: "bg-amber-600",
  Flying: "bg-indigo-300",
  Psychic: "bg-pink-500",
  Bug: "bg-lime-500",
  Rock: "bg-amber-700",
  Ghost: "bg-purple-700",
  Dragon: "bg-indigo-600",
  Dark: "bg-gray-700",
  Steel: "bg-gray-400",
  Fairy: "bg-pink-300",
};

// --- 性格補正コンパクトボタン ---

interface NatureModifierCompactProps {
  value: 1.1 | 1.0 | 0.9;
  onChange: (modifier: 1.1 | 1.0 | 0.9) => void;
}

const NATURE_OPTIONS = [
  { value: 1.1 as const, label: "↑" },
  { value: 1.0 as const, label: "—" },
  { value: 0.9 as const, label: "↓" },
];

export function NatureModifierCompact({ value, onChange }: NatureModifierCompactProps) {
  return (
    <div className="flex gap-1">
      {NATURE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs rounded border transition-colors ${
            value === opt.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-input hover:bg-accent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// --- 努力値プリセット（Labelなし、ボタン+Inputのみ） ---

export function EvPreset({ value, onChange }: {
  value: number; onChange: (ev: number) => void;
}) {
  return (
    <div className="flex gap-1 items-center">
      <button type="button" onClick={() => onChange(252)}
        className={`px-2 py-1 text-xs rounded border ${value === 252 ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
        252
      </button>
      <button type="button" onClick={() => onChange(0)}
        className={`px-2 py-1 text-xs rounded border ${value === 0 ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
        0
      </button>
      <Input type="number" min={0} max={252} step={4} value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(252, parseInt(e.target.value) || 0)))}
        className="h-7 w-16 text-xs" />
    </div>
  );
}

// --- タイプバッジ ---

export function TypeBadges({ types }: { types: PokemonType[] }) {
  const { locale } = useLanguage();
  if (types.length === 0) return null;
  return (
    <div className="flex gap-1">
      {types.map((type) => (
        <span
          key={type}
          className={`px-2 py-0.5 text-[10px] font-semibold text-white rounded ${TYPE_COLORS[type] ?? "bg-gray-500"}`}
        >
          {getTypeDisplayName(type, locale)}
        </span>
      ))}
    </div>
  );
}
