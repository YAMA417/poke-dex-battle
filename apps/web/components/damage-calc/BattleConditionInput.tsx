import { Card, CardContent } from "@/components/ui/card";
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
  isCriticalHit: boolean;
  isReflect: boolean;
  isLightScreen: boolean;
  onWeatherChange: (weather: Weather) => void;
  onFieldChange: (field: Field) => void;
  onHelpingHandChange: (checked: boolean) => void;
  onCriticalHitChange: (checked: boolean) => void;
  onReflectChange: (checked: boolean) => void;
  onLightScreenChange: (checked: boolean) => void;
}

export function BattleConditionInput({
  weather,
  field,
  isHelpingHand,
  isCriticalHit,
  isReflect,
  isLightScreen,
  onWeatherChange,
  onFieldChange,
  onHelpingHandChange,
  onCriticalHitChange,
  onReflectChange,
  onLightScreenChange,
}: BattleConditionInputProps) {
  return (
    <Card className="border-t-2 border-t-primary/60">
      <CardContent className="py-3">
        <div className="flex flex-wrap items-end gap-4">
          {/* 天候 */}
          <div className="space-y-1 min-w-[120px]">
            <Label htmlFor="weather" className="text-xs">天候</Label>
            <Select
              value={weather}
              onValueChange={(value: string) => onWeatherChange(value as Weather)}
            >
              <SelectTrigger id="weather" className="h-8 text-sm">
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

          {/* フィールド */}
          <div className="space-y-1 min-w-[140px]">
            <Label htmlFor="field" className="text-xs">フィールド</Label>
            <Select
              value={field}
              onValueChange={(value: string) => onFieldChange(value as Field)}
            >
              <SelectTrigger id="field" className="h-8 text-sm">
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

          {/* てだすけ */}
          <div className="flex items-center space-x-2 pb-1">
            <Checkbox
              id="helpingHand"
              checked={isHelpingHand}
              onCheckedChange={onHelpingHandChange}
            />
            <Label htmlFor="helpingHand" className="text-xs font-normal cursor-pointer">
              てだすけ（1.5倍）
            </Label>
          </div>

          {/* 急所 */}
          <div className="flex items-center space-x-2 pb-1">
            <Checkbox
              id="criticalHit"
              checked={isCriticalHit}
              onCheckedChange={onCriticalHitChange}
            />
            <Label htmlFor="criticalHit" className="text-xs font-normal cursor-pointer">
              急所
            </Label>
          </div>

          {/* リフレクター */}
          <div className="flex items-center space-x-2 pb-1">
            <Checkbox
              id="reflect"
              checked={isReflect}
              onCheckedChange={onReflectChange}
            />
            <Label htmlFor="reflect" className="text-xs font-normal cursor-pointer">
              リフレクター（物理0.5倍）
            </Label>
          </div>

          {/* ひかりのかべ */}
          <div className="flex items-center space-x-2 pb-1">
            <Checkbox
              id="lightScreen"
              checked={isLightScreen}
              onCheckedChange={onLightScreenChange}
            />
            <Label htmlFor="lightScreen" className="text-xs font-normal cursor-pointer">
              ひかりのかべ（特殊0.5倍）
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
