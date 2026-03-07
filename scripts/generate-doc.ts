import { anthropic } from '@ai-sdk/anthropic';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { join } from 'path';
import 'dotenv/config';
// ─────────────────────────────────────────────
// SCHEMA ZOD
// ─────────────────────────────────────────────

const BloqueSchema = z.object({
  tipo: z.enum(['parrafo', 'lista', 'tabla', 'caja']),

  // parrafo
  texto: z.string().optional(),

  // lista
  items: z.array(z.string()).optional(),

  // tabla
  columnas: z.array(z.string()).optional(),
  filas: z
    .array(
      z.object({
        valores: z.array(z.string()),
        alerta: z.enum(['alta', 'media', 'baja', 'ok']).nullable().optional()
      })
    )
    .optional(),

  // caja
  nivel_alerta: z
    .enum(['critico', 'advertencia', 'info', 'positivo'])
    .optional(),
  titulo_caja: z.string().optional()
});

const SeccionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  nivel: z.union([z.literal(1), z.literal(2)]),
  contenido: z.array(BloqueSchema)
});

const InformeSchema = z.object({
  titulo: z.string(),
  subtitulo: z.string(),
  periodo: z.string(),
  secciones: z.array(SeccionSchema)
});

export type Informe = z.infer<typeof InformeSchema>;

// ─────────────────────────────────────────────
// COLORES
// ─────────────────────────────────────────────

const COLORES = {
  azulOscuro: '#1F4E79',
  azulMedio: '#2E75B6',
  azulClaro: '#D6E4F0',
  azulMuyCl: '#EBF3FB',
  rojoOscuro: '#C00000',
  rojoClaro: '#FDECEA',
  naranja: '#E65100',
  naranjaCl: '#FFF3CD',
  amarilloCl: '#FFF9E6',
  verdeOscuro: '#2E7D32',
  verdeCl: '#F0F7EE',
  grisCl: '#F5F5F5',
  gris: '#888888',
  negro: '#000000',
  blanco: '#FFFFFF'
};

const ALERTA_CAJA: Record<
  string,
  { fondo: string; borde: string; titulo: string }
> = {
  critico: {
    fondo: COLORES.rojoClaro,
    borde: COLORES.rojoOscuro,
    titulo: COLORES.rojoOscuro
  },
  advertencia: {
    fondo: COLORES.naranjaCl,
    borde: COLORES.naranja,
    titulo: COLORES.naranja
  },
  info: {
    fondo: COLORES.azulMuyCl,
    borde: COLORES.azulMedio,
    titulo: COLORES.azulMedio
  },
  positivo: {
    fondo: COLORES.verdeCl,
    borde: COLORES.verdeOscuro,
    titulo: COLORES.verdeOscuro
  }
};

const ALERTA_FILA: Record<string, string> = {
  alta: COLORES.rojoClaro,
  media: COLORES.naranjaCl,
  baja: COLORES.amarilloCl,
  ok: COLORES.verdeCl
};

// ─────────────────────────────────────────────
// LECTURA DE EXCELS
// ─────────────────────────────────────────────

function leerExcel(filePath: string): unknown[][] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
}

function preprocesarConcentraciones(rows: unknown[][]): object {
  // Filas 0-3: metadata (fechas, pozos, CCC, PI)
  // Fila 4+: parámetros
  const fechas = (rows[0] as any[]).slice(4).filter(Boolean);
  const pozos = (rows[1] as any[]).slice(4).filter(Boolean);

  const detecciones: Record<string, any[]> = {};
  const noDetectados: { parametro: string; unidad: string; lc: any }[] = [];
  const pozosMediaidos = new Set<string>();

  for (const pozo of pozos) pozosMediaidos.add(String(pozo));

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i] as any[];
    const parametro = row[0];
    const unidad = row[1];
    const lc = row[2];
    const ng = row[3];
    if (!parametro) continue;

    const vals: any[] = [];
    for (let c = 4; c < row.length; c++) {
      const val = row[c];
      if (val === null || val === undefined) continue;
      if (String(val).trim() === 'ND' || String(val).trim() === '') continue;
      vals.push({
        pozo: pozos[c - 4],
        fecha: fechas[c - 4] ?? null,
        valor: val,
        ng
      });
    }

    if (vals.length === 0) {
      noDetectados.push({ parametro, unidad, lc });
    } else {
      detecciones[parametro] = vals;
    }
  }

  return {
    nota: 'Solo se incluyen compuestos con al menos una detección. Los compuestos listados en "no_detectados" fueron analizados en todos los pozos y resultaron ND en la totalidad de las muestras.',
    pozos_muestreados: Array.from(pozosMediaidos),
    total_compuestos_analizados:
      noDetectados.length + Object.keys(detecciones).length,
    no_detectados: noDetectados, // lista con nombre, unidad y LC — sin filas de datos
    detecciones // solo los compuestos con valores reales
  };
}

