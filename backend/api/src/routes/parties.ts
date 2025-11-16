import { Hono } from 'hono';
import type { Party } from '@poke-dex-battle/shared';

const app = new Hono();

// サンプルデータ（Phase 2でDBに置き換え）
const sampleParties: Party[] = [
  {
    id: '1',
    name: 'サンプルパーティ',
    regulation: 'SV',
    memo: 'テスト用パーティ',
    pokemons: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// GET /api/parties - パーティ一覧取得
app.get('/', async (c) => {
  return c.json({
    data: sampleParties,
    total: sampleParties.length,
  });
});

// POST /api/parties - パーティ作成
app.post('/', async (c) => {
  const body = await c.req.json();
  const newParty: Party = {
    id: String(Date.now()),
    name: body.name,
    regulation: body.regulation || 'SV',
    memo: body.memo,
    pokemons: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  sampleParties.push(newParty);
  return c.json({ data: newParty }, 201);
});

// GET /api/parties/:id - パーティ詳細取得
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const party = sampleParties.find((p) => p.id === id);
  if (!party) {
    return c.json({ error: 'Party not found' }, 404);
  }
  return c.json({ data: party });
});

// PUT /api/parties/:id - パーティ更新
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const index = sampleParties.findIndex((p) => p.id === id);
  if (index === -1) {
    return c.json({ error: 'Party not found' }, 404);
  }
  sampleParties[index] = {
    ...sampleParties[index],
    ...body,
    updatedAt: new Date(),
  };
  return c.json({ data: sampleParties[index] });
});

// DELETE /api/parties/:id - パーティ削除
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const index = sampleParties.findIndex((p) => p.id === id);
  if (index === -1) {
    return c.json({ error: 'Party not found' }, 404);
  }
  sampleParties.splice(index, 1);
  return c.json({ message: 'Deleted' });
});

export { app as partiesRoutes };
