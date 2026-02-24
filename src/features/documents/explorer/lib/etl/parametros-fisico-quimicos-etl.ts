import { sql, eq } from 'drizzle-orm';
import {
  parseParametrosFisicoQuimicosExcel,
  type ParsedParametroFisicoQuimicoRow
} from '../parsers/parametros-fisico-quimicos-parser';
import {
  parametrosFisicoQuimicosTable,
  type NewParametroFisicoQuimico
} from '@/db/schema';
import { isExcelFile } from '../parsing/utils';
import type { ETLProcessor, ETLContext, ETLResult } from './types';
import { DocumentType } from '../../constants/classifications';

const BATCH_SIZE = 500;

const PARAMETRO_ESTANDAR: Record<string, string> = {
  'Profundidad al agua': 'Profundidad al agua',
  'Oxígeno Disuelto': 'OD',
  pH: 'pH',
  Temperatura: 'Temp',
  'Conductividad Específica': 'CE',
  'Sólidos Totales Disueltos': 'STD',
  ORP: 'ORP',
  'Oxigeno Disuelto': 'OD',
  'Conductividad Especifica': 'CE',
  'Solidos Disueltos Totales': 'STD',
  Oxigeno_Disuelto: 'OD',
  Conductividad_Especifica: 'CE',
  Total_Solidos_Disueltos: 'STD',
  Nivel_estático_del_agua: 'Profundidad al agua'
};

export class ParametrosFisicoQuimicosETL implements ETLProcessor {
  canProcess(ctx: ETLContext): boolean {
    return (
      ctx.tipo === DocumentType.EDDParametrosFisicoQuimicos &&
      isExcelFile(ctx.fileName)
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

    const parseResult = parseParametrosFisicoQuimicosExcel(ctx.buffer);

    if (!parseResult.success) {
      result.errors = parseResult.errors;
      return result;
    }

    result.stats.rowsParsed = parseResult.rows.length;

    await ctx.db.transaction(async (tx) => {
      // Set organization context
      await tx.execute(
        sql`select set_config('app.current_org', ${ctx.organizationId}, true)`
      );

      // Delete existing data for this document
      const deleted = await tx
        .delete(parametrosFisicoQuimicosTable)
        .where(eq(parametrosFisicoQuimicosTable.documento_origen, ctx.fileName))
        .returning();
      result.stats.deleted = deleted.length;

      // Transform rows with lazy-loaded muestra lookup
      const entities: NewParametroFisicoQuimico[] = [];

      for (const row of parseResult.rows) {
        const entity = await this.toEntity(
          row,
          ctx.organizationId,
          ctx.fileName
        );
        entities.push(entity);
      }

      // Insert in batches
      let inserted = 0;
      for (let i = 0; i < entities.length; i += BATCH_SIZE) {
        const batch = entities.slice(i, i + BATCH_SIZE);
        const insertResult = await tx
          .insert(parametrosFisicoQuimicosTable)
          .values(batch)
          .returning();
        inserted += insertResult.length;
      }

      result.stats.inserted = inserted;
    });

    result.success = true;

    return result;
  }

  private async toEntity(
    row: ParsedParametroFisicoQuimicoRow,
    organizationId: string,
    fileName: string
  ): Promise<NewParametroFisicoQuimico> {
    return {
      id_parametro_fq: crypto.randomUUID(),
      organization_id: organizationId,
      fecha_hora_medicion: row.fecha_hora_medicion,
      id_pozo: row.id_pozo,
      programa_muestreo: row.programa_muestreo,
      muestra: row.field_sample_id,
      profundidad_inicio: row.profundidad_inicio,
      profundidad_fin: row.profundidad_fin,
      unidad_profundidad: row.unidad_profundidad,
      parametro: PARAMETRO_ESTANDAR[row.parametro] ?? row.parametro,
      valor_medicion: row.valor_medicion,
      unidad_medicion: row.unidad_medicion,
      comentarios: row.comentarios,
      documento_origen: fileName
    };
  }
}
