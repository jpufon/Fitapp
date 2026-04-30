import { jwtVerify, type JWTPayload } from 'jose';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { config } from '../config.js';

const secretBytes = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);

export type AuthUser = {
  id: string;       // Supabase user UUID (sub)
  email?: string;
  role: string;     // 'authenticated' | 'service_role' | 'anon'
};

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

type SupabaseJwt = JWTPayload & {
  sub: string;
  email?: string;
  role?: string;
};

export async function verifyJwt(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, secretBytes, {
    algorithms: ['HS256'],
  });

  const claims = payload as SupabaseJwt;
  if (!claims.sub) {
    throw new Error('JWT missing sub claim');
  }

  return {
    id: claims.sub,
    email: claims.email,
    role: claims.role ?? 'authenticated',
  };
}

export const requireAuth: preHandlerHookHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'missing_bearer_token' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return reply.code(401).send({ error: 'empty_token' });
  }

  try {
    request.user = await verifyJwt(token);
  } catch (err) {
    request.log.warn({ err: (err as Error).message }, 'jwt verify failed');
    return reply.code(401).send({ error: 'invalid_token' });
  }
};
