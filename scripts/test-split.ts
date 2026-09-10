/**
 * Chequeo del splitter de documentos. Correr con:
 *   npx tsx --tsconfig tsconfig.json scripts/test-split.ts
 */
import assert from 'node:assert';
import {
  splitPages,
  splitPagesSimple
} from '../src/features/documents/explorer/lib/indexing/split';
import type { ParsedPage } from '../src/features/documents/explorer/lib/indexing/parse';

function asPages(texts: string[]): ParsedPage[] {
  let offset = 0;
  return texts.map((text, index) => {
    const page = { pageNumber: index + 1, offset, text };
    offset += text.length;
    return page;
  });
}

const sentence = 'La napa freatica registro un descenso de 2 metros. ';
const longText = sentence.repeat(200);

const short = splitPages(asPages(['Informe breve.']));
assert.equal(short.length, 1);
assert.equal(short[0].text, 'Informe breve.');
assert.equal(short[0].pageNumber, 1);

assert.deepEqual(splitPages(asPages(['   ', '\n'])), []);
assert.deepEqual(splitPages([]), []);

const chunks = splitPages(asPages([longText]));
assert.ok(chunks.length > 1, 'deberia partirse en varios chunks');

for (const chunk of chunks) {
  assert.ok(
    chunk.text.length <= 1200,
    `chunk de ${chunk.text.length} caracteres, esperaba <= 1200`
  );
}

const joined = chunks.map((c) => c.text).join('');
assert.ok(
  joined.length >= longText.length,
  'los chunks solapados deben cubrir el texto entero'
);

for (let i = 1; i < chunks.length; i++) {
  const tail = chunks[i - 1].text.slice(-40);
  assert.ok(
    longText.includes(tail),
    'el final de cada chunk debe existir en el texto original'
  );
}

const multiPage = splitPages(asPages([longText, 'Anexo final. '.repeat(200)]));
const pageNumbers = new Set(multiPage.map((c) => c.pageNumber));
assert.ok(
  pageNumbers.has(1) && pageNumbers.has(2),
  'debe mapear ambas paginas'
);

const withTable = splitPages(
  asPages([sentence.repeat(18) + '<table><tr><td>' + 'dato '.repeat(300)])
);
assert.ok(withTable.length > 1);
assert.ok(
  withTable.some((c) => c.text.includes('<table')),
  'la tabla debe quedar en algun chunk'
);

const simple = splitPagesSimple(asPages(['x'.repeat(2500)]));
assert.equal(simple.length, 3);
assert.equal(simple[0].text.length, 1000);
assert.equal(simple[2].text.length, 500);
assert.deepEqual(
  simple.map((c) => c.pageNumber),
  [1, 2, 3]
);

console.log(`OK — ${chunks.length} chunks para ${longText.length} caracteres`); // eslint-disable-line no-console
