'use server';

import { Output, generateText } from 'ai';
import { eq } from 'drizzle-orm';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { model } from '@/lib/ai';
import { getBlobContainer } from '@/lib/azure-blob';
import { buildPdfBuffer, Informe, InformeSchema } from '@/lib/pdf';
import { reportsTable, reporteConfiguracionesTable } from '@/db/schema';
import { type ReportType } from '../lib/types';
import { generateAiPdfFromReportSchema } from './generate-ai-pdf-from-report-schema';

type ReportSourceFile = {
  fileName: string;
  content: Buffer;
};

type SheetPreview = {
  sheet: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
  filteredNdRows?: number;
};

type LlmInputFile = {
  reportType: ReportType;
  fileName: string | null;
  workbookName?: string;
  sheets: SheetPreview[];
};

const TITLE_PREFIX_BY_REPORT_TYPE: Record<ReportType, string> = {
  well_depth: 'ProfundidadAlAgua',
  sampling_params: 'ParametrosMuestreo',
  sampling_params_cig: 'ParametrosMuestreoCIG',
  injection_params_cig: 'ParametrosInyeccionCIG',
  volatile_concentrations_cig: 'ConcentracionesVolatilesCIG',
  inorganic_concentrations_cig: 'ConcentracionesInorgánicasCIG',
  concentrations: 'Concentraciones',
  analysis_performed: 'AvanceTareasRemediación',
  well_depth_cig: 'ProfundidadAlAguaCIG'
};

const PREVIEW_MAX_COLS = 12;
const PREVIEW_MAX_ROWS = 25;
const PREVIEW_MAX_SHEETS = 6;
const COMPACT_MAX_SHEETS = 2;
const COMPACT_MAX_COLS = 8;
const COMPACT_MAX_ROWS = 8;

function normalizeToken(value: string): string {
  return value.trim().toUpperCase();
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function buildBlobName(
  orgId: string,
  reportId: string,
  reportName: string
): string {
  return `reportes/${orgId}/${reportId}/${reportName}.ai.pdf`;
}

async function streamToBuffer(
  readableStream: NodeJS.ReadableStream
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => resolve(Buffer.concat(chunks)));
    readableStream.on('error', reject);
  });
}

function resolveBlobName(input: string, containerName: string): string {
  let raw = decodeURIComponent(input).split('?')[0];

  try {
    const url = new URL(raw);
    raw = url.pathname;
  } catch {
    // input already is a relative blob path, not a full URL
  }

  raw = raw.replace(/^\/+/, '');
  if (raw.startsWith(`${containerName}/`)) {
    return raw.slice(containerName.length + 1);
  }

  const marker = `/${containerName}/`;
  if (raw.includes(marker)) {
    return raw.split(marker).pop() ?? raw;
  }

  return raw;
}

async function downloadBlobAsBuffer(blobPath: string): Promise<Buffer> {
  const container = getBlobContainer();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;
  const blobName = resolveBlobName(blobPath, containerName);
  const response = await container.getBlobClient(blobName).download();

  if (!response.readableStreamBody) {
    throw new Error('No se pudo leer el archivo de origen en Data Lake');
  }

  return streamToBuffer(response.readableStreamBody);
}

async function extractReportFiles(
  sourceBuffer: Buffer,
  sourceFileName: string,
  isZip: boolean
): Promise<ReportSourceFile[]> {
  if (!isZip) {
    return [{ fileName: sourceFileName, content: sourceBuffer }];
  }

  const zip = await JSZip.loadAsync(sourceBuffer);
  const files = Object.values(zip.files).filter(
    (entry) =>
      !entry.dir && /\.(xlsx|xls)$/i.test(entry.name.split('/').pop() ?? '')
  );

  const extracted = await Promise.all(
    files.map(async (file) => ({
      fileName: file.name.split('/').pop() ?? file.name,
      content: await file.async('nodebuffer')
    }))
  );

  if (extracted.length === 0) {
    throw new Error('No se encontraron archivos XLSX/XLS dentro del ZIP');
  }

  return extracted;
}

// Filters rows where every cell is empty or 'ND', and replaces remaining 'ND' cells with ''
function cleanNdRows(rows: string[][]): { rows: string[][]; removed: number } {
  let removed = 0;
  const result: string[][] = [];

  for (const row of rows) {
    const hasDetectable = row.some((v) => {
      const t = normalizeToken(v);
      return t !== '' && t !== 'ND';
    });

    if (!hasDetectable) {
      removed++;
      continue;
    }

    result.push(row.map((cell) => (normalizeToken(cell) === 'ND' ? '' : cell)));
  }

  return { rows: result, removed };
}

