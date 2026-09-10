import type { ParsedPage } from './parse';

export interface Chunk {
  pageNumber: number;
  text: string;
}

const SENTENCE_ENDINGS = new Set([
  '.',
  '!',
  '?',
  '。',
  '！',
  '？',
  '‼',
  '⁇',
  '⁈',
  '⁉'
]);

const WORD_BREAKS = new Set([
  ',',
  ';',
  ':',
  ' ',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  '\t',
  '\n'
]);

const MAX_SECTION_LENGTH = 1000;
const SENTENCE_SEARCH_LIMIT = 100;
const SECTION_OVERLAP = Math.floor(MAX_SECTION_LENGTH * 0.1);
const MAX_OBJECT_LENGTH = 1000;

export function splitPages(pages: ParsedPage[]): Chunk[] {
  const allText = pages.map((page) => page.text).join('');

  if (allText.trim().length === 0) {
    return [];
  }

  const findPage = (offset: number): number => {
    for (let i = 0; i < pages.length - 1; i++) {
      if (offset >= pages[i].offset && offset < pages[i + 1].offset) {
        return pages[i].pageNumber;
      }
    }
    return pages[pages.length - 1].pageNumber;
  };

  const length = allText.length;

  if (length <= MAX_SECTION_LENGTH) {
    return [{ pageNumber: findPage(0), text: allText }];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let end = length;

  while (start + SECTION_OVERLAP < length) {
    let lastWord = -1;
    end = start + MAX_SECTION_LENGTH;

    if (end > length) {
      end = length;
    } else {
      while (
        end < length &&
        end - start - MAX_SECTION_LENGTH < SENTENCE_SEARCH_LIMIT &&
        !SENTENCE_ENDINGS.has(allText[end])
      ) {
        if (WORD_BREAKS.has(allText[end])) {
          lastWord = end;
        }
        end++;
      }
      if (end < length && !SENTENCE_ENDINGS.has(allText[end]) && lastWord > 0) {
        end = lastWord; // al menos no cortamos una palabra por la mitad
      }
    }

    if (end < length) {
      end++;
    }

    lastWord = -1;
    while (
      start > 0 &&
      start > end - MAX_SECTION_LENGTH - 2 * SENTENCE_SEARCH_LIMIT &&
      !SENTENCE_ENDINGS.has(allText[start])
    ) {
      if (WORD_BREAKS.has(allText[start])) {
        lastWord = start;
      }
      start--;
    }
    if (!SENTENCE_ENDINGS.has(allText[start]) && lastWord > 0) {
      start = lastWord;
    }
    if (start > 0) {
      start++;
    }

    const sectionText = allText.slice(start, end);
    chunks.push({ pageNumber: findPage(start), text: sectionText });

    const lastTableStart = sectionText.lastIndexOf('<table');
    if (
      lastTableStart > 2 * SENTENCE_SEARCH_LIMIT &&
      lastTableStart > sectionText.lastIndexOf('</table')
    ) {
      // Sección con una tabla abierta al final: la siguiente arranca en la tabla.
      // El piso de 2 * SENTENCE_SEARCH_LIMIT evita el loop infinito con tablas
      // más largas que MAX_SECTION_LENGTH.
      start = Math.min(end - SECTION_OVERLAP, start + lastTableStart);
    } else {
      start = end - SECTION_OVERLAP;
    }
  }

  if (start + SECTION_OVERLAP < end) {
    chunks.push({
      pageNumber: findPage(start),
      text: allText.slice(start, end)
    });
  }

  return chunks;
}

/** Para JSON, donde no hay oraciones que respetar. */
export function splitPagesSimple(pages: ParsedPage[]): Chunk[] {
  const allText = pages.map((page) => page.text).join('');

  if (allText.trim().length === 0) {
    return [];
  }

  if (allText.length <= MAX_OBJECT_LENGTH) {
    return [{ pageNumber: 1, text: allText }];
  }

  const chunks: Chunk[] = [];
  for (let i = 0; i < allText.length; i += MAX_OBJECT_LENGTH) {
    chunks.push({
      pageNumber: Math.floor(i / MAX_OBJECT_LENGTH) + 1,
      text: allText.slice(i, i + MAX_OBJECT_LENGTH)
    });
  }

  return chunks;
}
