import { Card, CardContent } from "@/components/ui/card";
import type { DoubleBattleResult } from "@/types/damage";
import type { DamageResult as DamageResultType } from "@poke-dex-battle/shared";

type DamageLabel = "確定" | "乱数" | "不可";

interface DoubleBattleDamageResultProps {
  result: DoubleBattleResult | null;
  target1Hp?: number;
  target2Hp?: number;
  target1Name?: string;
  target2Name?: string;
  isDetailNumbersOpen: boolean;
  onToggleDetailNumbers: () => void;
}

function getDamageLabel(result: DamageResultType): DamageLabel {
  if (result.minPercent >= 100) return "確定";
  if (result.maxPercent >= 100) return "乱数";
  return "不可";
}

function getLabelIcon(label: DamageLabel): string {
  switch (label) {
    case "確定": return "✅";
    case "乱数": return "⚠";
    case "不可": return "❌";
  }
}

function getLabelColorClass(label: DamageLabel): string {
  switch (label) {
    case "確定": return "text-green-600 font-bold";
    case "乱数": return "text-orange-500 font-semibold";
    case "不可": return "text-red-400";
  }
}

function getBestPatternIndex(results: {
  attackerAOnly: DamageResultType;
  attackerBOnly: DamageResultType;
  combined: DamageResultType;
}): number {
  const percents = [
    results.attackerAOnly.minPercent,
    results.attackerBOnly.minPercent,
    results.combined.minPercent,
  ];
  return percents.indexOf(Math.max(...percents));
}

const PATTERN_LABELS = ["Aのみ", "Bのみ", "集中"];

function PatternBadge({ label, result, isBest }: {
  label: string; result: DamageResultType; isBest?: boolean;
}) {
  const damageLabel = getDamageLabel(result);
  const icon = getLabelIcon(damageLabel);
  const colorClass = getLabelColorClass(damageLabel);

  return (
    <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
      isBest ? "bg-blue-50 dark:bg-blue-950" : ""
    }`}>
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span>{icon}</span>
      <span className={colorClass}>{damageLabel}</span>
    </div>
  );
}

function DamageRow({ label, result }: { label: string; result: DamageResultType }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">
        {result.minPercent.toFixed(1)}%〜{result.maxPercent.toFixed(1)}%
        ({result.minDamage}〜{result.maxDamage})
      </span>
    </div>
  );
}

function TargetDetailRows({ label, results }: {
  label: string;
  results: { attackerAOnly: DamageResultType; attackerBOnly: DamageResultType; combined: DamageResultType };
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold mb-1">{label}</h4>
      <DamageRow label="Aのみ" result={results.attackerAOnly} />
      <DamageRow label="Bのみ" result={results.attackerBOnly} />
      <DamageRow label="集中" result={results.combined} />
    </div>
  );
}

export function DoubleBattleDamageResult({
  result, target1Hp, target2Hp, target1Name, target2Name,
  isDetailNumbersOpen, onToggleDetailNumbers,
}: DoubleBattleDamageResultProps) {
  if (!result) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-sm text-center">
            ポケモンと技を入力すると<br />自動で計算されます
          </p>
        </CardContent>
      </Card>
    );
  }

  const target1Best = getBestPatternIndex(result.target1);
  const target2Best = getBestPatternIndex(result.target2);
  const target1Results = [result.target1.attackerAOnly, result.target1.attackerBOnly, result.target1.combined];
  const target2Results = [result.target2.attackerAOnly, result.target2.attackerBOnly, result.target2.combined];

  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        {/* 対象① */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">対象①</span>
            {target1Name && <span className="text-xs text-muted-foreground">{target1Name}</span>}
          </div>
          <div className="flex gap-3">
            {target1Results.map((r, i) => (
              <PatternBadge key={PATTERN_LABELS[i]} label={PATTERN_LABELS[i]} result={r} isBest={i === target1Best} />
            ))}
          </div>
        </div>

        <div className="border-t" />

        {/* 対象② */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">対象②</span>
            {target2Name && <span className="text-xs text-muted-foreground">{target2Name}</span>}
          </div>
          <div className="flex gap-3">
            {target2Results.map((r, i) => (
              <PatternBadge key={PATTERN_LABELS[i]} label={PATTERN_LABELS[i]} result={r} isBest={i === target2Best} />
            ))}
          </div>
        </div>

        {/* 数値詳細トグル */}
        <button type="button" onClick={onToggleDetailNumbers}
          className="w-full pt-2 text-xs text-muted-foreground hover:text-foreground text-center">
          {isDetailNumbersOpen ? "数値を隠す" : "▼ 数値を見る"}
        </button>

        {/* 数値詳細（折りたたみ） */}
        {isDetailNumbersOpen && (
          <div className="pt-2 border-t space-y-4">
            <TargetDetailRows
              label={`対象① ${target1Name ?? ""}`}
              results={result.target1}
            />
            <TargetDetailRows
              label={`対象② ${target2Name ?? ""}`}
              results={result.target2}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