function toSheetPreview(
  sheet: XLSX.WorkSheet,
  reportType: ReportType
): SheetPreview {
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false
  });

  let rows = rawRows.map((row) =>
    (Array.isArray(row) ? row : [row]).map((cell) => stringifyCell(cell))
  );

  let filteredNdRows = 0;
  if (reportType === 'concentrations') {
    const cleaned = cleanNdRows(rows);
    rows = cleaned.rows;
    filteredNdRows = cleaned.removed;
  }

  const headerRowIndex = rows.findIndex((row) =>
    row.some((value) => normalizeToken(value) !== '')
  );
  const headers = (rows[headerRowIndex] ?? []).slice(0, PREVIEW_MAX_COLS);

  const dataRows = rows
    .slice(headerRowIndex !== -1 ? headerRowIndex + 1 : 0)
    .filter((row) => row.some((value) => normalizeToken(value) !== ''))
    .slice(0, PREVIEW_MAX_ROWS)
    .map((row) => row.slice(0, PREVIEW_MAX_COLS));

  return {
    sheet: '', // overwritten by buildWorkbookPreview with the real sheet name
    headers,
    rows: dataRows,
    totalRows: rows.length,
    filteredNdRows: reportType === 'concentrations' ? filteredNdRows : undefined
  };
}

function buildWorkbookPreview(
  buffer: Buffer,
  reportType: ReportType
): { sheets: SheetPreview[]; workbookName: string } {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheets = workbook.SheetNames.slice(0, PREVIEW_MAX_SHEETS).map(
    (sheetName) => ({
      ...toSheetPreview(workbook.Sheets[sheetName], reportType),
      sheet: sheetName
    })
  );

  return { sheets, workbookName: workbook.SheetNames.join(', ') };
}

function assignFilesByReportType(
  files: ReportSourceFile[],
  reportTypes: ReportType[]
): Array<{ reportType: ReportType; file: ReportSourceFile | null }> {
  const available = [...files];

  return reportTypes.map((reportType) => {
    const normalizedPrefix = normalizeName(
      TITLE_PREFIX_BY_REPORT_TYPE[reportType] ?? ''
    );
    const idx = available.findIndex((file) =>
      normalizeName(file.fileName).includes(normalizedPrefix)
    );
    // Falls back to the first available file if no name match is found
    const pickedIndex = idx !== -1 ? idx : 0;
    const picked = available.splice(pickedIndex, 1)[0] ?? null;
    return { reportType, file: picked };
  });
}

function buildPayloadFiles(
  assigned: Array<{ reportType: ReportType; file: ReportSourceFile | null }>
): LlmInputFile[] {
  return assigned.map(({ reportType, file }) => {
    if (!file) {
      return {
        reportType,
        fileName: null,
        workbookName: undefined,
        sheets: []
      };
    }

    const { sheets, workbookName } = buildWorkbookPreview(
      file.content,
      reportType
    );
    return { reportType, fileName: file.fileName, workbookName, sheets };
  });
}

const BASE_SYSTEM_PROMPT = `Sos un redactor técnico ambiental.
Tu trabajo es generar un informe ESTRICTAMENTE DESCRIPTIVO basado en tablas de monitoreo.

REGLAS OBLIGATORIAS:
- NO interpretar causas, tendencias ni relaciones causales.
- NO dar recomendaciones ni conclusiones normativas.
- NO inferir datos faltantes ni completar vacíos.
- Describir únicamente lo que aparece en los datos de entrada.
- Si hay campos faltantes, indicarlo explícitamente como "dato no disponible".
- Mantener tono técnico, neutro y verificable.
- Responder SOLO con JSON que cumpla exactamente el schema solicitado.

REGLAS CRÍTICAS SOBRE EL USO DE TABLAS:
- PROHIBIDO reproducir o transcribir las tablas de los datos de entrada. El usuario ya tiene esos datos en el archivo Excel original.
- El contenido del informe debe ser TEXTO DESCRIPTIVO que sintetice los datos: qué parámetros se midieron, en qué pozos/puntos, qué rangos de valores se observaron.
- Las tablas (tipo "tabla" en el schema) se deben usar ÚNICAMENTE para mostrar información derivada o resumida que agregue valor, por ejemplo:
    * Mínimo y máximo de una variable por pozo o período.
    * Comparación de valores entre puntos de monitoreo.
    * Resumen de presencia/ausencia de parámetros.
    * Conteo de mediciones o registros por categoría.
- Si no existe información derivada relevante para mostrar en tabla, usar párrafos o listas en su lugar.
- Nunca incluir una tabla con las mismas columnas y filas que ya vienen en los datos de entrada.

REGLAS DE LENGUAJE NATURAL:
- PROHIBIDO usar nombres de campos internos del JSON de entrada (como claves, tipos de reporte o propiedades técnicas del payload) en el texto del informe.
- Reemplazarlos por lenguaje natural equivalente: por ejemplo, si el tipo de reporte es "sampling_params_cig", escribir "parámetros de muestreo CIG"; si una propiedad indica cantidad de registros, escribir "la cantidad de registros disponibles".
- EXCEPCIÓN: los nombres de archivos deben reproducirse exactamente como aparecen en los datos de entrada.
- El lector del informe no debe ver rastros de la estructura interna del sistema que lo generó.

Estructura requerida:
1) Resumen ejecutivo: texto narrativo que sintetice los datos de entrada.
2) Secciones por tipo de reporte: texto narrativo + tablas resumen opcionales.
3) Hallazgos observacionales puntuales: SIN INTERPRETACIÓN.
4) Cierre descriptivo`;

