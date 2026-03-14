import type { DamageResult as DamageResultType } from '@poke-dex-battle/shared';

export interface TargetResult {
  attackerAOnly: DamageResultType | null;
  attackerBOnly: DamageResultType | null;
  combined: DamageResultType | null;
}

export interface DoubleBattleResult {
  target1: TargetResult | null;
  target2: TargetResult | null;
}
