import { jwtVerify, createRemoteJWKSet, decodeProtectedHeader, type JWTPayload } from 'jose';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { config } from '../config.js';

const secretBytes = new TextEncoder().encode(config.SUPABASE_JWT_SECRET.trim());

// Supabase JWKS endpoint for asymmetric (RS256, ES256, etc.) tokens.
const JWKS = createRemoteJWKSet(
  new URL(`${config.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`)
);

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
  try {
    const header = decodeProtectedHeader(token);
    
    // If it's HS256, we MUST use the symmetric secretBytes.
    // jwtVerify will throw if we give it a Uint8Array for asymmetric algs (RS256/ES256).
    if (header.alg === 'HS256') {
      const { payload } = await jwtVerify(token, secretBytes, { algorithms: ['HS256'] });
      return mapClaims(payload as SupabaseJwt);
    }

    // Otherwise, try the JWKS endpoint (handles RS256, ES256, etc.)
    const { payload } = await jwtVerify(token, JWKS);
    return mapClaims(payload as SupabaseJwt);
  } catch (err: any) {
    // Debugging: Log the header of the failing token
    try {
      const header = decodeProtectedHeader(token);
      console.warn(`JWT verify failed. alg=${header.alg} typ=${header.typ} err=${err.message}`);
    } catch (e) {
      console.warn(`JWT verify failed (header unparseable). err=${err.message}`);
    }
    throw err;
  }
}

function mapClaims(claims: SupabaseJwt): AuthUser {
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
    request.log.warn({ 
      err: (err as Error).message,
      tokenLength: token.length,
      tokenPrefix: token.slice(0, 10) + '...'
    }, 'jwt verify failed');
    return reply.code(401).send({ error: 'invalid_token' });
  }
};
