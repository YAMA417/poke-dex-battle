import type { DamageResult as DamageResultType } from "@poke-dex-battle/shared";

export interface DoubleBattleResult {
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
}