function cargarDatos(carpeta: string) {
  const concRaw = leerExcel(
    `${carpeta}/BER_Concentraciones_2025-10-01_2026-03-03.xlsx`
  );

  return {
    avance_remediacion: leerExcel(
      `${carpeta}/BER_AvanceTareasRemediacion_2025-10-01_2026-03-03.xlsx`
    ),
    concentraciones: preprocesarConcentraciones(concRaw),
    parametros_muestreo: leerExcel(
      `${carpeta}/BER_ParametrosMuestreo_2025-10-01_2026-03-03.xlsx`
    ),
    profundidad_pozos: leerExcel(
      `${carpeta}/BER_ProfundidadPozos_2025-10-01_2026-03-03.xlsx`
    )
  };
}

// ─────────────────────────────────────────────
// LLAMADA A LA API
// ─────────────────────────────────────────────
async function generarInforme(
  datos: ReturnType<typeof cargarDatos>
): Promise<Informe> {
  const { output } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    output: Output.object({ schema: InformeSchema }),
    system: `Sos un analista ambiental especializado en remediación de sitios contaminados.
Analizá los datos de monitoreo de agua subterránea que te pasan y generá un informe estructurado.

Reglas de contenido:
- No inventes datos. Solo usá la información presente en el JSON de entrada.
- Todos los números deben citarse con sus unidades y nivel guía correspondiente.
- Para alertas de filas en tablas: "alta" si supera 10x el nivel guía, "media" entre 1x y 10x, "baja" si está cerca (0.5x–1x), "ok" si está por debajo.
- Para cajas: "critico" en concentraciones extremas o anomalías graves, "advertencia" en tendencias preocupantes, "info" en observaciones sin urgencia, "positivo" en aspectos favorables.
- Los datos de concentraciones fueron preprocesados: solo se enviaron compuestos con al menos una detección. 
El campo "no_detectados" lista todos los compuestos analizados que resultaron ND en la totalidad de los pozos — mencioná su cantidad total en el informe pero no los enumeres individualmente.

Secciones a incluir (en este orden):
1. Resumen ejecutivo (nivel 1)
2. Concentraciones de contaminantes (nivel 1)
   - Superaciones de nivel guía (nivel 2)
   - Compuestos detectados sin superación (nivel 2)
   - Distribución espacial (nivel 2)
3. Parámetros de campo (nivel 1)
4. Profundidad del nivel freático (nivel 1)
5. Hallazgos destacados (nivel 1) — cada hallazgo como una caja
6. Cuestiones a revisar por el analista (nivel 1) — separadas por subcategorías
7. Conclusiones (nivel 1)`,
    prompt: `Sitio: BER
Período: 01/10/2025 – 03/03/2026

DATOS:
${JSON.stringify(datos, null, 0)}`
  });

  return output;
}

// ─────────────────────────────────────────────
// GENERACIÓN DE PDF
// ─────────────────────────────────────────────

const PAGE_W = 595.28; // A4 en puntos
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Helper: hex a RGB para pdfkit
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorFill(doc: PDFKit.PDFDocument, hex: string) {
  doc.fillColor(hexToRgb(hex));
}

function colorStroke(doc: PDFKit.PDFDocument, hex: string) {
  doc.strokeColor(hexToRgb(hex));
}

