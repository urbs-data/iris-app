import { eq, sql } from 'drizzle-orm';
import {
  parseResumenParametrosExcel,
  type ParsedResumenParametroRow
} from '../parsers/resumen-parametros-parser';
import { isExcelFile } from '../parsing/utils';
import type { ETLContext, ETLProcessor, ETLResult } from './types';
import { DocumentType } from '../../constants/classifications';
import { resumenParametrosTable, type NewResumenParametro } from '@/db/schema';

const BATCH_SIZE = 500;

export class ResumenParametrosETL implements ETLProcessor {
  canProcess(ctx: ETLContext): boolean {
    return (
      ctx.tipo === DocumentType.ResumenParametros && isExcelFile(ctx.fileName)
    );
  }

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

    const parseResult = parseResumenParametrosExcel(ctx.buffer);

    if (!parseResult.success) {
      result.errors = parseResult.errors;
      return result;
    }

    result.stats.rowsParsed = parseResult.rows.length;

    await ctx.db.transaction(async (tx) => {
      await tx.execute(
        sql`select set_config('app.current_org', ${ctx.organizationId}, true)`
      );

      const deleted = await tx
        .delete(resumenParametrosTable)
        .where(eq(resumenParametrosTable.documento_origen, ctx.fileName))
        .returning();
      result.stats.deleted = deleted.length;

      const entities: NewResumenParametro[] = parseResult.rows.map((row) =>
        this.toEntity(row, ctx.organizationId, ctx.fileName, row.id_pozo)
      );

      let inserted = 0;
      for (let i = 0; i < entities.length; i += BATCH_SIZE) {
        const batch = entities.slice(i, i + BATCH_SIZE);
        const insertResult = await tx
          .insert(resumenParametrosTable)
          .values(batch)
          .returning();
        inserted += insertResult.length;
      }

      result.stats.inserted = inserted;
    });

    result.success = true;
    return result;
  }

  private toEntity(
    row: ParsedResumenParametroRow,
    organizationId: string,
    fileName: string,
    idPozo: string | null
  ): NewResumenParametro {
    return {
      id_resumen_parametros: crypto.randomUUID(),
      organization_id: organizationId,
      id_pozo: idPozo,
      fecha_hora_medicion: row.fecha_hora_medicion,
      olor: row.olor,
      apariencia_agua_inicio: row.apariencia_agua_inicio,
      apariencia_agua_estabilizacion: row.apariencia_agua_estabilizacion,
      documento_origen: fileName
    };
  }
}
