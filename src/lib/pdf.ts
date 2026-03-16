import * as fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { z } from 'zod';

const BloqueSchema = z.object({
  tipo: z.enum(['parrafo', 'lista', 'tabla', 'caja']),
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

const SeccionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  nivel: z.union([z.literal(1), z.literal(2)]),
  contenido: z.array(BloqueSchema)
});

export const InformeSchema = z.object({
  titulo: z.string(),
  subtitulo: z.string(),
  periodo: z.string(),
  secciones: z.array(SeccionSchema)
});

export type Informe = z.infer<typeof InformeSchema>;

const PAGE_W = 595.28; // A4 en puntos
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const APP_FONT_PATH = path.join(
  process.cwd(),
  'public/assets/fonts/NotoSans-Variable.ttf'
);

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
  const font = opts.font ?? APP_FONT_PATH;
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

  doc.font(APP_FONT_PATH).fontSize(20);
  colorFill(doc, COLORES.blanco);
  doc.text(informe.titulo, MARGIN, 35, { width: CONTENT_W, align: 'center' });

  doc.font(APP_FONT_PATH).fontSize(12);
  doc.text(informe.subtitulo, MARGIN, 72, {
    width: CONTENT_W,
    align: 'center'
  });

  doc.moveDown(0.5);
  doc.font(APP_FONT_PATH).fontSize(10);
  colorFill(doc, COLORES.azulClaro);
  doc.text(informe.periodo, MARGIN, 100, { width: CONTENT_W, align: 'center' });

  doc.y = 140;
}

// ── Heading nivel 1 ───────────────────────────
function dibujarH1(doc: PDFKit.PDFDocument, texto: string) {
  checkPageBreak(doc, 30);
  const y = doc.y + 10;

  doc.font(APP_FONT_PATH).fontSize(13);
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
  doc.font(APP_FONT_PATH).fontSize(11);
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
    doc.font(APP_FONT_PATH).fontSize(9);
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
    doc.font(APP_FONT_PATH).fontSize(fontSize);
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
        doc.font(APP_FONT_PATH).fontSize(fontSize);
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
      doc.font(APP_FONT_PATH).fontSize(fontSize);
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
    doc.font(APP_FONT_PATH).fontSize(9);
    colorFill(doc, estilo.titulo);
    doc.text(titulo, x + padX + bordeIzq, ty, {
      width: CONTENT_W - padX * 2 - bordeIzq
    });
    ty = doc.y + 4;
  }

  // Items
  for (const item of items) {
    doc.font(APP_FONT_PATH).fontSize(8.5);
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
  doc.font(APP_FONT_PATH).fontSize(7.5);
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
      font: APP_FONT_PATH,
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
                bloque.titulo_caja ?? undefined,
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

export function buildPdfBuffer(informe: Informe): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      font: APP_FONT_PATH,
      info: { Title: informe.titulo, Author: 'Sistema de Monitoreo BER' }
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) =>
      chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
    );
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    dibujarPortada(doc, informe);
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
                bloque.titulo_caja ?? undefined,
                bloque.items ?? [],
                bloque.nivel_alerta
              );
            break;
        }
      }
    }
    agregarPiePagina(doc);
    doc.end();
  });
}
