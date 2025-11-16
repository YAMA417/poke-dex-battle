import { Hono } from 'hono';

const app = new Hono();

// POST /api/auth/register - ユーザー登録
app.post('/register', async (c) => {
  // Phase 2で実装
  return c.json({
    message: 'Register endpoint (Phase 2)',
    note: 'Will implement: email/password registration with bcrypt hashing',
  });
});

// POST /api/auth/login - ログイン
app.post('/login', async (c) => {
  // Phase 2で実装
  return c.json({
    message: 'Login endpoint (Phase 2)',
    note: 'Will implement: JWT access token + refresh token',
  });
});

// POST /api/auth/refresh - トークン更新
app.post('/refresh', async (c) => {
  // Phase 2で実装
  return c.json({
    message: 'Refresh endpoint (Phase 2)',
    note: 'Will implement: refresh token rotation',
  });
});

// POST /api/auth/logout - ログアウト
app.post('/logout', async (c) => {
  // Phase 2で実装
  return c.json({
    message: 'Logout endpoint (Phase 2)',
    note: 'Will implement: token invalidation',
  });
});

export { app as authRoutes };
