import {
  parseSubstancesExcel,
  type ParsedSubstanceRow
} from '../parsers/substances-parser';
import { substancesTable, type NewSubstance } from '@/db/schema';
import { TruncateLoadETL } from './truncate-load-etl';
import { isExcelFile } from '../parsing/utils';
import type { ETLContext } from './types';
import { Classification } from '../../constants/classifications';

function toNewSubstance(row: ParsedSubstanceRow): NewSubstance {
  return {
    id_sustancia: row.id_sustancia,
    nombre_ingles: row.nombre_ingles,
    nombre_espanol: row.nombre_espanol,
    alias: row.alias,
    categoria: row.categoria,
    nivel_guia: row.nivel_guia,
    unidad_guia: row.unidad_guia,
    nivel_guia_suelo: row.nivel_guia_suelo,
    unidad_guia_suelo: row.unidad_guia_suelo
  };
}

export class SubstancesETL extends TruncateLoadETL<
  ParsedSubstanceRow,
  NewSubstance
> {
  canProcess(ctx: ETLContext): boolean {
    return (
      ctx.classification === Classification.Sustancias &&
      isExcelFile(ctx.fileName)
    );
  }

  parse(buffer: Buffer) {
    return parseSubstancesExcel(buffer);
  }

  toEntity(row: ParsedSubstanceRow): NewSubstance {
    return toNewSubstance(row);
  }

  getTable() {
    return substancesTable;
  }
}
