'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { uploadDocumentsSchema } from './upload-documents-schema';

export const uploadDocuments = authOrganizationActionClient
  .metadata({ actionName: 'uploadDocuments' })
  .inputSchema(uploadDocumentsSchema)
  .action(async ({ parsedInput, ctx }) => {
    console.log('Upload documents called with:', {
      date: parsedInput.date,
      classification: parsedInput.classification,
      subClassification: parsedInput.subClassification,
      area: parsedInput.area,
      filesCount: parsedInput.files.length,
      organizationId: ctx.organization.id
    });

    return {
      success: true,
      message: 'uploadDocument.uploadSuccess'
    };
  });
