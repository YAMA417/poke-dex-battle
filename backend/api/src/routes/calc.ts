import { Hono } from 'hono';
import { calcActualStats } from '@poke-dex-battle/shared';
import type { BaseStats, Stats, Nature } from '@poke-dex-battle/shared';

const app = new Hono();

// POST /api/calc/stats - 実数値計算
app.post('/stats', async (c) => {
  const body = await c.req.json();

  const { baseStats, abilityPoints, nature } = body as {
    baseStats: BaseStats;
    abilityPoints: Stats;
    nature: Nature;
  };

  const actualStats = calcActualStats(baseStats, abilityPoints, nature);

  return c.json({
    data: {
      actualStats,
      input: { baseStats, abilityPoints, nature },
    },
  });
});

// POST /api/calc/damage - ダメージ計算（Phase 1-1で実装）
app.post('/damage', async (c) => {
  return c.json({
    message: 'Damage calculation endpoint',
    note: 'Full implementation in Phase 1-1',
    // サンプルレスポンス
    data: {
      minDamage: 0,
      maxDamage: 0,
      minPercent: 0,
      maxPercent: 0,
      koChance: {
        ohko: 0,
        thko: 0,
      },
    },
  });
});

export { app as calcRoutes };
