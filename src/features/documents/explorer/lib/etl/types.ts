import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbClient = NodePgDatabase<any>;

export interface ETLResult {
  success: boolean;
  errors: string[];
  stats: {
    rowsParsed: number;
    deleted: number;
    inserted: number;
  };
}

export interface ETLContext {
  db: DbClient;
  buffer: Buffer;
  fileName: string;
  classification: string;
  subClassification?: string;
}

export interface ETLProcessor {
  canProcess(ctx: ETLContext): boolean;
  process(ctx: ETLContext): Promise<ETLResult>;
}

export interface ParseResult<TRow> {
  success: boolean;
  rows: TRow[];
  errors: string[];
}
