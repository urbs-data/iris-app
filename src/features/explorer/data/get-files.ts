'use server';

import { faker } from '@faker-js/faker';
import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { getFilesSchema } from './get-files-schema';
import { FileItem } from '../lib/types';

// Simulamos un pequeño delay como en la API de productos
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Función para generar archivos y carpetas dummy
function generateDummyFiles(path: string): FileItem[] {
  const files: FileItem[] = [];

  // Seed basado en el path para consistencia
  faker.seed(path.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));

  // Generar entre 3 y 8 carpetas
  const folderCount = faker.number.int({ min: 3, max: 8 });
  for (let i = 0; i < folderCount; i++) {
    files.push({
      id: faker.string.uuid(),
      name: faker.system.directoryPath().split('/').pop() || faker.word.noun(),
      type: 'folder',
      size: null,
      modifiedAt: faker.date.recent({ days: 30 }),
      uploadedBy: faker.person.fullName()
    });
  }

  // Generar entre 5 y 15 archivos
  const fileCount = faker.number.int({ min: 5, max: 15 });
  const extensions = [
    { ext: 'pdf', mime: 'application/pdf' },
    {
      ext: 'docx',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    },
    {
      ext: 'xlsx',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    { ext: 'jpg', mime: 'image/jpeg' },
    { ext: 'png', mime: 'image/png' },
    { ext: 'txt', mime: 'text/plain' },
    { ext: 'csv', mime: 'text/csv' },
    { ext: 'zip', mime: 'application/zip' }
  ];

  for (let i = 0; i < fileCount; i++) {
    const extension = faker.helpers.arrayElement(extensions);
    files.push({
      id: faker.string.uuid(),
      name: `${faker.word.words({ count: { min: 1, max: 3 } }).replace(/ /g, '_')}.${extension.ext}`,
      type: 'file',
      size: faker.number.int({ min: 1024, max: 52428800 }), // Entre 1KB y 50MB
      mimeType: extension.mime,
      modifiedAt: faker.date.recent({ days: 90 }),
      uploadedBy: faker.person.fullName()
    });
  }

  // Ordenar: primero carpetas, luego archivos, ambos alfabéticamente
  return files.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export const getFiles = authOrganizationActionClient
  .metadata({ actionName: 'getFiles' })
  .inputSchema(getFilesSchema)
  .action(async ({ parsedInput }) => {
    // Simulamos un delay para mostrar el skeleton
    await delay(500);

    const files = generateDummyFiles(parsedInput.path);

    return {
      files,
      currentPath: parsedInput.path
    };
  });