// Dibuja un rectángulo con color de fondo
function rect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  fillHex: string,
  strokeHex?: string
) {
  colorFill(doc, fillHex);
  if (strokeHex) {
    colorStroke(doc, strokeHex);
    doc.rect(x, y, w, h).fillAndStroke();
  } else {
    doc.rect(x, y, w, h).fill();
  }
}

// Texto con word wrap manual — devuelve la altura usada
function textoWrapped(
  doc: PDFKit.PDFDocument,
  texto: string,
  x: number,
  y: number,
  maxW: number,
  opts: {
    fontSize?: number;
    font?: string;
    color?: string;
    lineGap?: number;
  } = {}
): number {
  const fontSize = opts.fontSize ?? 9;
  const font = opts.font ?? 'Helvetica';
  const color = opts.color ?? COLORES.negro;
  const lineGap = opts.lineGap ?? 4;

  doc.font(font).fontSize(fontSize);
  colorFill(doc, color);

  const antes = doc.y;
  doc.text(texto, x, y, { width: maxW, lineGap });
  return doc.y - antes;
}

// Verifica si queda espacio; si no, agrega página
function checkPageBreak(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > PAGE_H - MARGIN) {
    doc.addPage();
  }
}

// ── Portada ──────────────────────────────────
function dibujarPortada(doc: PDFKit.PDFDocument, informe: Informe) {
  rect(doc, 0, 0, PAGE_W, 120, COLORES.azulOscuro);

  doc.font('Helvetica-Bold').fontSize(20);
  colorFill(doc, COLORES.blanco);
  doc.text(informe.titulo, MARGIN, 35, { width: CONTENT_W, align: 'center' });

  doc.font('Helvetica').fontSize(12);
  doc.text(informe.subtitulo, MARGIN, 72, {
    width: CONTENT_W,
    align: 'center'
  });

  doc.moveDown(0.5);
  doc.font('Helvetica-Oblique').fontSize(10);
  colorFill(doc, COLORES.azulClaro);
  doc.text(informe.periodo, MARGIN, 100, { width: CONTENT_W, align: 'center' });

  doc.y = 140;
}

// ── Heading nivel 1 ───────────────────────────
function dibujarH1(doc: PDFKit.PDFDocument, texto: string) {
  checkPageBreak(doc, 30);
  const y = doc.y + 10;

  doc.font('Helvetica-Bold').fontSize(13);
  colorFill(doc, COLORES.azulOscuro);
  doc.text(texto, MARGIN, y, { width: CONTENT_W });

  // línea decorativa
  const lineY = doc.y + 3;
  colorStroke(doc, COLORES.azulClaro);
  doc
    .moveTo(MARGIN, lineY)
    .lineTo(MARGIN + CONTENT_W, lineY)
    .lineWidth(1.5)
    .stroke();

  doc.y = lineY + 8;
}

// ── Heading nivel 2 ───────────────────────────
function dibujarH2(doc: PDFKit.PDFDocument, texto: string) {
  checkPageBreak(doc, 20);
  doc.y += 6;
  doc.font('Helvetica-Bold').fontSize(11);
  colorFill(doc, COLORES.azulMedio);
  doc.text(texto, MARGIN, doc.y, { width: CONTENT_W });
  doc.y += 4;
}

// ── Párrafo ───────────────────────────────────
function dibujarParrafo(doc: PDFKit.PDFDocument, texto: string) {
  checkPageBreak(doc, 20);
  textoWrapped(doc, texto, MARGIN, doc.y, CONTENT_W, { fontSize: 9 });
  doc.y += 4;
}

// ── Lista de bullets ──────────────────────────
function dibujarLista(doc: PDFKit.PDFDocument, items: string[]) {
  for (const item of items) {
    checkPageBreak(doc, 14);
    doc.font('Helvetica').fontSize(9);
    colorFill(doc, COLORES.azulMedio);
    doc.text('•', MARGIN + 4, doc.y, { width: 10, continued: false });
    const bulletY = doc.y - doc.currentLineHeight();
    colorFill(doc, COLORES.negro);
    textoWrapped(doc, item, MARGIN + 16, bulletY, CONTENT_W - 16, {
      fontSize: 9
    });
  }
  doc.y += 4;
}

