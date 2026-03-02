import 'dotenv/config';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { getDbWithOrg } from '@/db';
import { SamplesETL } from '@/features/documents/explorer/lib/etl/samples-etl';
import { DocumentType } from '@/features/documents/explorer/constants/classifications';

const ORGANIZATION_ID = process.env.SCRIPT_ORG_ID;
const DATA_FOLDER = join(process.cwd(), 'data');

async function main() {
  if (!ORGANIZATION_ID) {
    console.error('Error: la variable de entorno SCRIPT_ORG_ID es requerida.');
    console.error('  Ejemplo: SCRIPT_ORG_ID="org_xxx" bun run etl:samples');
    process.exit(1);
  }

  const db = await getDbWithOrg(ORGANIZATION_ID);
  const etl = new SamplesETL();

  let files: string[];
  try {
    files = readdirSync(DATA_FOLDER).filter((f) =>
      ['.xlsx', '.xls'].includes(extname(f).toLowerCase())
    );
  } catch {
    console.error(`Error: no se encontró la carpeta /data en ${DATA_FOLDER}`);
    console.error('  Creala y colocá los archivos Excel ahí.');
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('No se encontraron archivos Excel en /data');
    process.exit(0);
  }

  console.log(
    `Organización: ${ORGANIZATION_ID}\nProcesando ${files.length} archivo(s)...\n`
  );

  let ok = 0;
  let failed = 0;
  const errorLines: string[] = [];

  for (const fileName of files) {
    const filePath = join(DATA_FOLDER, fileName);
    const buffer = readFileSync(filePath);

    const ctx = {
      db,
      buffer,
      fileName,
      classification: 'Muestras',
      organizationId: ORGANIZATION_ID,
      tipo: DocumentType.EDDMuestras
    };

    if (!etl.canProcess(ctx)) {
      const msg = `[${fileName}] omitido (canProcess = false)`;
      console.log(`⚠  ${msg}`);
      errorLines.push(msg);
      failed++;
      continue;
    }

    console.log(`▶  ${fileName}...`);
    try {
      const result = await etl.process(ctx);

      if (result.success) {
        const { rowsParsed, deleted, inserted } = result.stats;
        console.log(
          `✓  ${fileName}: ${rowsParsed} filas parseadas, ${deleted} eliminados, ${inserted} insertados\n`
        );
        ok++;
      } else {
        console.error(`✗  ${fileName}: falló con errores:`);
        errorLines.push(`[${fileName}]`);
        result.errors.forEach((e) => {
          console.error(`   - ${e}`);
          errorLines.push(`  - ${e}`);
        });
        console.log();
        failed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗  ${fileName}: excepción inesperada:`, err);
      errorLines.push(`[${fileName}] excepción: ${msg}`);
      console.log();
      failed++;
    }
  }

  console.log(`─────────────────────────────────`);
  console.log(`Resultado: ${ok} exitosos, ${failed} fallidos`);

  if (errorLines.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = join(process.cwd(), `etl-errors-${timestamp}.txt`);
    const content = [
      `ETL Muestras - ${new Date().toISOString()}`,
      `Organización: ${ORGANIZATION_ID}`,
      `─────────────────────────────────`,
      ...errorLines
    ].join('\n');
    writeFileSync(logPath, content, 'utf-8');
    console.log(`\nErrores guardados en: ${logPath}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
