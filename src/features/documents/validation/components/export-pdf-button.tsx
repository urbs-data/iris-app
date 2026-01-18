'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ValidationResultData } from '../lib/models';

interface ExportPdfButtonProps {
  results: ValidationResultData[];
}

const COLORS = {
  ERROR: {
    bg: [255, 204, 204] as [number, number, number],
    text: [204, 0, 0] as [number, number, number]
  },
  WARNING: {
    bg: [255, 244, 204] as [number, number, number],
    text: [179, 98, 0] as [number, number, number]
  }
};

function normalizeStringForPdf(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '?');
}

export function ExportPdfButton({ results }: ExportPdfButtonProps) {
  const t = useTranslations('validation');

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const errorResults = results.filter((r) => r.estado === 'ERROR');
    const warningResults = results.filter((r) => r.estado === 'WARNING');

    const allFiles = Array.from(
      new Set(results.flatMap((r) => Object.values(r.archivos)))
    ).sort();

    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(20);
    doc.text(t('exportToPdf.title'), 40, 40);

    doc.setFontSize(12);
    doc.text(`${t('exportToPdf.date')}: ${currentDate}`, 40, 70);

    const normalizedFiles = allFiles.map(normalizeStringForPdf);

    let fileListY = 90;
    doc.text(t('exportToPdf.filesAnalyzed'), 40, fileListY);
    fileListY += 18;
    const fileItemHeight = 15;
    normalizedFiles.forEach((fileName) => {
      if (fileListY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        fileListY = 40;
      }
      const fileNameLines = doc.splitTextToSize(
        `- ${fileName}`,
        doc.internal.pageSize.getWidth() - 40
      );
      doc.text(fileNameLines, 40, fileListY);
      fileListY += fileNameLines.length * fileItemHeight;
    });

    let yPosition = fileListY + 30;

    const renderDataTable = (
      data: Record<string, unknown>[],
      startY: number,
      tableConfig?: Record<string, unknown>
    ) => {
      if (!data || data.length === 0) return startY;
      const headers = Object.keys(data[0]);
      const tableData = data.map((row) =>
        headers.map((header) => String(row[header] ?? ''))
      );

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY,
        ...(tableConfig || {
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
          },
          margin: { top: 10, right: 40, bottom: 10, left: 40 }
        })
      });
      return (
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 15
      );
    };

    const groupResultsByFile = (resultsList: ValidationResultData[]) => {
      const grouped: Record<string, ValidationResultData[]> = {};
      resultsList.forEach((result) => {
        const normalizedFileNames = Object.values(result.archivos)
          .map(normalizeStringForPdf)
          .sort();
        const key = normalizedFileNames.join(', ');
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(result);
      });
      return Object.entries(grouped).sort(([keyA], [keyB]) =>
        keyA.localeCompare(keyB)
      );
    };

    const groupedErrors = groupResultsByFile(errorResults);
    const groupedWarnings = groupResultsByFile(warningResults);

    const renderStatusSection = (
      title: string,
      groupedResultsByFile: [string, ValidationResultData[]][],
      startY: number,
      colors: (typeof COLORS)[keyof typeof COLORS]
    ): number => {
      let currentY = startY;
      const leftMargin = 40;
      const fileIndent = leftMargin + 10;
      const listIndent = leftMargin + 15;
      const tableIndentMargin = listIndent;
      const contentWidth = doc.internal.pageSize.getWidth() - leftMargin * 2;
      const fileContentWidth =
        doc.internal.pageSize.getWidth() - fileIndent - leftMargin;
      const validationContentWidth =
        doc.internal.pageSize.getWidth() - listIndent - leftMargin;

      if (groupedResultsByFile.length === 0) return currentY;

      if (currentY > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        currentY = 40;
      }

      doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
      doc.rect(leftMargin, currentY - 15, contentWidth, 25, 'F');
      doc.setFontSize(16);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.setFont('Helvetica', 'bold');
      doc.text(title, leftMargin + 10, currentY + 5);
      doc.setTextColor(0, 0, 0);
      doc.setFont('Helvetica', 'normal');
      currentY += 40;

      for (let index = 0; index < groupedResultsByFile.length; index++) {
        const [fileNames, fileGroupResults] = groupedResultsByFile[index];

        if (index > 0) {
          if (currentY > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            currentY = 40;
          }
          doc.setDrawColor(180, 180, 180);
          doc.line(
            leftMargin,
            currentY - 20,
            leftMargin + contentWidth,
            currentY - 20
          );
          currentY += 10;
        }

        if (currentY > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          currentY = 40;
        }

        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        const fileTitleLines = doc.splitTextToSize(fileNames, fileContentWidth);
        doc.text(fileTitleLines, fileIndent, currentY);
        doc.setFont('Helvetica', 'normal');
        currentY += fileTitleLines.length * 15 + 15;

        for (const result of fileGroupResults) {
          const estimatedHeight =
            50 + (result.datos && result.datos.length > 0 ? 60 : 0);
          if (currentY > doc.internal.pageSize.getHeight() - estimatedHeight) {
            doc.addPage();
            currentY = 40;
          }

          doc.setFontSize(11);
          doc.setFont('Helvetica', 'bold');
          doc.text(result.codigo, listIndent, currentY);
          doc.setFont('Helvetica', 'normal');
          currentY += 16;

          doc.setFontSize(10);
          const formattedDescription = t(result.descripcion, result.formateo);

          const descriptionLines = doc.splitTextToSize(
            formattedDescription,
            validationContentWidth
          );
          doc.text(descriptionLines, listIndent, currentY);
          currentY += descriptionLines.length * 12 + 10;

          if (result.datos && result.datos.length > 0) {
            const tableStyles = {
              styles: { fontSize: 10, cellPadding: 3 },
              headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineWidth: 0.5,
                lineColor: [0, 0, 0]
              },
              margin: {
                top: 5,
                right: leftMargin,
                bottom: 10,
                left: tableIndentMargin
              }
            };
            currentY = renderDataTable(result.datos, currentY, tableStyles);
          }

          currentY += 15;
        }
      }
      return currentY;
    };

    yPosition = renderStatusSection(
      t('results.error'),
      groupedErrors,
      yPosition,
      COLORS.ERROR
    );

    yPosition = renderStatusSection(
      t('results.warning'),
      groupedWarnings,
      yPosition,
      COLORS.WARNING
    );
    console.log(t('exportToPdf.documentName'));

    doc.save(`${t('exportToPdf.documentName')}.pdf`);
    console.log('PDF generated');
  };

  return (
    <Button variant='outline' onClick={generatePDF}>
      <FileDown className='mr-2 h-4 w-4' />
      {t('exportToPdf.exportToPdf')}
    </Button>
  );
}
