'use client';

import { useState, useMemo, useCallback, useId } from 'react';
import { Filter, X, Swords, Sparkles, ShieldHalf, ChevronDown, ChevronUp } from 'lucide-react';
import { Autocomplete } from '@/components/ui/autocomplete';
import type { AutocompleteOption } from '@/components/ui/autocomplete';
import type { MoveRow } from '@/lib/api-adapters';
import { POKEMON_TYPE_COLORS } from '@/lib/constants';
import { POKEMON_TYPES, POKEMON_TYPE_LABELS_JA } from '@poke-dex-battle/shared';
import type { PokemonType } from '@poke-dex-battle/shared';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

type MoveCategory = 'Physical' | 'Special' | 'Status';

interface MoveFilteredSelectProps {
  /** 習得可能な move slug リスト */
  learnableMoves: string[] | null;
  /** 全技データ */
  allMoves: MoveRow[];
  /** 技選択時のコールバック（slug を返す） */
  onSelect: (moveSlug: string) => void;
  /** 除外するカテゴリ（例: ダメージ計算では ['Status']） */
  excludeCategories?: MoveCategory[];
  /** 折りたたみ可能か（false=常時展開、デフォルト: false） */
  collapsible?: boolean;
  /** collapsible=true 時のみ有効。フィルターの初期展開状態 */
  defaultExpanded?: boolean;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

// ---------------------------------------------------------------------------
// カテゴリ定義
// ---------------------------------------------------------------------------

const CATEGORIES: { value: MoveCategory; label: string; icon: typeof Swords }[] = [
  { value: 'Physical', label: '物理', icon: Swords },
  { value: 'Special', label: '特殊', icon: Sparkles },
  { value: 'Status', label: '変化', icon: ShieldHalf },
];

/** カテゴリアイコンを返すヘルパー */
function CategoryIcon({
  category,
  size = 16,
}: {
  category: string;
  size?: number;
}): React.ReactNode {
  const match = CATEGORIES.find((c) => c.value === category);
  if (!match) return null;
  const Icon = match.icon;
  return <Icon size={size} className="shrink-0 text-muted-foreground" aria-hidden="true" />;
}

// ---------------------------------------------------------------------------
// タイプ色のドット用背景色マッピング
// ---------------------------------------------------------------------------

/** POKEMON_TYPE_COLORS は bg-xxx 形式。ドット用にも同じクラスを使う */
const TYPE_DOT_COLORS: Record<string, string> = POKEMON_TYPE_COLORS;

// ---------------------------------------------------------------------------
// コンポーネント
// ---------------------------------------------------------------------------

export function MoveFilteredSelect({
  learnableMoves,
  allMoves,
  onSelect,
  excludeCategories,
  collapsible = false,
  defaultExpanded = false,
  placeholder = '技名を入力...',
  className,
  'aria-label': ariaLabel,
}: MoveFilteredSelectProps): React.ReactNode {
  const panelId = useId();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [selectedTypes, setSelectedTypes] = useState<Set<PokemonType>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<MoveCategory>>(new Set());

  // アクティブフィルター数
  const activeFilterCount = selectedTypes.size + selectedCategories.size;

  // ----- フィルター操作 -----

  const toggleType = useCallback((type: PokemonType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const toggleCategory = useCallback((cat: MoveCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTypes(new Set());
    setSelectedCategories(new Set());
  }, []);

  // 除外カテゴリの Set（安定参照のため useMemo）
  const excludedCatSet = useMemo(() => new Set(excludeCategories ?? []), [excludeCategories]);

  // 表示するカテゴリチップ
  const visibleCategories = useMemo(
    () => CATEGORIES.filter((c) => !excludedCatSet.has(c.value)),
    [excludedCatSet]
  );

  // ----- slug → MoveRow の高速ルックアップ -----

  const moveBySlug = useMemo(() => {
    return new Map(allMoves.map((m) => [m.slug, m]));
  }, [allMoves]);

  // ----- フィルタリングロジック -----

  const filteredOptions = useMemo((): AutocompleteOption[] => {
    // 1. learnableMoves に含まれる技のみ抽出（null なら全技）
    let candidates: MoveRow[];
    if (learnableMoves) {
      const slugSet = new Set(learnableMoves);
      candidates = allMoves.filter((m) => slugSet.has(m.slug));
    } else {
      candidates = allMoves;
    }

    // 2. 除外カテゴリを常に除外
    if (excludedCatSet.size > 0) {
      candidates = candidates.filter((m) => !excludedCatSet.has(m.category as MoveCategory));
    }

    // 3. タイプフィルタ
    if (selectedTypes.size > 0) {
      candidates = candidates.filter((m) => selectedTypes.has(m.type as PokemonType));
    }

    // 4. カテゴリフィルタ（ユーザー選択）
    if (selectedCategories.size > 0) {
      candidates = candidates.filter((m) => selectedCategories.has(m.category as MoveCategory));
    }

    // 5. AutocompleteOption[] に変換
    return candidates.map((m) => ({
      label: m.nameJa,
      value: m.slug,
      id: `move-${m.slug}`,
      meta: {
        type: m.type,
        category: m.category,
        power: m.power,
      },
    }));
  }, [allMoves, learnableMoves, excludedCatSet, selectedTypes, selectedCategories]);

  // ----- カスタムオプションレンダリング -----

  const renderOption = useCallback((option: AutocompleteOption): React.ReactNode => {
    const type = option.meta?.type as string | undefined;
    const category = option.meta?.category as string | undefined;
    const power = option.meta?.power as number | null | undefined;

    return (
      <span className="flex w-full items-center gap-1.5">
        {category && <CategoryIcon category={category} size={16} />}
        {type && (
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold text-white',
              POKEMON_TYPE_COLORS[type]
            )}
          >
            {POKEMON_TYPE_LABELS_JA[type as PokemonType] ?? type}
          </span>
        )}
        <span className="truncate">{option.label}</span>
        {power != null && power > 0 && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">威力{power}</span>
        )}
      </span>
    );
  }, []);

