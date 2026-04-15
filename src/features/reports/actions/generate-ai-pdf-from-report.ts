'use server';

import { getLocale } from 'next-intl/server';
import { Output, generateText } from 'ai';
import { eq } from 'drizzle-orm';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { model } from '@/lib/ai';
import { getBlobContainer } from '@/lib/azure-blob';
import { buildPdfBuffer, Informe, InformeSchema } from '@/lib/pdf';
import { reportsTable, reporteConfiguracionesTable } from '@/db/schema';
import { type ReportType } from '../lib/types';
import { generateAiPdfFromReportSchema } from './generate-ai-pdf-from-report-schema';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportSourceFile = {
  fileName: string;
  content: Buffer;
};

/** Compact statistical summary for a numeric column/parameter. */
type NumericStats = {
  min: number;
  max: number;
  mean: number;
  count: number;
};

/** Summary for well_depth report type (tall table: wells as rows). */
type WellDepthSummary = {
  wells: string[];
  dates: string[];
  totalRows: number;
  columns: Array<{
    name: string;
    stats: NumericStats | null; // null if all values are empty
  }>;
};

/** Summary for sampling_params / sampling_params_cig (wide: wells as columns). */
type SamplingParamsSummary = {
  wells: string[];
  dates: string[];
  parameters: Array<{
    name: string;
    unit: string;
    quantificationLimit: string;
    stats: NumericStats;
  }>;
  qualitativeNotes: string[]; // e.g. "Olor: No en todos los pozos excepto PZ2 (olor fétido)"
};

/** Summary for a single compound in concentrations report. */
type CompoundSummary = {
  name: string;
  unit: string;
  quantificationLimit: string;
  guidelineLevel: string | null;
  detectedCount: number;
  ndCount: number;
  belowLimitCount: number;
  minDetected: number | null;
  maxDetected: number | null;
  wellsDetected: string[];
};

/** Summary for concentrations report type (wide: wells as columns). */
type ConcentrationsSummary = {
  wells: string[];
  dates: string[];
  totalCompounds: number;
  compounds: CompoundSummary[];
};

/** Summary for analysis_performed (small table, sent as-is). */
type AnalysisPerformedSummary = {
  totalRecords: number;
  dateRange: { from: string; to: string };
  wells: string[];
  qaqcCodes: string[];
  analysisTypes: string[];
  records: Array<Record<string, string>>; // raw rows — table is small
};

/** Union of all summary types per report. */
type ReportSummary =
  | { kind: 'well_depth'; data: WellDepthSummary }
  | { kind: 'sampling_params'; data: SamplingParamsSummary }
  | { kind: 'concentrations'; data: ConcentrationsSummary }
  | { kind: 'analysis_performed'; data: AnalysisPerformedSummary }
  | { kind: 'raw_preview'; data: RawPreview }; // fallback

type RawPreview = {
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
};

/** What we send to the LLM per file. */
type LlmInputFile = {
  reportType: ReportType;
  fileName: string | null;
  summary: ReportSummary | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

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

/** Report types that use the "tall" layout (wells as rows). */
const TALL_REPORT_TYPES: ReportType[] = ['well_depth', 'well_depth_cig'];

/** Max sample rows for the raw fallback preview. */
const RAW_PREVIEW_MAX_ROWS = 30;
const RAW_PREVIEW_MAX_COLS = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeToken(value: string): string {
  return value.trim().toUpperCase();
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().split('T')[0];
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

/** Group wells by prefix for compact representation. */
type WellGroup = { prefix: string; count: number; wells: string[] };

function groupWellsByPrefix(wells: string[]): WellGroup[] {
  const groups = new Map<string, string[]>();
  for (const w of wells) {
    const match = w.match(/^([a-zA-Z]+)/);
    const prefix = match?.[1] ?? w;
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push(w);
  }
  return Array.from(groups.entries())
    .map(([prefix, members]) => ({
      prefix,
      count: members.length,
      wells: members.sort()
    }))
    .sort((a, b) => a.prefix.localeCompare(b.prefix));
}

/** Format date range as "YYYY-MM-DD to YYYY-MM-DD". */
function formatDateRange(dates: string[]): string {
  const sorted = [...dates].sort();
  if (sorted.length === 0) return 'N/A';
  if (sorted.length === 1) return sorted[0];
  return `${sorted[0]} to ${sorted[sorted.length - 1]}`;
}

function isNumericString(v: string): boolean {
  if (v === '' || v === 'ND' || v === 'nd') return false;
  // handle "< 0.3" style → not purely numeric but has a number
  return !isNaN(parseFloat(v.replace(/[<>≤≥]/g, '').trim()));
}

function parseNumeric(v: string): number | null {
  const cleaned = v.replace(/[<>≤≥]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function computeStats(values: number[]): NumericStats | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: Math.round((sum / values.length) * 1000) / 1000,
    count: values.length
  };
}

function formatDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().split('T')[0];
  if (typeof v === 'string' && v.includes('T')) return v.split('T')[0];
  return String(v ?? '');
}

// ─── Workbook reading ─────────────────────────────────────────────────────────

function readAllRows(sheet: XLSX.WorkSheet): string[][] {
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false
  });
  return rawRows.map((row) =>
    (Array.isArray(row) ? row : [row]).map((cell) => stringifyCell(cell))
  );
}

