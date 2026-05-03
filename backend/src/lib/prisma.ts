import { PrismaClient } from '@prisma/client';
import { config } from '../config.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// PRISMA_DEBUG=1 turns on query-level logging when you want it; default dev is
// quiet so test scripts and the dev server don't drown stdout.
const queryLogEnabled = process.env.PRISMA_DEBUG === '1';
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: queryLogEnabled ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (config.isDev) {
  global.__prisma = prisma;
}
