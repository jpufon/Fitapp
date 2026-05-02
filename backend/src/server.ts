import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { config } from './config.js';
import { meRoutes } from './routes/me.js';
import { workoutRoutes } from './routes/workouts.js';
import { nutritionRoutes } from './routes/nutrition.js';
import { vitalityRoutes } from './routes/vitality.js';
import { homeRoutes } from './routes/home.js';
import { calendarRoutes } from './routes/calendar.js';
import { arenaRoutes } from './routes/arena.js';

async function buildServer() {
  const app = Fastify({
    logger: config.isDev
      ? {
          level: config.LOG_LEVEL,
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss.l' },
          },
        }
      : { level: config.LOG_LEVEL },
  });

  await app.register(cors, {
    origin: config.corsOrigins.length ? config.corsOrigins : true,
    credentials: true,
  });

  await app.register(sensible);

  app.get('/healthz', async () => ({
    status: 'ok',
    env: config.NODE_ENV,
    time: new Date().toISOString(),
  }));

  await app.register(meRoutes);
  await app.register(workoutRoutes);
  await app.register(nutritionRoutes);
  await app.register(vitalityRoutes);
  await app.register(homeRoutes);
  await app.register(calendarRoutes);
  await app.register(arenaRoutes);

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