function readAllRowsRaw(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true
  });
}

// ─── Summary builders by report type ──────────────────────────────────────────

/**
 * well_depth / well_depth_cig: Tall table.
 * Row 0 = headers. Each subsequent row = one well + one date + numeric values.
 */
function buildWellDepthSummary(buffer: Buffer): WellDepthSummary {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = readAllRowsRaw(sheet);
  const strRows = readAllRows(sheet);

  // First non-empty row is the header
  const headerIdx = strRows.findIndex((r) =>
    r.some((v) => normalizeToken(v) !== '')
  );
  const headers = strRows[headerIdx] ?? [];
  const dataRows = rawRows.slice(headerIdx + 1);
  const strDataRows = strRows.slice(headerIdx + 1);

  // Column 0 = well ID, column 1 = date, rest = numeric
  const wells = new Set<string>();
  const dates = new Set<string>();
  // Per-column numeric values
  const colValues: Map<number, number[]> = new Map();

  for (let i = 0; i < dataRows.length; i++) {
    const raw = dataRows[i];
    const str = strDataRows[i];
    const wellId = str[0];
    if (!wellId || normalizeToken(wellId) === 'PROMEDIOS') continue;

    wells.add(wellId);
    if (raw[1]) dates.add(formatDate(raw[1]));

    for (let c = 2; c < headers.length; c++) {
      const val = parseNumeric(str[c]);
      if (val !== null) {
        if (!colValues.has(c)) colValues.set(c, []);
        colValues.get(c)!.push(val);
      }
    }
  }

  const columns = headers.slice(2).map((name, idx) => ({
    name,
    stats: computeStats(colValues.get(idx + 2) ?? [])
  }));

  return {
    wells: Array.from(wells).sort(),
    dates: Array.from(dates).sort(),
    totalRows: dataRows.length,
    columns
  };
}

/**
 * sampling_params / sampling_params_cig / injection_params_cig: Wide table.
 * Row 0 = dates across columns.
 * Row 1 = well names across columns.
 * Row 2 = column header labels (Parámetros | Límite | Unidades | ...).
 * Row 3+ = one row per parameter, values in each well column.
 */
