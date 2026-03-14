import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 実数値表示用の色設定
 */
export const STAT_COLORS = {
  base: 'bg-pokemon-blue',        // 基本値（EV=0の状態）
  evContribution: 'bg-orange-400', // EV増加分
} as const;
