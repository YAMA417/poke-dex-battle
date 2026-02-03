"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface NatureModifierRadioProps {
  statName: string;
  value: 1.1 | 1.0 | 0.9;
  onChange: (modifier: 1.1 | 1.0 | 0.9) => void;
}

const MODIFIER_OPTIONS = [
  { value: "1.1", label: "1.1倍" },
  { value: "1.0", label: "1.0倍" },
  { value: "0.9", label: "0.9倍" },
] as const;

export function NatureModifierRadio({
  statName,
  value,
  onChange,
}: NatureModifierRadioProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{statName}の性格補正</Label>
      <RadioGroup
        value={value.toFixed(1)}
        onValueChange={(val: string) => onChange(Number(val) as 1.1 | 1.0 | 0.9)}
        className="flex space-x-4"
      >
        {MODIFIER_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`${statName}-${option.value}`} />
            <Label
              htmlFor={`${statName}-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