function buildSamplingParamsSummary(buffer: Buffer): SamplingParamsSummary {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = readAllRowsRaw(sheet);
  const strRows = readAllRows(sheet);

  // Find the row with "Pozo" to locate well names
  const wellRowIdx = strRows.findIndex((r) =>
    r.some((v) => normalizeToken(v) === 'POZO')
  );
  // Find the row with dates
  const dateRowIdx = strRows.findIndex((r) =>
    rawRows[strRows.indexOf(r)]?.some((v) => v instanceof Date)
  );

  // Extract wells from the well row (skip first columns which are labels)
  const wellRow = strRows[wellRowIdx] ?? [];
  const dateRawRow = rawRows[dateRowIdx] ?? [];

  // Find where data columns start (first column that has a well name)
  const dataColStart = wellRow.findIndex(
    (v, i) => i > 0 && v !== '' && normalizeToken(v) !== 'POZO'
  );

  const wells: string[] = [];
  const dates = new Set<string>();
  for (let c = dataColStart; c < wellRow.length; c++) {
    if (wellRow[c]) wells.push(wellRow[c]);
    if (dateRawRow[c] instanceof Date) dates.add(formatDate(dateRawRow[c]));
  }

  // Find the header row (row with "Parámetros" or similar)
  const paramHeaderIdx = strRows.findIndex((r) =>
    r.some(
      (v) =>
        normalizeToken(v).includes('PARAM') ||
        normalizeToken(v).includes('PARÁMETRO')
    )
  );

  // Data rows start after the parameter header
  const dataStartIdx =
    paramHeaderIdx !== -1 ? paramHeaderIdx + 1 : (wellRowIdx ?? 0) + 2;

  const parameters: SamplingParamsSummary['parameters'] = [];
  const qualitativeNotes: string[] = [];

  for (let r = dataStartIdx; r < strRows.length; r++) {
    const row = strRows[r];
    const paramName = row[0];
    if (!paramName) continue;

    // Collect numeric values from all well columns
    const numericValues: number[] = [];
    for (let c = dataColStart; c < row.length; c++) {
      const val = parseNumeric(row[c]);
      if (val !== null) numericValues.push(val);
    }

    if (numericValues.length > 0) {
      const stats = computeStats(numericValues)!;
      parameters.push({
        name: paramName,
        unit: row[2] ?? '',
        quantificationLimit: row[1] ?? '',
        stats
      });
    } else {
      // Qualitative row — summarize distinct non-empty values
      const distinctValues = new Set<string>();
      for (let c = dataColStart; c < row.length; c++) {
        if (row[c] && normalizeToken(row[c]) !== '') {
          distinctValues.add(row[c]);
        }
      }
      if (distinctValues.size > 0) {
        qualitativeNotes.push(
          `${paramName}: ${Array.from(distinctValues).join(', ')}`
        );
      }
    }
  }

  return {
    wells,
    dates: Array.from(dates).sort(),
    parameters,
    qualitativeNotes
  };
}

/**
 * concentrations / volatile_concentrations_cig / inorganic_concentrations_cig:
 * Wide table, similar structure to sampling_params but with ND handling.
 * Row 0 = dates, Row 1 = wells, Row 2-3 = CCC/PI codes, Row 4 = column headers
 * Row 5+ = one row per compound.
 */
function buildConcentrationsSummary(buffer: Buffer): ConcentrationsSummary {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = readAllRowsRaw(sheet);
  const strRows = readAllRows(sheet);

  // Locate well row
  const wellRowIdx = strRows.findIndex((r) =>
    r.some((v) => normalizeToken(v) === 'POZO')
  );
  const dateRowIdx = strRows.findIndex((r) =>
    rawRows[strRows.indexOf(r)]?.some((v) => v instanceof Date)
  );

  const wellRow = strRows[wellRowIdx] ?? [];
  const dateRawRow = rawRows[dateRowIdx] ?? [];

  // Find data column start
  const dataColStart = wellRow.findIndex(
    (v, i) => i > 0 && v !== '' && normalizeToken(v) !== 'POZO'
  );

  const wells: string[] = [];
  const dates = new Set<string>();
  // Map column index → well name for detection tracking
  const colToWell: Map<number, string> = new Map();

  for (let c = dataColStart; c < wellRow.length; c++) {
    if (wellRow[c]) {
      wells.push(wellRow[c]);
      colToWell.set(c, wellRow[c]);
    }
    if (dateRawRow[c] instanceof Date) dates.add(formatDate(dateRawRow[c]));
  }

  // Find the parameter header row (Parámetro / Compuesto)
  const paramHeaderIdx = strRows.findIndex((r) =>
    r.some(
      (v) =>
        normalizeToken(v).includes('PARAM') ||
        normalizeToken(v).includes('COMPUESTO')
    )
  );
  const dataStartIdx = paramHeaderIdx !== -1 ? paramHeaderIdx + 1 : 5;

  const compounds: CompoundSummary[] = [];

  for (let r = dataStartIdx; r < strRows.length; r++) {
    const row = strRows[r];
    const compoundName = row[0];
    if (!compoundName) continue;

    let detectedCount = 0;
    let ndCount = 0;
    let belowLimitCount = 0;
    let minDetected: number | null = null;
    let maxDetected: number | null = null;
    const wellsDetected: string[] = [];

    for (let c = dataColStart; c < row.length; c++) {
      const cell = row[c];
      const upper = normalizeToken(cell);

      if (upper === '' || upper === 'ND') {
        ndCount++;
        continue;
      }

      if (upper.startsWith('<') || upper.startsWith('≤')) {
        belowLimitCount++;
        continue;
      }

      const num = parseNumeric(cell);
      if (num !== null) {
        detectedCount++;
        if (minDetected === null || num < minDetected) minDetected = num;
        if (maxDetected === null || num > maxDetected) maxDetected = num;
        const wellName = colToWell.get(c);
        if (wellName && !wellsDetected.includes(wellName)) {
          wellsDetected.push(wellName);
        }
      }
    }

    compounds.push({
      name: compoundName,
      unit: row[1] ?? 'µg/l',
      quantificationLimit: row[2] ?? '',
      guidelineLevel: row[3] && row[3] !== '' ? row[3] : null,
      detectedCount,
      ndCount,
      belowLimitCount,
      minDetected,
      maxDetected,
      wellsDetected
    });
  }

  return {
    wells: Array.from(wells),
    dates: Array.from(dates).sort(),
    totalCompounds: compounds.length,
    compounds
  };
}

