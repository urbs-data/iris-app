import { parseLabExcel } from '../parsers/lab-parser';
import { extractEntities, type ExtractedEntities } from '../entity-extractor';
import { deleteDocumentData } from '../../data/delete-document-data';
import {
  upsertEstudios,
  upsertDocumentos,
  upsertEstudiosPozos,
  upsertMuestras,
  insertConcentraciones
} from '../../data/upsert-entities';
import { isExcelFile } from '../parsing/utils';
import type { ETLProcessor, ETLContext, ETLResult, DbClient } from './types';
import {
  Classification,
  SubClassification
} from '../../constants/classifications';

export class SamplesETL implements ETLProcessor {
  canProcess(ctx: ETLContext): boolean {
    const isSampleSubclassification =
      ctx.subClassification === SubClassification.MuestrasSuelo ||
      ctx.subClassification === SubClassification.MuestrasAgua;

    return (
      ctx.classification === Classification.Muestras &&
      isSampleSubclassification &&
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

    const parseResult = parseLabExcel(ctx.buffer, ctx.fileName);

    if (!parseResult.success) {
      result.errors = parseResult.errors;
      return result;
    }

    result.stats.rowsParsed = parseResult.rows.length;

    let entities: ExtractedEntities;
    try {
      entities = extractEntities(parseResult.rows);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      result.errors.push(`Error extrayendo entidades: ${message}`);
      return result;
    }

    try {
      await ctx.db.transaction(async (tx) => {
        const deleteResult = await deleteDocumentData(
          tx as DbClient,
          ctx.fileName
        );

        const totalDeleted =
          deleteResult.deletedConcentraciones +
          deleteResult.deletedMuestras +
          deleteResult.deletedEstudiosPozos +
          deleteResult.deletedDocumentos +
          deleteResult.deletedEstudios;

        result.stats.deleted = totalDeleted;

        const insertedEstudios = await upsertEstudios(
          tx as DbClient,
          entities.estudios
        );
        const insertedDocumentos = await upsertDocumentos(
          tx as DbClient,
          entities.documentos
        );
        const insertedEstudiosPozos = await upsertEstudiosPozos(
          tx as DbClient,
          entities.estudiosPozos
        );
        const insertedMuestras = await upsertMuestras(
          tx as DbClient,
          entities.muestras
        );
        const insertedConcentraciones = await insertConcentraciones(
          tx as DbClient,
          entities.concentraciones
        );

        result.stats.inserted =
          insertedEstudios +
          insertedDocumentos +
          insertedEstudiosPozos +
          insertedMuestras +
          insertedConcentraciones;
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
