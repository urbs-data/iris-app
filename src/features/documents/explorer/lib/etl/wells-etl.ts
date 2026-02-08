import { parseWellsExcel, type ParsedWellRow } from '../parsers/wells-parser';
import { getAreaForPoint } from '@/shared/lib/berazategui-geojson';
import { pozosTable, type NewPozo } from '@/db/schema';
import { TruncateLoadETL } from './truncate-load-etl';
import { isExcelFile } from '../parsing/utils';
import type { ETLContext } from './types';
import { DocumentType } from '../../constants/classifications';

function toNewPozo(row: ParsedWellRow, organizationId: string): NewPozo {
  let area: string | null = null;

  if (row.longitud_decimal !== null && row.latitud_decimal !== null) {
    area = getAreaForPoint(row.longitud_decimal, row.latitud_decimal);
  }

  if (!area) {
    area = 'Resto';
  }

  return {
    id_pozo: row.id_pozo,
    organization_id: organizationId,
    tipo: row.tipo,
    elevacion_terreno: row.elevacion_terreno,
    coordenada_norte: row.coordenada_norte,
    coordenada_este: row.coordenada_este,
    latitud_decimal: row.latitud_decimal,
    longitud_decimal: row.longitud_decimal,
    fecha_relevamiento: row.fecha_relevamiento,
    responsable_relevamiento: row.responsable_relevamiento,
    empresa_relevamiento: row.empresa_relevamiento,
    comentarios: row.comentarios,
    descripcion: row.descripcion,
    area
  };
}

export class WellsETL extends TruncateLoadETL<ParsedWellRow, NewPozo> {
  canProcess(ctx: ETLContext): boolean {
    return ctx.tipo === DocumentType.Pozos && isExcelFile(ctx.fileName);
  }

  parse(buffer: Buffer) {
    return parseWellsExcel(buffer);
  }

  toEntity(row: ParsedWellRow, organizationId: string): NewPozo {
    return toNewPozo(row, organizationId);
  }

  getTable() {
    return pozosTable;
  }
}