/**
 * analysis_performed: Small table, sent mostly as-is.
 */
function buildAnalysisPerformedSummary(
  buffer: Buffer
): AnalysisPerformedSummary {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = readAllRowsRaw(sheet);
  const strRows = readAllRows(sheet);

  const headers = strRows[0] ?? [];
  const dataRows = strRows.slice(1).filter((r) => r.some((v) => v !== ''));

  const wells = new Set<string>();
  const qaqcCodes = new Set<string>();
  const analysisTypes = new Set<string>();
  const dates = new Set<string>();

  const records = dataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h) record[h] = row[i] ?? '';
    });

    // Extract known fields
    const wellCol = row[1];
    const qaqcCol = row[2];
    const analysisCol = row[5]; // "Analítica realizada"

    if (wellCol) wells.add(wellCol);
    if (qaqcCol) qaqcCodes.add(qaqcCol);
    if (analysisCol) analysisTypes.add(analysisCol);

    // Date from raw row
    if (rawRows[strRows.indexOf(row)]?.[0] instanceof Date) {
      dates.add(formatDate(rawRows[strRows.indexOf(row)][0]));
    }

    return record;
  });

  const sortedDates = Array.from(dates).sort();

  return {
    totalRecords: dataRows.length,
    dateRange: {
      from: sortedDates[0] ?? '',
      to: sortedDates[sortedDates.length - 1] ?? ''
    },
    wells: Array.from(wells),
    qaqcCodes: Array.from(qaqcCodes),
    analysisTypes: Array.from(analysisTypes),
    records
  };
}

/** Fallback: raw preview with limited rows/cols (for unknown report types). */
function buildRawPreview(buffer: Buffer): RawPreview {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const strRows = readAllRows(sheet);

  const headerIdx = strRows.findIndex((r) =>
    r.some((v) => normalizeToken(v) !== '')
  );
  const headers = (strRows[headerIdx] ?? []).slice(0, RAW_PREVIEW_MAX_COLS);
  const dataRows = strRows
    .slice(headerIdx + 1)
    .filter((r) => r.some((v) => v !== ''))
    .slice(0, RAW_PREVIEW_MAX_ROWS)
    .map((r) => r.slice(0, RAW_PREVIEW_MAX_COLS));

  return { headers, sampleRows: dataRows, totalRows: strRows.length };
}

// ─── Summary router ───────────────────────────────────────────────────────────

function resolveReportKind(reportType: ReportType): ReportSummary['kind'] {
  if (TALL_REPORT_TYPES.includes(reportType)) return 'well_depth';
  if (
    reportType === 'sampling_params' ||
    reportType === 'sampling_params_cig' ||
    reportType === 'injection_params_cig'
  )
    return 'sampling_params';
  if (
    reportType === 'concentrations' ||
    reportType === 'volatile_concentrations_cig' ||
    reportType === 'inorganic_concentrations_cig'
  )
    return 'concentrations';
  if (reportType === 'analysis_performed') return 'analysis_performed';
  return 'raw_preview';
}

function buildSummaryForFile(
  buffer: Buffer,
  reportType: ReportType
): ReportSummary {
  const kind = resolveReportKind(reportType);

  switch (kind) {
    case 'well_depth':
      return { kind, data: buildWellDepthSummary(buffer) };
    case 'sampling_params':
      return { kind, data: buildSamplingParamsSummary(buffer) };
    case 'concentrations':
      return { kind, data: buildConcentrationsSummary(buffer) };
    case 'analysis_performed':
      return { kind, data: buildAnalysisPerformedSummary(buffer) };
    default:
      return { kind: 'raw_preview', data: buildRawPreview(buffer) };
  }
}

