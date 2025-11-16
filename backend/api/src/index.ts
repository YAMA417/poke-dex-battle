import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { authRoutes } from './routes/auth';
import { partiesRoutes } from './routes/parties';
import { battlesRoutes } from './routes/battles';
import { calcRoutes } from './routes/calc';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'Poke Dex Battle API',
    version: '0.1.0',
    status: 'ok',
  });
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/parties', partiesRoutes);
app.route('/api/battles', battlesRoutes);
app.route('/api/calc', calcRoutes);

// Start server
const port = 8787;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
