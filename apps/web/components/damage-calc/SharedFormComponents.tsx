'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PokemonType, PokemonSpeciesData } from '@poke-dex-battle/shared';
import { getTypeDisplayName } from '@poke-dex-battle/shared';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';

// --- 性格補正コンパクトボタン ---

interface NatureModifierCompactProps {
  value: 1.1 | 1.0 | 0.9;
  onChange: (modifier: 1.1 | 1.0 | 0.9) => void;
}

const NATURE_OPTIONS = [
  { value: 1.1 as const, label: '↑' },
  { value: 1.0 as const, label: '—' },
  { value: 0.9 as const, label: '↓' },
];

export function NatureModifierCompact({ value, onChange }: NatureModifierCompactProps) {
  return (
    <div className="flex gap-1">
      {NATURE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded border px-3 py-1 text-xs transition-colors ${
            value === opt.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background text-muted-foreground hover:bg-accent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// --- 努力値プリセット（Labelなし、ボタン+Inputのみ） ---

export function EvPreset({
  value,
  onChange,
  calcStatFn,
}: {
  value: number;
  onChange: (ev: number) => void;
  calcStatFn?: (ev: number) => number;
}) {
  // +ボタン: 実数値が変わる次のEVにジャンプ
  const handleIncrement = () => {
    if (!calcStatFn || value >= 252) return;
    const currentStat = calcStatFn(value);
    for (let ev = value + 4; ev <= 252; ev += 4) {
      if (calcStatFn(ev) !== currentStat) {
        onChange(ev);
        return;
      }
    }
  };

  // -ボタン: 実数値が変わる前のEVにジャンプ
  const handleDecrement = () => {
    if (!calcStatFn || value <= 0) return;
    const currentStat = calcStatFn(value);
    for (let ev = value - 4; ev >= 0; ev -= 4) {
      if (calcStatFn(ev) !== currentStat) {
        onChange(ev);
        return;
      }
    }
    if (value > 0) onChange(0);
  };

  const btnBase = 'px-2 py-1 text-xs rounded border';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(252)}
        className={`${btnBase} ${value === 252 ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
      >
        252
      </button>
      <button
        type="button"
        onClick={() => onChange(0)}
        className={`${btnBase} ${value === 0 ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
      >
        0
      </button>
      {calcStatFn && (
        <>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={value <= 0}
            className={`${btnBase} hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30`}
          >
            −
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={value >= 252}
            className={`${btnBase} hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30`}
          >
            +
          </button>
        </>
      )}
      <Input
        type="number"
        min={0}
        max={252}
        step={4}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(252, parseInt(e.target.value) || 0)))}
        className="h-7 w-16 text-xs"
      />
    </div>
  );
}

// --- メガシンカ / ゲンシカイキ コントロール ---

interface MegaEvolutionControlProps {
  idPrefix: string;
  isMegaEvolved: boolean;
  megaFormSlug: string | null;
  megaForms: PokemonSpeciesData[];
  megaLabel: string;
  onToggle: (checked: boolean) => void;
  onVariantChange: (slug: string) => void;
}

export function MegaEvolutionControl({
  idPrefix,
  isMegaEvolved,
  megaFormSlug,
  megaForms,
  megaLabel,
  onToggle,
  onVariantChange,
}: MegaEvolutionControlProps) {
  if (megaForms.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`${idPrefix}-mega`}
          checked={isMegaEvolved}
          onCheckedChange={(checked: boolean) => onToggle(checked === true)}
          aria-label={`${megaLabel}を切り替え`}
        />
        <Label htmlFor={`${idPrefix}-mega`} className="cursor-pointer text-xs font-normal">
          {megaLabel}
        </Label>
      </div>
      {/* バリアント選択（2種以上の場合のみ） */}
      {isMegaEvolved && megaForms.length >= 2 && (
        <Select value={megaFormSlug ?? ''} onValueChange={onVariantChange}>
          <SelectTrigger className="h-8 text-sm" aria-label={`${megaLabel}フォーム選択`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {megaForms.map((f) => (
              <SelectItem key={f.name} value={f.name}>
                {f.nameJa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
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
          className={`rounded px-2 py-0.5 text-[10px] font-semibold text-white ${POKEMON_TYPE_COLORS[type] ?? 'bg-gray-500'}`}
        >
          {getTypeDisplayName(type, locale)}
        </span>
      ))}
    </div>
  );
}
