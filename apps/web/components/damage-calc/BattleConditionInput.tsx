import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Field, Weather } from "@poke-dex-battle/shared";
import { WEATHER_OPTIONS, FIELD_OPTIONS } from "@poke-dex-battle/shared";

interface BattleConditionInputProps {
  weather: Weather;
  field: Field;
  isHelpingHand: boolean;
  isSpreadMove: boolean;
  isCriticalHit: boolean;
  onWeatherChange: (weather: Weather) => void;
  onFieldChange: (field: Field) => void;
  onHelpingHandChange: (checked: boolean) => void;
  onSpreadMoveChange: (checked: boolean) => void;
  onCriticalHitChange: (checked: boolean) => void;
}

export function BattleConditionInput({
  weather,
  field,
  isHelpingHand,
  isSpreadMove,
  isCriticalHit,
  onWeatherChange,
  onFieldChange,
  onHelpingHandChange,
  onSpreadMoveChange,
  onCriticalHitChange,
}: BattleConditionInputProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>戦闘環境</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 天候とフィールド */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weather">天候</Label>
            <Select
              value={weather}
              onValueChange={(value: string) =>
                onWeatherChange(value as Weather)
              }
            >
              <SelectTrigger id="weather">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEATHER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field">フィールド</Label>
            <Select
              value={field}
              onValueChange={(value: string) => onFieldChange(value as Field)}
            >
              <SelectTrigger id="field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ダブルバトル要素 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">ダブルバトル要素</h3>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="helpingHand"
              checked={isHelpingHand}
              onCheckedChange={onHelpingHandChange}
            />
            <Label
              htmlFor="helpingHand"
              className="text-sm font-normal cursor-pointer"
            >
              てだすけ（1.5倍）
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="spreadMove"
              checked={isSpreadMove}
              onCheckedChange={onSpreadMoveChange}
            />
            <Label
              htmlFor="spreadMove"
              className="text-sm font-normal cursor-pointer"
            >
              全体技（0.75倍）
            </Label>
          </div>
        </div>

        {/* その他 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">その他</h3>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="criticalHit"
              checked={isCriticalHit}
              onCheckedChange={onCriticalHitChange}
            />
            <Label
              htmlFor="criticalHit"
              className="text-sm font-normal cursor-pointer"
            >
              急所に当たる
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