// ── Tabla ─────────────────────────────────────
function dibujarTabla(
  doc: PDFKit.PDFDocument,
  columnas: string[],
  filas: Array<{ valores: string[]; alerta: string | null }>
) {
  const nCols = columnas.length;
  if (nCols === 0) return;

  const colW = CONTENT_W / nCols;
  const padX = 4;
  const padY = 4;
  const headerH = 20;
  const rowH = 18;
  const fontSize = 7.5;

  // Calcular altura total para check de página
  const totalH = headerH + filas.length * rowH + 2;
  checkPageBreak(doc, Math.min(totalH, 120));

  let y = doc.y;

  // Header
  rect(doc, MARGIN, y, CONTENT_W, headerH, COLORES.azulOscuro);
  columnas.forEach((col, i) => {
    doc.font('Helvetica-Bold').fontSize(fontSize);
    colorFill(doc, COLORES.blanco);
    doc.text(col, MARGIN + i * colW + padX, y + padY, {
      width: colW - padX * 2,
      height: headerH - padY * 2,
      ellipsis: true,
      lineBreak: false
    });
  });
  y += headerH;

  // Filas
  filas.forEach((fila, rowIdx) => {
    // Salto de página si es necesario
    if (y + rowH > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
      // Redibujar header
      rect(doc, MARGIN, y, CONTENT_W, headerH, COLORES.azulOscuro);
      columnas.forEach((col, i) => {
        doc.font('Helvetica-Bold').fontSize(fontSize);
        colorFill(doc, COLORES.blanco);
        doc.text(col, MARGIN + i * colW + padX, y + padY, {
          width: colW - padX * 2,
          height: headerH - padY * 2,
          ellipsis: true,
          lineBreak: false
        });
      });
      y += headerH;
    }

    // Fondo de fila
    const bgColor =
      fila.alerta && ALERTA_FILA[fila.alerta]
        ? ALERTA_FILA[fila.alerta]
        : rowIdx % 2 === 0
          ? COLORES.blanco
          : COLORES.azulMuyCl;

    rect(doc, MARGIN, y, CONTENT_W, rowH, bgColor);

    // Borde inferior fino
    colorStroke(doc, COLORES.azulClaro);
    doc
      .moveTo(MARGIN, y + rowH)
      .lineTo(MARGIN + CONTENT_W, y + rowH)
      .lineWidth(0.3)
      .stroke();

    // Celdas
    fila.valores.forEach((val, i) => {
      doc.font('Helvetica').fontSize(fontSize);
      colorFill(doc, COLORES.negro);
      doc.text(String(val ?? ''), MARGIN + i * colW + padX, y + padY, {
        width: colW - padX * 2,
        height: rowH - padY * 2,
        ellipsis: true,
        lineBreak: false
      });
    });

    y += rowH;
  });

  doc.y = y + 8;
}

// ── Caja destacada ────────────────────────────
function dibujarCaja(
  doc: PDFKit.PDFDocument,
  titulo: string | undefined,
  items: string[],
  nivel_alerta: string
) {
  const estilo = ALERTA_CAJA[nivel_alerta] ?? ALERTA_CAJA.info;
  const padX = 12;
  const padY = 8;
  const bordeIzq = 4;
  const lineH = 13;

  // Estimar altura
  let alturaEstimada = padY * 2;
  if (titulo) alturaEstimada += lineH + 4;
  for (const item of items) {
    const charsPerLine = Math.floor((CONTENT_W - padX * 2 - bordeIzq) / 5.5);
    const lines = Math.ceil(item.length / charsPerLine) + 1;
    alturaEstimada += lines * lineH;
  }

  checkPageBreak(doc, alturaEstimada);
  const startY = doc.y;
  const x = MARGIN;

  // Fondo
  rect(doc, x, startY, CONTENT_W, alturaEstimada, estilo.fondo);

  // Borde izquierdo grueso
  rect(doc, x, startY, bordeIzq, alturaEstimada, estilo.borde);

  // Borde exterior
  colorStroke(doc, estilo.borde);
  doc.rect(x, startY, CONTENT_W, alturaEstimada).lineWidth(0.5).stroke();

  let ty = startY + padY;

  // Título de la caja
  if (titulo) {
    doc.font('Helvetica-Bold').fontSize(9);
    colorFill(doc, estilo.titulo);
    doc.text(titulo, x + padX + bordeIzq, ty, {
      width: CONTENT_W - padX * 2 - bordeIzq
    });
    ty = doc.y + 4;
  }

  // Items
  for (const item of items) {
    doc.font('Helvetica').fontSize(8.5);
    colorFill(doc, COLORES.negro);
    doc.text(`→  ${item}`, x + padX + bordeIzq, ty, {
      width: CONTENT_W - padX * 2 - bordeIzq,
      lineGap: 2
    });
    ty = doc.y + 3;
  }

  doc.y = startY + alturaEstimada + 8;
}

