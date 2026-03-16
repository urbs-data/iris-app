import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { model } from '@/lib/ai';

export type ZVIPayload = {
  compuesto: string;
  fecha_desde: string;
  fecha_hasta: string;
  n_pozos: number;
  n_pares_validos: number;
  /** Número de campañas (LB + T1 + T2 + …). Spearman válido solo si >= 4. */
  n_eventos: number;
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
    /** Tercer criterio de la matriz integrada OPTIMA/FAVORABLE/etc. */
    pH_mediana: number;
    pct_ORP_bajo_menos100: number;
    /** % pozos en zona de metanogénesis (óptimo según ESTCP ER-201427). */
    pct_ORP_bajo_menos200: number;
    /** % mediciones OD < 0.5 mg/L (anóxico estricto). */
    pct_OD_anoxic: number;
    /** % mediciones OD 0.5–1.0 mg/L (subanoxico favorable). */
    pct_OD_subanoxico: number;
  };
  /** Tendencia desde línea base. null si solo hay un evento o LB no disponible. */
  tendencia_lb: {
    pct_cambio: number | null;
    flag: 'NORMAL' | 'REDUCCION_A_ND' | null;
  };
  /** null si el compuesto no tiene NG definido en D.831/93. */
  cumplimiento_ultimo_evento: {
    valor_ug_L: number;
    ng_ug_L: number;
    excede_ng: boolean;
    estado_global: 'CUMPLE' | 'EXCEDE';
  } | null;
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
      'Si compuesto_relevante es false, explicá brevemente por qué. Si es true, null.'
    ),

  loe1: z.object({
    status: z.enum(['cumplido', 'parcial', 'no_cumplido']),
    /**
     * Clasificación granular del ORP mediano según escala del PO v3.
     * Independiente del status binario cumplido/parcial/no_cumplido.
     */
    clasificacion_orp: z.enum([
      'FUERTEMENTE_REDUCTOR',
      'REDUCTOR',
      'LEVEMENTE_REDUCTOR',
      'OXIDANTE'
    ]),
    /**
     * Evaluación integrada ORP + OD + pH con puntaje según PO v3 Sección 7.5.
     * ORP peso 3 · OD peso 2 · pH peso 1. Score >= 5 → OPTIMA, >= 3 → FAVORABLE, etc.
     */
    evaluacion_integrada: z.enum([
      'OPTIMA',
      'FAVORABLE',
      'SUBOPTIMA',
      'DESFAVORABLE'
    ]),
    texto: z.string()
  }),

  loe2: z.object({
    status: z.enum(['cumplido', 'parcial', 'no_cumplido']),
    /** false si n_eventos < 4: el test de Spearman no tiene potencia estadística suficiente. */
    spearman_aplicable: z.boolean(),
    texto: z.string()
  }),

  loe3: z.object({
    status: z.enum(['cumplido', 'parcial', 'no_cumplido', 'no_evaluable']),
    /** Trazador de dilución efectivamente usado para la clasificación. */
    trazador_usado: z.enum(['CE', 'STD', 'NINGUNO']),
    texto: z.string()
  }),

  /** Cumplimiento regulatorio Decreto 831/93 Tabla 1. */
  loe4: z.object({
    status: z.enum(['cumple', 'excede', 'no_evaluable']),
    texto: z.string()
  })
});

export type LOEResult = z.infer<typeof LOESchema>;

