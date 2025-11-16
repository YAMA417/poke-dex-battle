import { Hono } from 'hono';
import type { Battle } from '@poke-dex-battle/shared';

const app = new Hono();

// サンプルデータ（Phase 2でDBに置き換え）
const sampleBattles: Battle[] = [];

// GET /api/battles - 対戦履歴一覧
app.get('/', async (c) => {
  return c.json({
    data: sampleBattles,
    total: sampleBattles.length,
  });
});

// POST /api/battles - 対戦記録作成
app.post('/', async (c) => {
  const body = await c.req.json();
  const newBattle: Battle = {
    id: String(Date.now()),
    date: new Date(body.date),
    format: body.format,
    result: body.result,
    partyId: body.partyId,
    selectedPokemonIds: body.selectedPokemonIds || [],
    opponentParty: body.opponentParty,
    memo: body.memo,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  sampleBattles.push(newBattle);
  return c.json({ data: newBattle }, 201);
});

// GET /api/battles/stats - 統計情報
app.get('/stats', async (c) => {
  const wins = sampleBattles.filter((b) => b.result === 'win').length;
  const losses = sampleBattles.filter((b) => b.result === 'lose').length;
  const total = sampleBattles.length;

  return c.json({
    data: {
      total,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    },
  });
});

// GET /api/battles/:id - 対戦詳細
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const battle = sampleBattles.find((b) => b.id === id);
  if (!battle) {
    return c.json({ error: 'Battle not found' }, 404);
  }
  return c.json({ data: battle });
});

// PUT /api/battles/:id - 対戦記録更新
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const index = sampleBattles.findIndex((b) => b.id === id);
  if (index === -1) {
    return c.json({ error: 'Battle not found' }, 404);
  }
  sampleBattles[index] = {
    ...sampleBattles[index],
    ...body,
    updatedAt: new Date(),
  };
  return c.json({ data: sampleBattles[index] });
});

// DELETE /api/battles/:id - 対戦記録削除
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const index = sampleBattles.findIndex((b) => b.id === id);
  if (index === -1) {
    return c.json({ error: 'Battle not found' }, 404);
  }
  sampleBattles.splice(index, 1);
  return c.json({ message: 'Deleted' });
});

export { app as battlesRoutes };
