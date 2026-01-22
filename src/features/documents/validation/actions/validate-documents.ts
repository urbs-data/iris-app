'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { validateDocumentsSchema } from './validate-documents-schema';
import { ValidationResultData } from '../lib/models';

export const validateDocuments = authOrganizationActionClient
  .metadata({ actionName: 'validateDocuments' })
  .inputSchema(validateDocumentsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const form = new FormData();
    const baseUrl = process.env.API_URL;

    parsedInput.documents.forEach((document) => {
      form.append('files', document.file);
      form.append('document_types', document.documentType);
    });

    const headers = new Headers();
    headers.set('Accept', 'application/json');
    headers.set('X-Organization-Id', ctx.organization.id);

    const response = await fetch(`${baseUrl}/documents/validate`, {
      method: 'POST',
      body: form,
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to validate documents');
    }

    return response.json() as unknown as ValidationResultData[];
  });