const FULL_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Reglas extra de formato JSON:
- Incluir SIEMPRE todas las keys de cada bloque.
- Cuando un campo no aplique, usar null.
- NO omitir campos del schema.`;

const COMPACT_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

IMPORTANTE:
- Entrada compactada por límites de contexto.
- Priorizar precisión estructural del JSON.
- Incluir SIEMPRE todas las keys del schema, usando null cuando corresponda.`;

function createPrompt(input: {
  reportName: string;
  range: { from: Date; to: Date };
  files: LlmInputFile[];
  compact?: boolean;
}): string {
  return JSON.stringify(
    {
      contexto: {
        nombre_reporte: input.reportName,
        periodo: {
          desde: input.range.from.toISOString(),
          hasta: input.range.to.toISOString()
        },
        regla_critica:
          'Contenido exclusivamente descriptivo en texto narrativo. PROHIBIDO reproducir las tablas de los datos de entrada. Las tablas solo se usan para información derivada o resumida (mínimos, máximos, comparaciones). Queda prohibida toda interpretación.',
        modo_compacto: Boolean(input.compact)
      },
      datos: input.files
    },
    null,
    2
  );
}

function compactPayloadFiles(files: LlmInputFile[]): LlmInputFile[] {
  return files.map((file) => ({
    ...file,
    sheets: file.sheets.slice(0, COMPACT_MAX_SHEETS).map((sheet) => ({
      ...sheet,
      headers: sheet.headers.slice(0, COMPACT_MAX_COLS),
      rows: sheet.rows
        .slice(0, COMPACT_MAX_ROWS)
        .map((row) => row.slice(0, COMPACT_MAX_COLS))
    }))
  }));
}

async function generateInformeWithFallback(input: {
  reportName: string;
  range: { from: Date; to: Date };
  files: LlmInputFile[];
}): Promise<Informe> {
  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: InformeSchema }),
      system: FULL_SYSTEM_PROMPT,
      prompt: createPrompt(input),
      maxOutputTokens: 2200
    });

    return output as Informe;
  } catch (error) {
    const isNoOutput =
      error instanceof Error &&
      (error.name.includes('AI_NoOutputGeneratedError') ||
        error.message.includes('No output generated'));

    if (!isNoOutput) throw error;

    const { output } = await generateText({
      model,
      output: Output.object({ schema: InformeSchema }),
      system: COMPACT_SYSTEM_PROMPT,
      prompt: createPrompt({
        ...input,
        files: compactPayloadFiles(input.files),
        compact: true
      }),
      maxOutputTokens: 1800
    });

    return output as Informe;
  }
}

export const generateAiPdfFromReport = authOrganizationActionClient
  .metadata({ actionName: 'generateAiPdfFromReport' })
  .inputSchema(generateAiPdfFromReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const container = getBlobContainer();

    const reportRows = await ctx.db
      .select()
      .from(reportsTable)
      .where(eq(reportsTable.id_reporte, parsedInput.reportId))
      .limit(1);
    if (!reportRows) throw new Error('No se encontró el reporte solicitado');

    const report = reportRows[0];

    const blobName = buildBlobName(
      ctx.organization.id,
      parsedInput.reportId,
      report.nombre_archivo
    );
    const cachedBlobClient = container.getBlobClient(blobName);

    const [configs, isCached] = await Promise.all([
      ctx.db
        .select({ reportType: reporteConfiguracionesTable.tipo_reporte })
        .from(reporteConfiguracionesTable)
        .where(
          eq(reporteConfiguracionesTable.id_reporte, parsedInput.reportId)
        ),
      parsedInput.forceRegenerate
        ? Promise.resolve(false)
        : cachedBlobClient.exists()
    ]);

    if (configs.length === 0)
      throw new Error('El reporte no tiene configuraciones asociadas');

    if (isCached) {
      return {
        blobPath: cachedBlobClient.url,
        reused: true,
        fileName: `${report.nombre_archivo}.ai.pdf`
      };
    }

    const reportTypes = configs.map((c) => c.reportType as ReportType);

    const sourceBuffer = await downloadBlobAsBuffer(report.url_archivo);
    const sourceBlobName = resolveBlobName(
      report.url_archivo,
      process.env.AZURE_STORAGE_CONTAINER_NAME!
    );

    const sourceFiles = await extractReportFiles(
      sourceBuffer,
      sourceBlobName.split('/').pop() ?? report.nombre_archivo,
      report.extension === 'zip' || reportTypes.length > 1
    );

    const payloadFiles = buildPayloadFiles(
      assignFilesByReportType(sourceFiles, reportTypes)
    );

    const output = await generateInformeWithFallback({
      reportName: report.nombre_archivo,
      range: {
        from: toDate(report.fecha_desde),
        to: toDate(report.fecha_hasta)
      },
      files: payloadFiles
    });

    const pdfBuffer = await buildPdfBuffer(output as Informe);
    await container.getBlockBlobClient(blobName).uploadData(pdfBuffer, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' }
    });

    return {
      blobPath: cachedBlobClient.url,
      reused: false,
      fileName: `${report.nombre_archivo}.ai.pdf`
    };
  });