// ── Pie de página ─────────────────────────────
function agregarPiePagina(doc: PDFKit.PDFDocument) {
  const fecha = new Date().toLocaleDateString('es-AR');
  const totalPages = (doc as any)._pageBuffer?.length ?? 1;

  doc.on('pageAdded', () => {
    // pdfkit no tiene beforeEnd hook fácil; los números se agregan al final
  });

  // Nota al pie en la última página
  doc.y = PAGE_H - MARGIN - 30;
  colorStroke(doc, COLORES.gris);
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + CONTENT_W, doc.y)
    .lineWidth(0.5)
    .stroke();
  doc.y += 4;
  doc.font('Helvetica-Oblique').fontSize(7.5);
  colorFill(doc, COLORES.gris);
  doc.text(
    `Informe generado a partir de archivos de monitoreo BER. Fecha de generación: ${fecha}.`,
    MARGIN,
    doc.y,
    { width: CONTENT_W }
  );
}

// ── Función principal PDF ─────────────────────
function construirPDF(informe: Informe, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: { Title: informe.titulo, Author: 'Sistema de Monitoreo BER' }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Portada
    dibujarPortada(doc, informe);

    // Secciones
    for (const seccion of informe.secciones) {
      if (seccion.nivel === 1) {
        dibujarH1(doc, seccion.heading);
      } else {
        dibujarH2(doc, seccion.heading);
      }

      for (const bloque of seccion.contenido) {
        switch (bloque.tipo) {
          case 'parrafo':
            if (bloque.texto) dibujarParrafo(doc, bloque.texto);
            break;
          case 'lista':
            if (bloque.items) dibujarLista(doc, bloque.items);
            break;
          case 'tabla':
            if (bloque.columnas && bloque.filas)
              dibujarTabla(
                doc,
                bloque.columnas,
                bloque.filas as { valores: string[]; alerta: string | null }[]
              );
            break;
          case 'caja':
            if (bloque.nivel_alerta)
              dibujarCaja(
                doc,
                bloque.titulo_caja,
                bloque.items ?? [],
                bloque.nivel_alerta
              );
            break;
        }
      }
    }

    agregarPiePagina(doc);

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
const DATA_FOLDER = join(process.cwd(), 'report_data');
const OUTPUT_FOLDER = join(process.cwd(), 'output');

async function main() {
  const carpetaExcels = DATA_FOLDER;
  const carpetaSalida = OUTPUT_FOLDER;

  // Crear carpeta de salida si no existe
  if (!fs.existsSync(carpetaSalida)) {
    fs.mkdirSync(carpetaSalida, { recursive: true });
  }

  console.log(`Leyendo archivos Excel desde ${carpetaExcels}`);

  console.log('Leyendo archivos Excel...');
  const datos = cargarDatos(carpetaExcels);

  console.log('Llamando a la API...');
  const informe = await generarInforme(datos);

  // Guardar JSON intermedio
  const jsonPath = path.join(carpetaSalida, 'informe_respuesta.json');
  fs.writeFileSync(jsonPath, JSON.stringify(informe, null, 2), 'utf-8');
  console.log(`JSON guardado en ${jsonPath}`);

  // Generar PDF
  const pdfPath = path.join(carpetaSalida, 'Informe_BER.pdf');
  console.log('Generando PDF...');
  await construirPDF(informe, pdfPath);
  console.log(`PDF generado en ${pdfPath}`);
}

main().catch(console.error);