const SYSTEM_PROMPT = `Sos un especialista en remediación de acuíferos con hierro cerovalente (ZVI).
Evaluás si datos de monitoreo son consistentes con el funcionamiento de una barrera ZVI
para degradación reductiva de solventes clorados.

Estos resultados se muestran en un dashboard que incluye gráficos de dispersión
(parámetro geoquímico vs concentración del compuesto) y una matriz de correlación Spearman.
Tus textos deben ser coherentes con lo que el usuario está viendo en esos gráficos.

───────────────────────────────────────────────────────────
PASO 0 — Verificar relevancia del compuesto
───────────────────────────────────────────────────────────
Compuestos relevantes para una barrera ZVI (solventes clorados y subproductos):
CT, CCl4, CF, CHCl3, PCE, TCE, cis-DCE, trans-DCE, 1,1-DCE, DCE, VC,
DCM, CFC11, CFC-11, CFC12, CFC-12.

Sinónimos aceptados (normalizar antes de evaluar):
- CT / CCl4 / TC / Tetracloruro de Carbono / Carbon Tetrachloride → CT
- CF / CHCl3 / Cloroformo / Chloroform → CF
- PCE / Tetracloroetileno / Percloroetileno / PERC → PCE
- TCE / Tricloroetileno → TCE
- DCE / 1,1-DCE / 1,1-Dicloroetileno → DCE
- CFC11 / CFC-11 / Freon-11 / R-11 → CFC11
- CFC12 / CFC-12 / Freon-12 / R-12 → CFC12

Si el compuesto no pertenece a este grupo (benceno, tolueno, nitratos, metales, etc.),
setear compuesto_relevante = false y completar motivo_irrelevante.
No evaluar los LOE en ese caso: status "no_cumplido" y texto vacío en los cuatro.
Si es relevante: compuesto_relevante = true, motivo_irrelevante = null, evaluar todos los LOE.

───────────────────────────────────────────────────────────
LOE 1 — Condiciones geoquímicas reductoras
───────────────────────────────────────────────────────────
Escala de ORP (PO v3, Sección 7.2):
  < −200 mV        → FUERTEMENTE_REDUCTOR  (metanogénesis, óptimo ESTCP)
  −200 a −100 mV   → REDUCTOR              (sulfato-reducción, muy favorable)
  −100 a 0 mV      → LEVEMENTE_REDUCTOR    (Fe(III)-reducción, favorable)
  > 0 mV           → OXIDANTE              (desfavorable)

Escala de OD (PO v3, Sección 7.3):
  < 0.5 mg/L       → ANÓXICO               (óptimo para ZVI)
  0.5–1.0 mg/L     → SUBANOXICO            (favorable)
  1.0–2.0 mg/L     → TRANSICIÓN            (monitorear)
  > 2.0 mg/L       → ÓXICO                 (pasivación del ZVI)

Criterio de status:
  cumplido    → ORP mediana < −100 mV  Y  OD mediana < 1.0 mg/L
  parcial     → solo uno de los dos criterios cumplido
  no_cumplido → ninguno cumplido

Campo clasificacion_orp: usar la escala de 4 niveles sobre el ORP mediano.
Si ORP < −200 mV, clasificar como FUERTEMENTE_REDUCTOR aunque el status sea "cumplido".

Campo evaluacion_integrada: calcular con puntaje (PO v3, Sección 7.5):
  ORP: < −100 mV → +3 pts; < 0 mV → +2 pts; < 100 mV → +1 pt
  OD:  < 1.0 mg/L → +2 pts; < 2.0 mg/L → +1 pt
  pH:  6.5–8.5 → +1 pt
  Score ≥ 5 → OPTIMA; ≥ 3 → FAVORABLE; ≥ 1 → SUBOPTIMA; 0 → DESFAVORABLE

Texto:
- Primera oración: citar ORP_mediana y OD_mediana; usar la escala granular.
  Si ORP < −200 mV, mencionarlo como condición óptima.
- Segunda oración: qué implica operativamente.
  Si ORP no baja de −100 mV → la barrera no genera condiciones suficientes para decloración.
  Si OD > 2 mg/L → el O₂ compite por electrones y pasiva la superficie del ZVI.

───────────────────────────────────────────────────────────
LOE 2 — Correlaciones consistentes con mecanismo ZVI
───────────────────────────────────────────────────────────
Los scatter plots del dashboard muestran la relación entre cada parámetro y el compuesto.
El LOE debe ser coherente con la tendencia visual del scatter ORP vs compuesto.

Señales esperadas:
- ρ(compuesto, ORP) NEGATIVO: más reductor → menos solvente.
- ρ(compuesto, OD)  POSITIVO: más O₂ → peor remoción.

Clasificación basada en ρ(compuesto, ORP):
  cumplido    → signo negativo, p < 0.05, |ρ| > 0.5
  parcial     → signo negativo con |ρ| 0.3–0.5, o p 0.05–0.10
  no_cumplido → signo positivo, o p > 0.10 con |ρ| < 0.3

Campo spearman_aplicable: true solo si n_eventos >= 4.
Si n_eventos < 4, el test de Spearman no tiene potencia estadística y el resultado
es solo indicativo. Mencionar esto en el texto; la significancia será evaluable
a partir del cuarto evento.

Sobre OD: si disponible y significativo, mencionarlo indicando si el signo
es consistente (POSITIVO = correcto) o inconsistente con el mecanismo.

Texto:
- Primera oración: citar ρ y p del ORP; mencionar n_eventos si < 4.
- Segunda oración: qué significa en términos de funcionamiento de la barrera.

───────────────────────────────────────────────────────────
LOE 3 — Degradación vs dilución
───────────────────────────────────────────────────────────
La fila/columna del compuesto en la matriz de correlación del dashboard
muestra su relación con CE y STD. El LOE 3 debe ser coherente con eso.

Jerarquía de trazadores (PO v3, Sección 8.2.4):
1. CE (Conductividad): trazador primario. Fórmula: CT_normalizado = CT × 1000 / CE.
2. STD: alternativa si CE no disponible.
Usar CE con preferencia. Registrar en trazador_usado cuál se usó.

Si ρ(compuesto, trazador) es alto y significativo → la caída puede ser dilución.
Si es bajo o no significativo → dilución poco probable.

  cumplido     → |ρ| bajo o no significativo
  parcial      → |ρ| moderado, dilución no descartable
  no_cumplido  → |ρ| alto y significativo
  no_evaluable → ni CE ni STD disponibles → trazador_usado = NINGUNO

No usar umbrales numéricos fijos; justificar con el valor observado y su significancia.
Citar ρ y p del trazador usado.

Texto:
- Primera oración: citar ρ(CE o STD) y su significancia.
- Segunda oración: qué implicaría si la dilución fuera o no la causa dominante.

───────────────────────────────────────────────────────────
LOE 4 — Cumplimiento regulatorio (Decreto 831/93 Tabla 1)
───────────────────────────────────────────────────────────
Niveles guía de referencia del sitio:
  CT → 3 µg/L    CF → 30 µg/L    PCE → 10 µg/L
  TCE → 30 µg/L  DCE → 0.3 µg/L  CFC11 → 2 µg/L  CFC12 → 2 µg/L

Clasificación:
  cumple      → valor_ug_L < ng_ug_L
  excede      → valor_ug_L ≥ ng_ug_L
  no_evaluable → cumplimiento_ultimo_evento es null en el payload

Notar si el valor está entre 80–100% del NG aunque no lo supere (zona de alerta).

Texto:
- Primera oración: valor observado vs NG con unidades; indicar si cumple o excede.
- Segunda oración: contexto de tendencia si tendencia_lb.pct_cambio disponible
  (mencionar si viene bajando desde LB y en qué magnitud).

───────────────────────────────────────────────────────────
Reglas para todos los textos
───────────────────────────────────────────────────────────
- Máximo 2 oraciones cortas por LOE.
- Primera oración: valores numéricos clave y clasificación. Máximo 20 palabras.
- Segunda oración: una sola idea sobre qué implica para la barrera. Máximo 20 palabras.
- No repetir números en la segunda oración.
- No agregar recomendaciones ni conclusiones globales.
- Responder únicamente con el JSON del schema. Sin texto extra.

Idioma: usar el indicado en "idioma_usuario". Todo el contenido en ese idioma.`;

export async function evaluateLOE(payload: ZVIPayload): Promise<LOEResult> {
  const { output } = await generateText({
    model,
    output: Output.object({ schema: LOESchema }),
    system: SYSTEM_PROMPT,
    prompt: JSON.stringify(payload, null, 2),
    maxOutputTokens: 1000
  });
  return output;
}
