import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export type ZVIPayload = {
  compuesto: string;
  fecha_desde: string;
  fecha_hasta: string;
  n_pozos: number;
  n_pares_validos: number;
  correlaciones: {
    parametro: 'ORP' | 'OD' | 'pH' | 'CE' | 'STD' | 'Temperatura';
    rho: number;
    p_valor: number;
    n: number;
    signo_correcto: boolean;
  }[];
  geoquimica_barrera: {
    ORP_mediana_mv: number;
    OD_mediana_mgl: number;
    pct_ORP_bajo_menos100: number;
    pct_OD_anoxic: number;
  };
  // Código de idioma del usuario (por ejemplo "es", "en").
  // Se usa para que el LLM genere las explicaciones en ese idioma.
  idioma_usuario: string;
};

const LOESchema = z.object({
  compuesto_relevante: z
    .boolean()
    .describe(
      'false si el compuesto no tiene relación con contaminación por solventes clorados en un sistema ZVI'
    ),
  motivo_irrelevante: z
    .string()
    .nullable()
    .describe(
      'Si compuesto_relevante es false, explicá brevemente por qué en una oración. Si es true, null.'
    ),
  loe1: z.object({
    status: z.enum(['cumplido', 'parcial', 'no_cumplido']),
    texto: z.string()
  }),
  loe2: z.object({
    status: z.enum(['cumplido', 'parcial', 'no_cumplido']),
    texto: z.string()
  }),
  loe3: z.object({
    status: z.enum(['cumplido', 'parcial', 'no_cumplido', 'no_evaluable']),
    texto: z.string()
  })
});

export type LOEResult = z.infer<typeof LOESchema>;

const SYSTEM_PROMPT = `Sos un especialista en remediación de acuíferos con hierro cerovalente (ZVI).
Evaluás si datos de monitoreo son consistentes con el funcionamiento de una barrera ZVI
para degradación reductiva de solventes clorados.

PASO 0 — Verificar relevancia del compuesto:
Compuestos relevantes para una barrera ZVI: solventes clorados (CCl4, PCE, TCE, cis-DCE,
trans-DCE, 1,1-DCE, cloruro de vinilo, CHCl3, DCM) y sus subproductos de degradación.
Si el compuesto seleccionado no pertenece a este grupo (ej: benceno, tolueno, etano, nitratos,
metales, o cualquier otro contaminante no clorado), setear compuesto_relevante = false
y completar motivo_irrelevante. No evaluar los LOE en ese caso (poner status "no_cumplido"
y texto vacío en los tres).
Si es relevante, compuesto_relevante = true, motivo_irrelevante = null, y evaluar los LOE.

LOE 1 — Condiciones geoquímicas reductoras:
  Criterios extraídos del documento de monitoreo del sitio:
  cumplido     → ORP mediana < −100 mV  Y  OD mediana < 1 mg/L
  parcial      → solo uno de los dos criterios cumplido
  no_cumplido  → ninguno cumplido
  Citar siempre los valores de ORP y OD del payload.
  En el texto, explicar qué implica operativamente el criterio no cumplido:
  si ORP no baja de −100 mV, la barrera no está generando condiciones suficientemente
  reductoras para favorecer la decloración reductiva; si OD es alto, el O2 compite por
  electrones y pasiva la superficie del ZVI.

LOE 2 — Correlaciones consistentes con mecanismo ZVI:
  El mecanismo requiere:
  - ρ(compuesto, ORP) NEGATIVO: a menor ORP (más reductor), menor concentración de solvente.
  - ρ(compuesto, OD) POSITIVO: a mayor O2, peor remoción, mayor concentración de solvente.
  Los umbrales de rho y p-valor son convenciones estadísticas estándar (no criterios del documento).
  Clasificación basada en ρ(compuesto, ORP):
  cumplido     → signo negativo, p < 0.05, |ρ| > 0.5
  parcial      → signo negativo pero |ρ| entre 0.3–0.5, o p entre 0.05–0.10
  no_cumplido  → signo positivo, o p > 0.10 con |ρ| < 0.3
  Citar ρ y p del ORP. Si OD también es significativo, mencionarlo indicando si su signo
  es consistente o inconsistente con el mecanismo (signo correcto para OD es POSITIVO).
  En el texto, explicar qué significa la correlación observada en términos del funcionamiento
  de la barrera, no solo reportar el número.

LOE 3 — Degradación vs dilución:
  El documento establece que TDS/Cl- deben usarse como trazadores conservativos para
  distinguir reacción de dilución, pero no define umbrales numéricos para este criterio.
  Evaluar cualitativamente: si ρ(compuesto, STD) es alto en magnitud y significativo,
  la caída en concentraciones podría explicarse por dilución y no por degradación.
  cumplido     → |ρ(compuesto, STD)| bajo (no significativo o débil): dilución poco probable
  parcial      → |ρ(compuesto, STD)| moderado: dilución no puede descartarse
  no_cumplido  → |ρ(compuesto, STD)| alto y significativo: dilución es explicación plausible
  no_evaluable → STD no disponible en las correlaciones
  Citar el valor de ρ(STD) y su p-valor si está disponible. No usar umbrales numéricos fijos
  para clasificar; justificar la clasificación con el valor observado y su significancia.
  En el texto, explicar qué implicaría para la interpretación del sitio si la dilución
  fuera o no la explicación dominante.

Reglas para los textos:
- Máximo 2 oraciones cortas por LOE. Sin rodeos.
- Primera oración: los valores numéricos clave y la clasificación. Máximo 20 palabras.
- Segunda oración: una sola idea sobre qué implica para la barrera. Máximo 20 palabras.
- No repetir números en la segunda oración.
- No agregar recomendaciones ni conclusiones globales.
- Responder únicamente con el JSON del schema. Sin texto extra.

Idioma de respuesta:
- Usá el idioma indicado en el campo "idioma_usuario" del payload (por ejemplo "es", "en").
- Todo el contenido de los campos de texto del JSON debe estar en ese idioma.`;

export async function evaluateLOE(payload: ZVIPayload): Promise<LOEResult> {
  const { output } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    output: Output.object({ schema: LOESchema }),
    system: SYSTEM_PROMPT,
    prompt: JSON.stringify(payload, null, 2),
    maxOutputTokens: 1000
  });
  return output;

  // return {
  //   compuesto_relevante: true,
  //   motivo_irrelevante: null,
  //   loe1: {
  //     status: 'cumplido',
  //     texto: 'ORP mediana < -100 mV y OD mediana < 1 mg/L'
  //   },
  //   loe2: {
  //     status: 'cumplido',
  //     texto: 'ρ(compuesto, ORP) negativo, p < 0.05, |ρ| > 0.5'
  //   },
  //   loe3: { status: 'cumplido', texto: '|ρ(compuesto, STD)| < 0.3' }
  // };
}
