'use server';

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { CLASSIFICATIONS } from '@/constants/data';
import { model } from '@/lib/ai';

const classificationValues = CLASSIFICATIONS.map((c) => c.value) as [
  string,
  ...string[]
];

const searchFiltersSchema = z.object({
  search_query: z
    .string()
    .describe(
      'Términos de búsqueda optimizados. Si no es nombre de archivo, incluir términos en español e inglés separados por coma para conceptos técnicos traducibles.'
    ),
  year: z
    .number()
    .nullable()
    .describe(
      'Año específico solo si el usuario lo menciona explícitamente. null si no aplica.'
    ),
  classification: z
    .enum(classificationValues)
    .nullable()
    .describe(
      'Clasificación del documento solo si el usuario menciona un tipo específico. null si no aplica.'
    ),
  is_filename: z
    .boolean()
    .describe(
      'True si el texto parece ser un nombre de archivo (contiene extensión o patrón de archivo)'
    )
});

export type SearchFiltersResult = z.infer<typeof searchFiltersSchema>;

const SYSTEM_PROMPT = `Eres un asistente que convierte consultas de búsqueda en filtros estructurados para un sistema de búsqueda de documentos técnicos ambientales.

REGLAS IMPORTANTES:
- Usa palabras clave específicas y técnicas en search_query
- Incluye 'year' SOLO si el usuario menciona un año específico
- Incluye 'classification' SOLO si el usuario menciona un tipo específico de documento
- Si el texto parece un nombre de archivo (tiene extensión como .pdf, .xlsx, .docx), marca 'is_filename' como true e incluye el nombre completo
- Si es una consulta de conceptos (is_filename=false), incluye términos en español Y en inglés separados por coma:
  - Traduce SOLO términos técnicos con traducción clara al inglés
  - NO traduzcas nombres propios, siglas, apellidos o palabras sin traducción evidente
  - Si una palabra no se puede traducir, NO la dupliques
  - Formato: "término1 español, término1 inglés, término2 español, término2 inglés"
  - Ejemplo: "contaminación acuífero, aquifer contamination"

CLASIFICACIONES DISPONIBLES:
${CLASSIFICATIONS.map((c) => `- ${c.value}`).join('\n')}

EJEMPLOS:
- "informe de monitoreo 2023" → {search_query: "informe monitoreo, monitoring report", year: 2023, classification: "Reportes de monitoreo", is_filename: false}
- "reporte-agua-marzo.pdf" → {search_query: "reporte-agua-marzo.pdf", is_filename: true}
- "contaminación de suelos por hidrocarburos" → {search_query: "contaminación suelos hidrocarburos, soil contamination hydrocarbons", is_filename: false}
- "muestras de agua pozo MW-5" → {search_query: "muestras agua pozo MW-5, water samples well MW-5", classification: "Muestras", is_filename: false}`;

export async function generateSearchFilters(
  query: string
): Promise<SearchFiltersResult> {
  const { output } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: query,
    output: Output.object({
      schema: searchFiltersSchema
    })
  });

  return output;
}
