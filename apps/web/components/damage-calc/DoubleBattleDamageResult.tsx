import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DamageResult as DamageResultType } from "@poke-dex-battle/shared";

type DamageLabel = "確定" | "確定ライン" | "乱数" | "超乱数" | "不可";

interface DoubleBattleDamageResultProps {
  result: {
    target1: {
      attackerAOnly: DamageResultType;
      attackerBOnly: DamageResultType;
      combined: DamageResultType;
    };
    target2: {
      attackerAOnly: DamageResultType;
      attackerBOnly: DamageResultType;
      combined: DamageResultType;
    };
  } | null;
  target1Hp?: number;
  target2Hp?: number;
  target1Name?: string;
  target2Name?: string;
}

/**
 * Determines the damage label based on the result
 * - "確定": 100% guaranteed to KO
 * - "確定ライン": Above 100% at minimum
 * - "乱数": Between 50% and 100%
 * - "超乱数": Between 20% and 50%
 * - "不可": Cannot KO
 */
function getDamageLabel(result: DamageResultType): DamageLabel {
  const { minPercent, maxPercent } = result;

  if (minPercent >= 100) {
    return "確定";
  } else if (maxPercent >= 100) {
    return "確定ライン";
  } else if (minPercent >= 50) {
    return "乱数";
  } else if (minPercent >= 20) {
    return "超乱数";
  }
  return "不可";
}

/**
 * Gets the color class based on damage label
 */
function getLabelColorClass(label: DamageLabel): string {
  switch (label) {
    case "確定":
      return "text-green-600 font-bold";
    case "確定ライン":
      return "text-blue-600 font-semibold";
    case "乱数":
      return "text-orange-500 font-medium";
    case "超乱数":
      return "text-orange-400";
    case "不可":
      return "text-red-400";
  }
}

/**
 * Determines the best attack pattern (highest minimum damage) for a target
 */
function getBestPatternLabel(results: {
  attackerAOnly: DamageResultType;
  attackerBOnly: DamageResultType;
  combined: DamageResultType;
}): string {
  const patterns = [
    { label: "Aのみ", result: results.attackerAOnly },
    { label: "Bのみ", result: results.attackerBOnly },
    { label: "集中", result: results.combined },
  ];

  const bestPattern = patterns.reduce((prev, current) =>
    current.result.minPercent > prev.result.minPercent ? current : prev
  );

  return bestPattern.label;
}

interface DamageRowProps {
  label: string;
  result: DamageResultType;
}

function DamageRow({ label, result }: DamageRowProps) {
  const { minPercent, maxPercent } = result;
  const damageLabel = getDamageLabel(result);
  const colorClass = getLabelColorClass(damageLabel);

  return (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center gap-3">
        <div>
          <span className="font-mono font-semibold">
            {minPercent.toFixed(1)}%〜{maxPercent.toFixed(1)}%
          </span>
        </div>
        <div className={`text-xs font-medium min-w-16 text-right ${colorClass}`}>
          {damageLabel}
        </div>
      </div>
    </div>
  );
}

interface TargetSectionProps {
  targetLabel: string;
  targetName?: string;
  targetHp?: number;
  results: {
    attackerAOnly: DamageResultType;
    attackerBOnly: DamageResultType;
    combined: DamageResultType;
  };
}

function TargetSection({
  targetLabel,
  targetName,
  targetHp,
  results,
}: TargetSectionProps) {
  // Determine the best strategy (which pattern has highest min damage)
  const patterns = [
    { label: "Aのみ", result: results.attackerAOnly },
    { label: "Bのみ", result: results.attackerBOnly },
    { label: "集中", result: results.combined },
  ];

  const bestPatternLabel = getBestPatternLabel(results);
  const bestPattern = patterns.find((p) => p.label === bestPatternLabel);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold">{targetLabel}</h3>
        {targetName && (
          <span className="text-sm text-muted-foreground">{targetName}</span>
        )}
        {targetHp !== undefined && (
          <span className="text-sm text-muted-foreground">
            HP: {targetHp}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {patterns.map((pattern) => {
          const isBest = pattern.label === bestPatternLabel;
          return (
            <div
              key={pattern.label}
              className={`rounded px-3 ${
                isBest ? "bg-blue-50 dark:bg-blue-950" : ""
              }`}
            >
              <DamageRow
                label={
                  isBest ? `${pattern.label} ⭐` : pattern.label
                }
                result={pattern.result}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DoubleBattleDamageResult({
  result,
  target1Hp,
  target2Hp,
  target1Name,
  target2Name,
}: DoubleBattleDamageResultProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ダメージ計算結果</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            攻撃側・防御側のポケモンと技を入力すると自動で計算されます
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>【計算結果】</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <TargetSection
          targetLabel="対象①"
          targetName={target1Name}
          targetHp={target1Hp}
          results={result.target1}
        />

        <div className="border-t pt-8" />

        <TargetSection
          targetLabel="対象②"
          targetName={target2Name}
          targetHp={target2Hp}
          results={result.target2}
        />

        {/* Strategy Recommendation */}
        <div className="border-t pt-6 mt-6">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
            判定サマリー
          </h4>

          {(() => {
            const target1Best = getBestPatternLabel(result.target1);
            const target2Best = getBestPatternLabel(result.target2);

            return (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">対象①：</span>
                  <span className="font-medium">{target1Best}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    が最適
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">対象②：</span>
                  <span className="font-medium">{target2Best}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    が最適
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
