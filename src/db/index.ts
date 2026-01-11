import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import { logger } from '@/lib/logger';
import { Logger } from 'drizzle-orm';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

let poolInstance: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<ReturnType<typeof drizzle>> | null = null;
class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    // const timestamp = Date.now();
    // const baseDir = process.cwd() + '/queries';
    // mkdirSync(baseDir, { recursive: true });
    // const queryFile = join(baseDir, `${timestamp}_query.sql`);
    // const paramsFile = join(baseDir, `${timestamp}_params.sql`);
    // writeFileSync(queryFile, typeof query === 'string' ? query : String(query));
    // writeFileSync(paramsFile, JSON.stringify(params, null, 2));
  }
}

async function getDb(): Promise<ReturnType<typeof drizzle>> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      let poolOptions: PoolConfig;

      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
      }

      poolOptions = {
        connectionString,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      };
      poolInstance = new Pool(poolOptions);

      dbInstance = drizzle({ client: poolInstance, logger: new MyLogger() });

      return dbInstance;
    } catch (error) {
      logger('[DB] Error during database initialization:', error);
      if (error instanceof Error) {
        logger('[DB] Error message:', error.message);
        logger('[DB] Error stack:', error.stack);
      }
      throw error;
    }
  })();

  return initPromise;
}

export default getDb;
export { getDb };
