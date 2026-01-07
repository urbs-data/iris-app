import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import { logger } from '@/lib/logger';

let poolInstance: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<ReturnType<typeof drizzle>> | null = null;

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

      dbInstance = drizzle({ client: poolInstance });

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
