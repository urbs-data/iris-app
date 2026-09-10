import * as XLSX from 'xlsx';

/** `offset` es relativo a la concatenación del texto de todas las páginas. */
export interface ParsedPage {
  pageNumber: number;
  offset: number;
  text: string;
}

const DOC_INTELLIGENCE_API_VERSION = '2024-11-30';
const DOC_INTELLIGENCE_MAX_PAGES = '1-300';
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 8 * 60 * 1000;

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `outputContentFormat=markdown` devuelve el documento ya serializado con las
 * tablas como HTML embebido, y evita tener que reconstruir el texto carácter por
 * carácter cruzando los spans de las tablas contra los de la página.
 */
async function parseWithDocumentIntelligence(
  buffer: Buffer
): Promise<ParsedPage[]> {
  const endpoint = getEnvVar('AZURE_DOCUMENTINTELLIGENCE_ENDPOINT').replace(
    /\/$/,
    ''
  );
  const apiKey = getEnvVar('AZURE_DOCUMENTINTELLIGENCE_API_KEY');

  const analyzeUrl =
    `${endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze` +
    `?api-version=${DOC_INTELLIGENCE_API_VERSION}` +
    `&outputContentFormat=markdown&pages=${DOC_INTELLIGENCE_MAX_PAGES}`;

  const startResponse = await fetch(analyzeUrl, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ base64Source: buffer.toString('base64') })
  });

  if (!startResponse.ok) {
    const errorText = await startResponse.text();
    throw new Error(
      `Document Intelligence error: ${startResponse.status} - ${errorText}`
    );
  }

  const operationUrl = startResponse.headers.get('operation-location');
  if (!operationUrl) {
    throw new Error(
      'Document Intelligence no devolvió el header operation-location'
    );
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const pollResponse = await fetch(operationUrl, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey }
    });

    if (!pollResponse.ok) {
      const errorText = await pollResponse.text();
      throw new Error(
        `Document Intelligence poll error: ${pollResponse.status} - ${errorText}`
      );
    }

    const result = await pollResponse.json();

    if (result.status === 'failed') {
      throw new Error(
        `Document Intelligence falló: ${JSON.stringify(result.error ?? {})}`
      );
    }

    if (result.status !== 'succeeded') {
      continue;
    }

    const content: string = result.analyzeResult?.content ?? '';
    const pages: Array<{
      pageNumber: number;
      spans?: Array<{ offset: number; length: number }>;
    }> = result.analyzeResult?.pages ?? [];

    const parsedPages: ParsedPage[] = [];
    let offset = 0;

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const span = page.spans?.[0];
      const text = span
        ? content.slice(span.offset, span.offset + span.length)
        : '';

      parsedPages.push({
        pageNumber: page.pageNumber ?? index + 1,
        offset,
        text
      });
      offset += text.length;
    }

    return parsedPages;
  }

  throw new Error(
    `Document Intelligence no terminó dentro de ${POLL_TIMEOUT_MS / 1000}s`
  );
}

function cleanupText(data: string): string {
  return data
    .replace(/\n{2,}/g, '\n')
    .replace(/[^\S\n]{2,}/g, ' ')
    .trim();
}

function parseText(buffer: Buffer): ParsedPage[] {
  return [
    { pageNumber: 1, offset: 0, text: cleanupText(buffer.toString('utf8')) }
  ];
}

function parseJson(buffer: Buffer): ParsedPage[] {
  const data = JSON.parse(buffer.toString('utf8'));

  if (!Array.isArray(data)) {
    return [{ pageNumber: 1, offset: 0, text: JSON.stringify(data) }];
  }

  const pages: ParsedPage[] = [];
  let offset = 0;

  for (let index = 0; index < data.length; index++) {
    offset += 1; // corchete de apertura o coma previa al objeto
    const text = JSON.stringify(data[index]);
    pages.push({ pageNumber: index + 1, offset, text });
    offset += text.length;
  }

  return pages;
}

function parseLegacyExcel(buffer: Buffer): ParsedPage[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const pages: ParsedPage[] = [];
  let offset = 0;

  for (let index = 0; index < workbook.SheetNames.length; index++) {
    const sheetName = workbook.SheetNames[index];
    const rows = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    const text = `Hoja: ${sheetName}\n${rows}\n\n`;

    pages.push({ pageNumber: index + 1, offset, text });
    offset += text.length;
  }

  return pages;
}

const DOC_INTELLIGENCE_EXTENSIONS = new Set([
  '.pdf',
  '.html',
  '.docx',
  '.doc',
  '.xlsx',
  '.pptx',
  '.ppt'
]);

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.csv']);

export function fileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.slice(dotIndex).toLowerCase();
}

export async function parseFile(
  buffer: Buffer,
  fileName: string
): Promise<ParsedPage[]> {
  const extension = fileExtension(fileName);

  if (DOC_INTELLIGENCE_EXTENSIONS.has(extension)) {
    return parseWithDocumentIntelligence(buffer);
  }

  if (TEXT_EXTENSIONS.has(extension)) {
    return parseText(buffer);
  }

  if (extension === '.json') {
    return parseJson(buffer);
  }

  if (extension === '.xls') {
    return parseLegacyExcel(buffer);
  }

  return [];
}