  // ----- 技選択ハンドラ -----

  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
    },
    [onSelect]
  );

  // ----- フィルターチップ共通レンダリング -----

  const filterChips = (
    <>
      {/* カテゴリチップ */}
      <div role="group" aria-label="カテゴリフィルター" className="flex gap-2">
        {visibleCategories.map((cat) => {
          const selected = selectedCategories.has(cat.value);
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggleCategory(cat.value)}
              aria-pressed={selected}
              className={cn(
                'flex h-8 items-center gap-1 rounded-md px-3 text-sm font-medium transition-all duration-150 motion-reduce:transition-none',
                selected
                  ? 'border border-primary bg-primary text-primary-foreground'
                  : 'cursor-pointer border border-input bg-background text-muted-foreground hover:bg-accent'
              )}
            >
              <Icon size={14} aria-hidden="true" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* タイプチップ */}
      <div role="group" aria-label="タイプフィルター" className="flex flex-wrap gap-1.5">
        {POKEMON_TYPES.map((type) => {
          const selected = selectedTypes.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              aria-pressed={selected}
              className={cn(
                'flex h-7 items-center gap-1 rounded-full px-2 text-xs transition-all duration-150 motion-reduce:transition-none',
                selected
                  ? `${POKEMON_TYPE_COLORS[type]} border border-transparent text-white ring-2 ring-offset-1`
                  : 'cursor-pointer border border-input bg-transparent text-muted-foreground'
              )}
            >
              {!selected && (
                <span
                  className={cn('h-2 w-2 shrink-0 rounded-full', TYPE_DOT_COLORS[type])}
                  aria-hidden="true"
                />
              )}
              {POKEMON_TYPE_LABELS_JA[type]}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className={cn('space-y-1.5', className)}>
      {collapsible ? (
        <>
          {/* 折りたたみヘッダー */}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
            aria-expanded={expanded}
            aria-controls={panelId}
          >
            <Filter size={14} aria-hidden="true" />
            <span>フィルター</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              {activeFilterCount > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilters();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      e.preventDefault();
                      clearFilters();
                    }
                  }}
                  className="rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="フィルターをクリア"
                >
                  <X size={12} className="inline" aria-hidden="true" />
                  <span className="ml-0.5">クリア</span>
                </span>
              )}
              {expanded ? (
                <ChevronUp size={14} aria-hidden="true" />
              ) : (
                <ChevronDown size={14} aria-hidden="true" />
              )}
            </span>
          </button>

          {/* 折りたたみパネル */}
          <div
            id={panelId}
            className={cn(
              'overflow-hidden transition-[max-height,opacity] duration-200 ease-out motion-reduce:transition-none',
              expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="space-y-1.5 pb-2">{filterChips}</div>
          </div>
        </>
      ) : (
        /* 常時展開: フィルターヘッダーなし、チップを直接表示 */
        filterChips
      )}

      {/* 技名 Autocomplete */}
      <Autocomplete
        options={filteredOptions}
        onSelect={handleSelect}
        renderOption={renderOption}
        placeholder={placeholder}
        aria-label={ariaLabel ?? '技を検索'}
        emptyMessage="該当する技がありません"
      />
    </div>
  );
}
