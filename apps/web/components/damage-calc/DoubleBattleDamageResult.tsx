import { Card, CardContent } from "@/components/ui/card";
import type { DoubleBattleResult, TargetResult } from "@/types/damage";
import type { DamageResult as DamageResultType } from "@poke-dex-battle/shared";
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

type DamageLabel = "確定" | "乱数" | "不可";

interface DoubleBattleDamageResultProps {
  result: DoubleBattleResult | null;
  target1Hp?: number;
  target2Hp?: number;
  target1Name?: string;
  target2Name?: string;
  attacker1Name?: string;
  attacker2Name?: string;
  isDetailNumbersOpen: boolean;
  onToggleDetailNumbers: () => void;
}

function getDamageLabel(result: DamageResultType): DamageLabel {
  if (result.minPercent >= 100) return "確定";
  if (result.maxPercent >= 100) return "乱数";
  return "不可";
}

function getLabelIcon(label: DamageLabel) {
  switch (label) {
    case "確定": return <CheckCircle className="w-4 h-4 text-verdict-ko" />;
    case "乱数": return <AlertTriangle className="w-4 h-4 text-verdict-chance" />;
    case "不可": return <XCircle className="w-4 h-4 text-verdict-fail" />;
  }
}

function getLabelColorClass(label: DamageLabel): string {
  switch (label) {
    case "確定": return "text-verdict-ko font-bold";
    case "乱数": return "text-verdict-chance font-semibold";
    case "不可": return "text-verdict-fail";
  }
}

function getBestPatternIndex(results: (DamageResultType | null)[]): number {
  let bestIdx = -1;
  let bestPercent = -1;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r && r.minPercent > bestPercent) {
      bestPercent = r.minPercent;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function PatternBadge({ label, result, isBest }: {
  label: string; result: DamageResultType | null; isBest?: boolean;
}) {
  if (!result) return null;

  const damageLabel = getDamageLabel(result);
  const icon = getLabelIcon(damageLabel);
  const colorClass = getLabelColorClass(damageLabel);

  return (
    <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
      isBest ? "bg-accent border border-primary/20 shadow-sm" : ""
    }`}>
      <span className="text-xs text-muted-foreground">{label}:</span>
      {icon}
      <span className={colorClass}>{damageLabel}</span>
    </div>
  );
}

function DamageRow({ label, result }: { label: string; result: DamageResultType | null }) {
  if (!result) return null;
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs tabular-nums">
        {result.minPercent.toFixed(1)}%〜{result.maxPercent.toFixed(1)}%
        ({result.minDamage}〜{result.maxDamage})
      </span>
    </div>
  );
}

function TargetSection({ targetName, results, patternLabels }: {
  targetName: string;
  results: TargetResult;
  patternLabels: string[];
}) {
  const allResults = [results.attackerAOnly, results.attackerBOnly, results.combined];
  const bestIdx = getBestPatternIndex(allResults);

  return (
    <div className="space-y-1">
      <span className="text-sm font-semibold">{targetName}</span>
      <div className="flex flex-wrap gap-2">
        {allResults.map((r, i) => (
          <PatternBadge key={patternLabels[i]} label={patternLabels[i]} result={r} isBest={i === bestIdx} />
        ))}
      </div>
    </div>
  );
}

function TargetDetailRows({ label, results, patternLabels }: {
  label: string;
  results: TargetResult;
  patternLabels: string[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold mb-1">{label}</h4>
      <DamageRow label={patternLabels[0]} result={results.attackerAOnly} />
      <DamageRow label={patternLabels[1]} result={results.attackerBOnly} />
      <DamageRow label={patternLabels[2]} result={results.combined} />
    </div>
  );
}

export function DoubleBattleDamageResult({
  result, target1Name, target2Name,
  attacker1Name, attacker2Name,
  isDetailNumbersOpen, onToggleDetailNumbers,
}: DoubleBattleDamageResultProps) {
  const patternLabels = [
    attacker1Name ? `${attacker1Name}のみ` : "攻撃1のみ",
    attacker2Name ? `${attacker2Name}のみ` : "攻撃2のみ",
    "集中",
  ];

  // 結果なし or 両ターゲットとも null
  if (!result || (!result.target1 && !result.target2)) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8">
          <p className="text-muted-foreground text-sm text-center">
            ポケモンと技を入力すると<br />自動で計算されます
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        {/* 防御側1 */}
        {result.target1 && (
          <TargetSection
            targetName={target1Name || "防御側 1"}
            results={result.target1}
            patternLabels={patternLabels}
          />
        )}

        {result.target1 && result.target2 && <div className="border-t" />}

        {/* 防御側2 */}
        {result.target2 && (
          <TargetSection
            targetName={target2Name || "防御側 2"}
            results={result.target2}
            patternLabels={patternLabels}
          />
        )}

        {/* 数値詳細トグル */}
        <button type="button" onClick={onToggleDetailNumbers}
          className="w-full pt-2 text-xs text-muted-foreground hover:text-foreground text-center flex items-center justify-center gap-1">
          {isDetailNumbersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {isDetailNumbersOpen ? "数値を隠す" : "数値を見る"}
        </button>

        {/* 数値詳細（折りたたみ） */}
        {isDetailNumbersOpen && (
          <div className="pt-2 border-t space-y-4">
            {result.target1 && (
              <TargetDetailRows
                label={target1Name || "防御側 1"}
                results={result.target1}
                patternLabels={patternLabels}
              />
            )}
            {result.target2 && (
              <TargetDetailRows
                label={target2Name || "防御側 2"}
                results={result.target2}
                patternLabels={patternLabels}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
