import type { Field, Weather } from "../types/damage";

/** 天候の日本語ラベル */
export const WEATHER_LABELS: Record<Weather, string> = {
  none: "なし",
  sun: "晴れ",
  rain: "雨",
  sandstorm: "砂嵐",
  snow: "雪",
};

/** フィールドの日本語ラベル */
export const FIELD_LABELS: Record<Field, string> = {
  none: "なし",
  electric: "エレキフィールド",
  grassy: "グラスフィールド",
  misty: "ミストフィールド",
  psychic: "サイコフィールド",
};

/** 天候のオプション配列（Select用） */
export const WEATHER_OPTIONS = Object.entries(WEATHER_LABELS).map(
  ([value, label]) => ({
    value: value as Weather,
    label,
  })
);

/** フィールドのオプション配列（Select用） */
export const FIELD_OPTIONS = Object.entries(FIELD_LABELS).map(
  ([value, label]) => ({
    value: value as Field,
    label,
  })
);

/** 全体技のターゲット値 */
export const SPREAD_MOVE_TARGETS = ["allAdjacentFoes", "allAdjacent"] as const;

/**
 * Check if a move target indicates a spread move (hits multiple targets).
 */
export function isSpreadMoveTarget(target: string): boolean {
  return (SPREAD_MOVE_TARGETS as readonly string[]).includes(target);
}
