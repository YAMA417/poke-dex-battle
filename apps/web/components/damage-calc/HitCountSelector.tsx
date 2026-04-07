'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface HitCountSelectorProps {
  min: number;
  max: number;
  hitCount: number;
  onHitCountChange: (count: number) => void;
  disabled?: boolean;
  idPrefix: string;
}

/**
 * 連続技のヒット数選択コンポーネント
 * RadioGroup（横並び）で min〜max の整数をラジオボタンとして表示
 */
export function HitCountSelector({
  min,
  max,
  hitCount,
  onHitCountChange,
  disabled = false,
  idPrefix,
}: HitCountSelectorProps): React.ReactNode {
  // min〜max の整数配列を生成
  const counts: number[] = [];
  for (let i = min; i <= max; i++) {
    counts.push(i);
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">ヒット数</Label>
      <RadioGroup
        value={hitCount.toString()}
        onValueChange={(value: string) => onHitCountChange(parseInt(value, 10))}
        className="flex flex-wrap gap-1"
        disabled={disabled}
        aria-label="ヒット数選択"
      >
        {counts.map((count) => {
          const id = `${idPrefix}-hit-count-${count}`;
          return (
            <div key={count} className="flex items-center">
              <RadioGroupItem value={count.toString()} id={id} className="peer sr-only" />
              <Label
                htmlFor={id}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md border px-3 py-1.5 text-sm transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:font-semibold"
              >
                {count}回
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
