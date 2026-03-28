import { Card, CardContent } from '@/components/ui/card';
import type { DoubleBattleResult, TargetResult } from '@/types/damage';
import type { DamageResult as DamageResultType } from '@poke-dex-battle/shared';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

type DamageLabelCategory = 'ko' | 'chance' | 'fail';

interface DamageLabel {
  text: string;
  category: DamageLabelCategory;
}

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
  const { guaranteed, possible } = result;

  // 倒せない場合
  if (guaranteed === Infinity && possible === Infinity) {
    return { text: '不可', category: 'fail' };
  }

  // guaranteed === possible なら確定N発
  if (guaranteed === possible) {
    return {
      text: `確定${guaranteed}発`,
      category: guaranteed === 1 ? 'ko' : 'chance',
    };
  }

  // guaranteed !== possible なら乱数N発
  return {
    text: `乱数${guaranteed}発`,
    category: 'chance',
  };
}

function getLabelIcon(category: DamageLabelCategory) {
  switch (category) {
    case 'ko':
      return <CheckCircle className="text-verdict-ko h-4 w-4" />;
    case 'chance':
      return <AlertTriangle className="text-verdict-chance h-4 w-4" />;
    case 'fail':
      return <XCircle className="text-verdict-fail h-4 w-4" />;
  }
}

function getLabelColorClass(category: DamageLabelCategory): string {
  switch (category) {
    case 'ko':
      return 'text-verdict-ko font-bold';
    case 'chance':
      return 'text-verdict-chance font-semibold';
    case 'fail':
      return 'text-verdict-fail';
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

function PatternBadge({
  label,
  result,
  isBest,
}: {
  label: string;
  result: DamageResultType | null;
  isBest?: boolean;
}) {
  if (!result) return null;

  const damageLabel = getDamageLabel(result);
  const icon = getLabelIcon(damageLabel.category);
  const colorClass = getLabelColorClass(damageLabel.category);

  return (
    <div
      className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm ${
        isBest ? 'border border-primary/20 bg-accent shadow-sm' : ''
      }`}
    >
      <span className="whitespace-nowrap text-xs text-muted-foreground">{label}:</span>
      {icon}
      <span className={colorClass}>{damageLabel.text}</span>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {result.minPercent.toFixed(1)}%〜{result.maxPercent.toFixed(1)}%
      </span>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        ({result.minDamage}〜{result.maxDamage})
      </span>
    </div>
  );
}

function DamageRow({ label, result }: { label: string; result: DamageResultType | null }) {
  if (!result) return null;
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs tabular-nums">
        {result.minPercent.toFixed(1)}%〜{result.maxPercent.toFixed(1)}% ({result.minDamage}〜
        {result.maxDamage})
      </span>
    </div>
  );
}

function TargetSection({
  targetName,
  results,
  patternLabels,
}: {
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
          <PatternBadge
            key={patternLabels[i]}
            label={patternLabels[i]}
            result={r}
            isBest={i === bestIdx}
          />
        ))}
      </div>
    </div>
  );
}

function TargetDetailRows({
  label,
  results,
  patternLabels,
}: {
  label: string;
  results: TargetResult;
  patternLabels: string[];
}) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold">{label}</h4>
      <DamageRow label={patternLabels[0]} result={results.attackerAOnly} />
      <DamageRow label={patternLabels[1]} result={results.attackerBOnly} />
      <DamageRow label={patternLabels[2]} result={results.combined} />
    </div>
  );
}

export function DoubleBattleDamageResult({
  result,
  target1Name,
  target2Name,
  attacker1Name,
  attacker2Name,
  isDetailNumbersOpen,
  onToggleDetailNumbers,
}: DoubleBattleDamageResultProps) {
  const patternLabels = [
    attacker1Name ? `${attacker1Name}のみ` : '攻撃1のみ',
    attacker2Name ? `${attacker2Name}のみ` : '攻撃2のみ',
    '集中',
  ];

  // 結果なし or 両ターゲットとも null
  if (!result || (!result.target1 && !result.target2)) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8">
          <p className="text-center text-sm text-muted-foreground">
            ポケモンと技を入力すると
            <br />
            自動で計算されます
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        {/* 防御側1 */}
        {result.target1 && (
          <TargetSection
            targetName={target1Name || '防御側 1'}
            results={result.target1}
            patternLabels={patternLabels}
          />
        )}

        {result.target1 && result.target2 && <div className="border-t" />}

        {/* 防御側2 */}
        {result.target2 && (
          <TargetSection
            targetName={target2Name || '防御側 2'}
            results={result.target2}
            patternLabels={patternLabels}
          />
        )}

        {/* 数値詳細トグル */}
        <button
          type="button"
          onClick={onToggleDetailNumbers}
          className="flex w-full items-center justify-center gap-1 pt-2 text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {isDetailNumbersOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          {isDetailNumbersOpen ? '数値を隠す' : '数値を見る'}
        </button>

        {/* 数値詳細（折りたたみ） */}
        {isDetailNumbersOpen && (
          <div className="space-y-4 border-t pt-2">
            {result.target1 && (
              <TargetDetailRows
                label={target1Name || '防御側 1'}
                results={result.target1}
                patternLabels={patternLabels}
              />
            )}
            {result.target2 && (
              <TargetDetailRows
                label={target2Name || '防御側 2'}
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
