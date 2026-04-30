// Mint a developer JWT for the mobile app to use as EXPO_PUBLIC_DEV_JWT.
// Run: npx tsx src/scripts/mint-dev-jwt.ts
//
// Output: JWT string + the user UUID it represents.
// Pass this to mobile so backend recognises requests without a real sign-in.

import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

async function main() {
  const userId = process.argv[2] ?? randomUUID();
  const email = `dev-${userId.slice(0, 8)}@walifit.dev`;
  const secretBytes = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);

  const jwt = await new SignJWT({
    sub: userId,
    email,
    role: 'authenticated',
    aud: 'authenticated',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretBytes);

  console.log('User UUID :', userId);
  console.log('Email     :', email);
  console.log('Expires in: 30 days');
  console.log();
  console.log('Add this to react-native/.env:');
  console.log(`EXPO_PUBLIC_DEV_JWT=${jwt}`);
}

main();
