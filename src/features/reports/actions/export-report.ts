'use server';

import { authOrganizationActionClient } from '@/lib/actions/safe-action';
import { exportReportSchema } from './export-report-schema';
import type { ExportedReportPayload } from '../lib/types';
import { revalidatePath } from 'next/cache';

function getFileNameFromHeaders(headers: Headers): string {
  const contentDisposition = headers.get('content-disposition');

  if (!contentDisposition) {
    return 'reporte.xlsx';
  }

  const fileNameMatch = contentDisposition.match(
    /filename\*?=(?:UTF-8''|")?([^\";]+)"?/i
  );

  if (!fileNameMatch?.[1]) {
    return 'reporte.xlsx';
  }

  return decodeURIComponent(fileNameMatch[1]);
}

export const exportReport = authOrganizationActionClient
  .metadata({ actionName: 'exportReport' })
  .inputSchema(exportReportSchema)
  .action(async ({ parsedInput, ctx }): Promise<ExportedReportPayload> => {
    const baseUrl = process.env.API_URL;

    if (!baseUrl) {
      throw new Error('API_URL is not configured');
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', '*/*');
    headers.set('X-Organization-Id', ctx.organization.id);
    headers.set('X-User-Id', ctx.session.user.id);
    headers.set(
      'X-User-Name',
      ctx.session.user.firstName + ' ' + ctx.session.user.lastName
    );
    headers.set('X-User-Email', ctx.session.user.email);

    const response = await fetch(`${baseUrl}/data/export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        preset: parsedInput.preset,
        report_type: parsedInput.reportType,
        fecha_desde: parsedInput.fechaDesde,
        fecha_hasta: parsedInput.fechaHasta,
        pozos: parsedInput.pozos?.length ? parsedInput.pozos : null
      })
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || 'Failed to export report');
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    revalidatePath('/reports');

    return {
      fileName: getFileNameFromHeaders(response.headers),
      contentType:
        response.headers.get('content-type') ??
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64
    };
  });
