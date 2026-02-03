import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DamageResult as DamageResultType } from "@poke-dex-battle/shared";

interface DamageResultProps {
  result: DamageResultType | null;
  defenderMaxHp?: number;
}

export function DamageResult({ result, defenderMaxHp }: DamageResultProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ダメージ計算結果</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            条件を入力して「計算する」ボタンを押してください
          </p>
        </CardContent>
      </Card>
    );
  }

  const { minDamage, maxDamage, minPercent, maxPercent, guaranteed, possible } =
    result;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ダメージ計算結果</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ダメージ範囲 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            ダメージ
          </h3>
          <div className="text-4xl font-bold">
            {minDamage} 〜 {maxDamage}
          </div>
          {defenderMaxHp && (
            <div className="text-lg text-muted-foreground">
              {minPercent.toFixed(1)}% 〜 {maxPercent.toFixed(1)}%
            </div>
          )}
        </div>

        {/* 確定数 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              最低乱数での確定数
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {possible === Infinity ? "倒せない" : `${possible}発`}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              最高乱数での確定数
            </div>
            <div className="text-3xl font-bold text-green-600">
              {guaranteed === Infinity ? "倒せない" : `${guaranteed}発`}
            </div>
          </div>
        </div>

        {/* ダメージバー（視覚化） */}
        {defenderMaxHp && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">ダメージ範囲</div>
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all"
                style={{
                  width: `${Math.min(maxPercent, 100)}%`,
                }}
              />
              <div
                className="absolute h-full border-l-4 border-green-600"
                style={{
                  left: `${Math.min(minPercent, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* デバッグ情報（開発時のみ表示） */}
        {result.details && process.env.NODE_ENV === "development" && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">
              計算詳細（開発用）
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
