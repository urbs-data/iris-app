import type { Table } from 'drizzle-orm';
import type { ETLProcessor, ETLContext, ETLResult, ParseResult } from './types';

const BATCH_SIZE = 500;

export abstract class TruncateLoadETL<TRow, TEntity> implements ETLProcessor {
  abstract canProcess(ctx: ETLContext): boolean;
  abstract parse(buffer: Buffer): ParseResult<TRow>;
  abstract toEntity(row: TRow, organizationId: string): TEntity;
  abstract getTable(): Table;

  async process(ctx: ETLContext): Promise<ETLResult> {
    const result: ETLResult = {
      success: false,
      errors: [],
      stats: {
        rowsParsed: 0,
        deleted: 0,
        inserted: 0
      }
    };

    const parseResult = this.parse(ctx.buffer);

    if (!parseResult.success) {
      result.errors = parseResult.errors;
      return result;
    }

    result.stats.rowsParsed = parseResult.rows.length;

    const entities: TEntity[] = parseResult.rows.map((row) =>
      this.toEntity(row, ctx.organizationId)
    );

    try {
      await ctx.db.transaction(async (tx) => {
        const deleted = await tx.delete(this.getTable()).returning();
        result.stats.deleted = deleted.length;

        let inserted = 0;

        for (let i = 0; i < entities.length; i += BATCH_SIZE) {
          const batch = entities.slice(i, i + BATCH_SIZE);
          const insertResult = await tx
            .insert(this.getTable())
            .values(batch)
            .returning();
          inserted += insertResult.length;
        }

        result.stats.inserted = inserted;
      });

      result.success = true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      result.errors.push(`Error en la transacción de BD: ${message}`);
    }

    return result;
  }
}