// ─── File assignment (unchanged logic) ────────────────────────────────────────

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
      return { reportType, fileName: null, summary: null };
    }
    const summary = buildSummaryForFile(file.content, reportType);
    return { reportType, fileName: file.fileName, summary };
  });
}

// ─── Compact serialization for LLM ────────────────────────────────────────────

/**
 * Transform detailed summaries into compact, LLM-friendly representations.
 * Goals: minimize token count, pre-group wells, omit internal IDs (CCC/PI),
 * and separate detected vs all-ND compounds.
 */
function compactForLlm(files: LlmInputFile[]): unknown[] {
  return files.map((file) => {
    if (!file.summary) {
      return { file: file.fileName, data: 'No data available' };
    }

    const base = { file: file.fileName };

    switch (file.summary.kind) {
      case 'well_depth': {
        const d = file.summary.data;
        return {
          ...base,
          type: 'Well depth measurements',
          wellGroups: groupWellsByPrefix(d.wells).map((g) =>
            g.count <= 3
              ? `${g.prefix}: ${g.wells.join(', ')}`
              : `${g.prefix} series (${g.count} wells: ${g.wells[0]}–${g.wells[g.count - 1]})`
          ),
          totalWells: d.wells.length,
          dateRange: formatDateRange(d.dates),
          measurementDates: d.dates,
          totalMeasurements: d.totalRows,
          fields: d.columns
            .filter((c) => c.stats)
            .map((c) => ({
              name: c.name,
              min: c.stats!.min,
              max: c.stats!.max,
              mean: c.stats!.mean,
              n: c.stats!.count
            })),
          emptyFields: d.columns.filter((c) => !c.stats).map((c) => c.name)
        };
      }

      case 'sampling_params': {
        const d = file.summary.data;
        return {
          ...base,
          type: 'Field sampling parameters',
          wellGroups: groupWellsByPrefix(d.wells).map((g) =>
            g.count <= 3
              ? `${g.prefix}: ${g.wells.join(', ')}`
              : `${g.prefix} series (${g.count} wells)`
          ),
          totalWells: d.wells.length,
          dateRange: formatDateRange(d.dates),
          samplingDays: d.dates.length,
          parameters: d.parameters.map((p) => ({
            name: p.name,
            unit: p.unit,
            min: p.stats.min,
            max: p.stats.max,
            mean: p.stats.mean
          })),
          notes: d.qualitativeNotes
        };
      }

      case 'concentrations': {
        const d = file.summary.data;
        const detected = d.compounds.filter(
          (c) => c.detectedCount > 0 || c.belowLimitCount > 0
        );
        const allNd = d.compounds.filter(
          (c) => c.detectedCount === 0 && c.belowLimitCount === 0
        );

        // Separate compounds exceeding guideline from those that don't
        const exceedsGuideline = detected.filter((c) => {
          if (!c.guidelineLevel || !c.maxDetected) return false;
          return c.maxDetected > parseFloat(c.guidelineLevel);
        });
        const withinGuideline = detected.filter((c) => {
          if (!c.guidelineLevel || !c.maxDetected) return true;
          return c.maxDetected <= parseFloat(c.guidelineLevel);
        });

        return {
          ...base,
          type: 'Chemical compound concentrations',
          wellGroups: groupWellsByPrefix(d.wells).map((g) =>
            g.count <= 3
              ? `${g.prefix}: ${g.wells.join(', ')}`
              : `${g.prefix} series (${g.count} wells)`
          ),
          totalWells: d.wells.length,
          dateRange: formatDateRange(d.dates),
          totalCompounds: d.totalCompounds,
          compoundsWithDetections: detected.length,
          compoundsAllNd: allNd.length,
          // Compounds that exceed their guideline level — most relevant for reporting
          exceedingGuideline: exceedsGuideline.map((c) => ({
            compound: c.name,
            guideline: `${c.guidelineLevel} ${c.unit}`,
            maxDetected: `${c.maxDetected} ${c.unit}`,
            detections: c.detectedCount,
            wellsDetected: c.wellsDetected
          })),
          // Other detected compounds
          otherDetected: withinGuideline.map((c) => ({
            compound: c.name,
            range:
              c.minDetected !== null
                ? `${c.minDetected}–${c.maxDetected} ${c.unit}`
                : `below limit (${c.quantificationLimit} ${c.unit})`,
            detections: c.detectedCount,
            belowLimit: c.belowLimitCount
          })),
          // Just list names of all-ND compounds
          ndCompoundNames: allNd.map((c) => c.name)
        };
      }

      case 'analysis_performed': {
        const d = file.summary.data;
        return {
          ...base,
          type: 'Remediation task progress',
          dateRange: `${d.dateRange.from} to ${d.dateRange.to}`,
          totalRecords: d.totalRecords,
          wells: d.wells,
          qaqcCodes: d.qaqcCodes,
          analysisTypes: d.analysisTypes
          // Omit raw records with CCC/PI codes — not relevant for the report
        };
      }

      default: {
        const d = file.summary.data as RawPreview;
        return {
          ...base,
          type: 'Data preview',
          headers: d.headers,
          sampleRows: d.sampleRows.slice(0, 10),
          totalRows: d.totalRows
        };
      }
    }
  });
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const GENERATION_SYSTEM_PROMPT = `You are a technical environmental report writer producing concise, readable monitoring summaries.

VOICE & STYLE:
- Write in flowing NARRATIVE PROSE. The reader is a technical professional, not a database.
- SYNTHESIZE, do not enumerate. Describe patterns, ranges, and groupings — never dump raw lists.
- When referring to monitoring points, use GROUP names (e.g. "the 11 EX-series wells", "the D-series (D11–D21)", "five cPIMW wells"). List individual well names ONLY when they are exceptions or noteworthy (e.g. wells where a compound was detected).
- Date ranges: say "January 13–28, 2026" not list every date. Mention individual dates only if the set is ≤ 3.
- Keep the executive summary to ONE concise paragraph (3–5 sentences).
- Each data summary subsection: 1–2 paragraphs of prose.

MANDATORY RULES:
- STRICTLY DESCRIPTIVE. No interpretation, causes, trends, or recommendations.
- "ND" = "not detected". Never interpret it as missing data.
- Use "chemical compounds", never "contaminants".
- Never use markdown tables, ASCII tables, or column-aligned tabular formatting.
- If source data is tabular, rewrite it as narrative prose.
- Respond ONLY with valid JSON matching the schema. Include all keys; use null when a field does not apply.

STRUCTURE (exactly 3 level-1 sections):
1. Executive summary — brief narrative overview of the full dataset.
2. Data summary — one level-2 subsection per source file. Synthesize what was measured, where, when, and the observed ranges.
3. Descriptive closure — one short paragraph, no interpretation.

LANGUAGE: Generate all content in English.`;

const TRANSLATION_SYSTEM_PROMPT = `You are a professional technical translator.
Translate ALL text values in this JSON to the target language. Preserve:
- JSON structure and keys unchanged.
- Numbers, file names, well IDs (EX1, cPIMW01, etc.), units, and chemical formulas unchanged.
- Compound names in their standard form for the target language.
Respond ONLY with the translated JSON.`;

const LlmBloqueSchema = z.object({
  tipo: z.enum(['parrafo', 'lista', 'caja']),
  texto: z.string().nullable(),
  items: z.array(z.string()).nullable(),
  columnas: z.array(z.string()).nullable(),
  filas: z
    .array(
      z.object({
        valores: z.array(z.string()),
        alerta: z.enum(['alta', 'media', 'baja', 'ok']).nullable()
      })
    )
    .nullable(),
  nivel_alerta: z
    .enum(['critico', 'advertencia', 'info', 'positivo'])
    .nullable(),
  titulo_caja: z.string().nullable()
});

const LlmSeccionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  nivel: z.union([z.literal(1), z.literal(2)]),
  contenido: z.array(LlmBloqueSchema)
});

