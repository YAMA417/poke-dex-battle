import { DamageCalculator } from '@/components/damage-calc/DamageCalculator';

export default function CalcPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">ダメージ計算</h1>
          <p className="text-muted-foreground">
            ダブルバトル特有の要素（てだすけ、全体技補正など）を考慮したダメージ計算機
          </p>
        </div>

        <DamageCalculator />
      </div>
    </div>
  );
}
