'use server';

import jwt from 'jsonwebtoken';

export async function getMetabaseToken(): Promise<string> {
  const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY;

  if (!METABASE_SECRET_KEY) {
    throw new Error('METABASE_SECRET_KEY is not configured');
  }

  const payload = {
    resource: { dashboard: 2 },
    params: {},
    exp: Math.round(Date.now() / 1000) + 10 * 60 // 10 minute expiration
  };

  return jwt.sign(payload, METABASE_SECRET_KEY);
}