const LlmInformeSchema = z.object({
  titulo: z.string().max(60),
  subtitulo: z.string().max(80),
  periodo: z.string().max(40),
  secciones: z.array(LlmSeccionSchema)
});

function isMarkdownTableSeparatorLine(line: string): boolean {
  return /^\s*\|?[\s:-]+(?:\|[\s:-]+)+\|?\s*$/.test(line);
}

function isMarkdownTableRowLine(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}

function stripMarkdownTablesFromText(text: string): string {
  const lines = text.split('\n');
  const kept: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const current = lines[i];
    const next = lines[i + 1];
    const startsTable =
      isMarkdownTableRowLine(current) &&
      typeof next === 'string' &&
      isMarkdownTableSeparatorLine(next);

    if (!startsTable) {
      kept.push(current);
      i++;
      continue;
    }

    i += 2; // skip markdown header/separator rows
    while (i < lines.length && isMarkdownTableRowLine(lines[i])) {
      i++;
    }
  }

  return kept
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sanitizeNoTables<T>(value: T): T {
  if (typeof value === 'string') {
    return stripMarkdownTablesFromText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeNoTables(item)) as T;
  }

  if (value && typeof value === 'object') {
    const mapped = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeNoTables(v)])
    );
    return mapped as T;
  }

  return value;
}

function createPrompt(input: {
  reportName: string;
  range: { from: Date; to: Date };
  files: LlmInputFile[];
}): string {
  return JSON.stringify(
    {
      report_name: input.reportName,
      period: {
        from: input.range.from.toISOString().split('T')[0],
        to: input.range.to.toISOString().split('T')[0]
      },
      data: compactForLlm(input.files)
    },
    null,
    2
  );
}

function createTranslationPrompt(
  informe: Informe,
  targetLanguage: string
): string {
  return JSON.stringify(
    {
      target_language: targetLanguage,
      report: informe
    },
    null,
    2
  );
}

// ─── Generation + Translation ─────────────────────────────────────────────────

async function generateInforme(input: {
  reportName: string;
  range: { from: Date; to: Date };
  files: LlmInputFile[];
}): Promise<Informe> {
  const { output } = await generateText({
    model,
    output: Output.object({ schema: LlmInformeSchema }),
    system: GENERATION_SYSTEM_PROMPT,
    prompt: createPrompt(input)
  });

  return sanitizeNoTables(output as Informe);
}

async function translateInforme(
  informe: Informe,
  targetLocale: string
): Promise<Informe> {
  if (targetLocale === 'en') return sanitizeNoTables(informe); // already in English

  const targetLanguage =
    targetLocale === 'es' ? 'Spanish (Latin America)' : targetLocale;

  const { output } = await generateText({
    model,
    output: Output.object({ schema: LlmInformeSchema }),
    system: TRANSLATION_SYSTEM_PROMPT,
    prompt: createTranslationPrompt(informe, targetLanguage)
  });

  return sanitizeNoTables(output as Informe);
}

/**
 * Main pipeline: generate in English → translate to target locale.
 * Both locales get PDFs built from the same underlying data description.
 */
async function generateInformeWithTranslation(input: {
  reportName: string;
  range: { from: Date; to: Date };
  files: LlmInputFile[];
  locale: string;
}): Promise<Informe> {
  // Step 1: Generate the canonical report in English
  const englishInforme = await generateInforme({
    reportName: input.reportName,
    range: input.range,
    files: input.files
  });

  // Step 2: Translate if needed
  return translateInforme(englishInforme, input.locale);
}

// ─── Blob helpers (unchanged) ─────────────────────────────────────────────────

function buildBlobName(
  orgId: string,
  reportId: string,
  reportName: string,
  locale: string
): string {
  return `reportes/${orgId}/${reportId}/${reportName}.${locale}.summary.pdf`;
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
    // already a relative path
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

// ─── Action ───────────────────────────────────────────────────────────────────

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
    const locale = await getLocale();

    const blobName = buildBlobName(
      ctx.organization.id,
      parsedInput.reportId,
      report.nombre_archivo,
      locale
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
        fileName: `${report.nombre_archivo}.${locale}.summary.pdf`
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

    const output = await generateInformeWithTranslation({
      reportName: report.nombre_archivo,
      range: {
        from: toDate(report.fecha_desde),
        to: toDate(report.fecha_hasta)
      },
      files: payloadFiles,
      locale
    });

    const pdfBuffer = await buildPdfBuffer(output);
    await container.getBlockBlobClient(blobName).uploadData(pdfBuffer, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' }
    });

    return {
      blobPath: cachedBlobClient.url,
      reused: false,
      fileName: `${report.nombre_archivo}.${locale}.summary.pdf`
    };
  });
