import { generateText, Output } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai';

// ─── Compound relevance ──────────────────────────────────────────────────────

const ZVI_COMPOUNDS = new Set([
  'CT',
  'CCL4',
  'TC',
  'TETRACLORURO DE CARBONO',
  'CARBON TETRACHLORIDE',
  'CF',
  'CHCL3',
  'CLOROFORMO',
  'CHLOROFORM',
  'PCE',
  'TETRACLOROETILENO',
  'PERCLOROETILENO',
  'PERC',
  'TCE',
  'TRICLOROETILENO',
  'CIS-DCE',
  'TRANS-DCE',
  '1,1-DCE',
  'DCE',
  '1,1-DICLOROETILENO',
  'VC',
  'DCM',
  'CFC11',
  'CFC-11',
  'FREON-11',
  'R-11',
  'CFC12',
  'CFC-12',
  'FREON-12',
  'R-12'
]);

const COMPOUND_ABBREVIATIONS: Record<string, string> = {
  CT: 'CT',
  CCL4: 'CT',
  TC: 'CT',
  'TETRACLORURO DE CARBONO': 'CT',
  'CARBON TETRACHLORIDE': 'CT',
  CF: 'CF',
  CHCL3: 'CF',
  CLOROFORMO: 'CF',
  CHLOROFORM: 'CF',
  PCE: 'PCE',
  TETRACLOROETILENO: 'PCE',
  PERCLOROETILENO: 'PCE',
  PERC: 'PCE',
  TCE: 'TCE',
  TRICLOROETILENO: 'TCE',
  'CIS-DCE': 'cis-DCE',
  'TRANS-DCE': 'trans-DCE',
  '1,1-DCE': 'DCE',
  DCE: 'DCE',
  '1,1-DICLOROETILENO': 'DCE',
  VC: 'VC',
  DCM: 'DCM',
  CFC11: 'CFC11',
  'CFC-11': 'CFC11',
  'FREON-11': 'CFC11',
  'R-11': 'CFC11',
  CFC12: 'CFC12',
  'CFC-12': 'CFC12',
  'FREON-12': 'CFC12',
  'R-12': 'CFC12'
};

function isZVICompound(name: string): boolean {
  return ZVI_COMPOUNDS.has(name.toUpperCase());
}

function compoundAbbreviation(name: string): string {
  return COMPOUND_ABBREVIATIONS[name.toUpperCase()] ?? name;
}

// ─── Deterministic LOE classification ────────────────────────────────────────

type LOEStatus = 'cumplido' | 'parcial' | 'no_cumplido';
type LOE4Status = 'cumple' | 'excede' | 'no_evaluable';
type LOE3Status = LOEStatus | 'no_evaluable';

type ORPClasificacion =
  | 'FUERTEMENTE_REDUCTOR'
  | 'REDUCTOR'
  | 'LEVEMENTE_REDUCTOR'
  | 'OXIDANTE';

type EvaluacionIntegrada =
  | 'OPTIMA'
  | 'FAVORABLE'
  | 'SUBOPTIMA'
  | 'DESFAVORABLE';

interface Correlation {
  parametro: 'ORP' | 'OD' | 'pH' | 'CE' | 'STD' | 'Temperatura';
  rho: number;
  p_valor: number;
  n: number;
}

function classifyORP(mediana: number): ORPClasificacion {
  if (mediana < -200) return 'FUERTEMENTE_REDUCTOR';
  if (mediana < -100) return 'REDUCTOR';
  if (mediana < 0) return 'LEVEMENTE_REDUCTOR';
  return 'OXIDANTE';
}

function calcIntegratedScore(
  orpMediana: number,
  odMediana: number,
  phMediana: number
): EvaluacionIntegrada {
  let score = 0;
  if (orpMediana < -100) score += 3;
  else if (orpMediana < 0) score += 2;
  else if (orpMediana < 100) score += 1;

  if (odMediana < 1.0) score += 2;
  else if (odMediana < 2.0) score += 1;

  if (phMediana >= 6.5 && phMediana <= 8.5) score += 1;

  if (score >= 5) return 'OPTIMA';
  if (score >= 3) return 'FAVORABLE';
  if (score >= 1) return 'SUBOPTIMA';
  return 'DESFAVORABLE';
}

interface LOE1Result {
  status: LOEStatus;
  clasificacion_orp: ORPClasificacion;
  evaluacion_integrada: EvaluacionIntegrada;
}

function classifyLOE1(
  orpMediana: number,
  odMediana: number,
  phMediana: number
): LOE1Result {
  const orpOk = orpMediana < -100;
  const odOk = odMediana < 1.0;

  let status: LOEStatus;
  if (orpOk && odOk) status = 'cumplido';
  else if (orpOk || odOk) status = 'parcial';
  else status = 'no_cumplido';

  return {
    status,
    clasificacion_orp: classifyORP(orpMediana),
    evaluacion_integrada: calcIntegratedScore(orpMediana, odMediana, phMediana)
  };
}

interface LOE2Result {
  status: LOEStatus;
  spearman_aplicable: boolean;
  rho_orp: number | null;
  p_orp: number | null;
}

function classifyLOE2(
  correlaciones: Correlation[],
  nEventos: number
): LOE2Result {
  const orp = correlaciones.find((c) => c.parametro === 'ORP');
  const spearman_aplicable = nEventos >= 4;

  if (!orp) {
    return {
      status: 'no_cumplido',
      spearman_aplicable,
      rho_orp: null,
      p_orp: null
    };
  }

  const { rho, p_valor } = orp;
  let status: LOEStatus;

  if (rho < 0 && p_valor < 0.05 && Math.abs(rho) > 0.5) {
    status = 'cumplido';
  } else if (rho < 0 && (Math.abs(rho) >= 0.3 || p_valor <= 0.1)) {
    status = 'parcial';
  } else {
    status = 'no_cumplido';
  }

  return {
    status,
    spearman_aplicable,
    rho_orp: Number(rho.toFixed(3)),
    p_orp: Number(p_valor.toFixed(3))
  };
}

interface LOE3Result {
  status: LOE3Status;
  trazador_usado: 'CE' | 'STD' | 'NINGUNO';
  rho_trazador: number | null;
  p_trazador: number | null;
}

function classifyLOE3(correlaciones: Correlation[]): LOE3Result {
  const ce = correlaciones.find((c) => c.parametro === 'CE');
  const std = correlaciones.find((c) => c.parametro === 'STD');
  const trazador = ce ?? std;

  if (!trazador) {
    return {
      status: 'no_evaluable',
      trazador_usado: 'NINGUNO',
      rho_trazador: null,
      p_trazador: null
    };
  }

  const trazador_usado = ce ? ('CE' as const) : ('STD' as const);
  const absRho = Math.abs(trazador.rho);
  const { p_valor } = trazador;

  let status: LOE3Status;
  if (absRho < 0.3) {
    status = 'cumplido';
  } else if (absRho > 0.7 && p_valor < 0.05) {
    status = 'no_cumplido';
  } else {
    status = 'parcial';
  }

  return {
    status,
    trazador_usado,
    rho_trazador: Number(trazador.rho.toFixed(3)),
    p_trazador: Number(p_valor.toFixed(3))
  };
}

interface LOE4Input {
  valor_ug_L: number;
  ng_ug_L: number;
  excede_ng: boolean;
}

interface LOE4Result {
  status: LOE4Status;
}

function classifyLOE4(input: LOE4Input | null): LOE4Result {
  if (!input) return { status: 'no_evaluable' };
  return { status: input.excede_ng ? 'excede' : 'cumple' };
}

// ─── Payload for the LLM (pre-computed, minimal) ─────────────────────────────

export interface LOEPayload {
  compuesto: string;
  compuesto_abreviado: string;
  idioma: string;
  loe1: {
    status: LOEStatus;
    clasificacion_orp: string;
    evaluacion_integrada: string;
    orp_mediana_mv: number;
    od_mediana_mgl: number;
    ph_mediana: number;
  };
  loe2: {
    status: LOEStatus;
    spearman_aplicable: boolean;
    n_eventos: number;
    rho_orp: number | null;
    p_orp: number | null;
  };
  loe3: {
    status: LOE3Status;
    trazador_usado: 'CE' | 'STD' | 'NINGUNO';
    rho_trazador: number | null;
    p_trazador: number | null;
  };
  loe4: {
    status: LOE4Status;
    valor_ug_L: number | null;
    ng_ug_L: number | null;
    pct_cambio_desde_lb: number | null;
  };
}

// ─── i18n labels for LLM payload ─────────────────────────────────────────────

const ORP_LABELS: Record<string, Record<ORPClasificacion, string>> = {
  es: {
    FUERTEMENTE_REDUCTOR: 'fuertemente reductor',
    REDUCTOR: 'reductor',
    LEVEMENTE_REDUCTOR: 'levemente reductor',
    OXIDANTE: 'oxidante'
  },
  en: {
    FUERTEMENTE_REDUCTOR: 'strongly reducing',
    REDUCTOR: 'reducing',
    LEVEMENTE_REDUCTOR: 'mildly reducing',
    OXIDANTE: 'oxidizing'
  }
};

const INTEGRADA_LABELS: Record<string, Record<EvaluacionIntegrada, string>> = {
  es: {
    OPTIMA: 'óptima',
    FAVORABLE: 'favorable',
    SUBOPTIMA: 'subóptima',
    DESFAVORABLE: 'desfavorable'
  },
  en: {
    OPTIMA: 'optimal',
    FAVORABLE: 'favorable',
    SUBOPTIMA: 'suboptimal',
    DESFAVORABLE: 'unfavorable'
  }
};

function labelORP(clasificacion: ORPClasificacion, idioma: string): string {
  const lang = idioma.startsWith('en') ? 'en' : 'es';
  return ORP_LABELS[lang][clasificacion];
}

function labelIntegrada(
  evaluacion: EvaluacionIntegrada,
  idioma: string
): string {
  const lang = idioma.startsWith('en') ? 'en' : 'es';
  return INTEGRADA_LABELS[lang][evaluacion];
}

// ─── Build the payload from raw data ─────────────────────────────────────────

export interface LOERawInput {
  compuesto: string;
  idioma: string;
  correlaciones: Correlation[];
  n_eventos: number;
  orp_mediana: number;
  od_mediana: number;
  ph_mediana: number;
  cumplimiento: {
    valor_ug_L: number;
    ng_ug_L: number;
    excede_ng: boolean;
  } | null;
  pct_cambio_desde_lb: number | null;
}

function buildLOEPayload(input: LOERawInput): LOEPayload {
  const loe1 = classifyLOE1(
    input.orp_mediana,
    input.od_mediana,
    input.ph_mediana
  );
  const loe2 = classifyLOE2(input.correlaciones, input.n_eventos);
  const loe3 = classifyLOE3(input.correlaciones);
  const loe4 = classifyLOE4(input.cumplimiento);

  return {
    compuesto: input.compuesto,
    compuesto_abreviado: compoundAbbreviation(input.compuesto),
    idioma: input.idioma,
    loe1: {
      status: loe1.status,
      clasificacion_orp: labelORP(loe1.clasificacion_orp, input.idioma),
      evaluacion_integrada: labelIntegrada(
        loe1.evaluacion_integrada,
        input.idioma
      ),
      orp_mediana_mv: input.orp_mediana,
      od_mediana_mgl: input.od_mediana,
      ph_mediana: input.ph_mediana
    },
    loe2: {
      ...loe2,
      n_eventos: input.n_eventos
    },
    loe3,
    loe4: {
      status: loe4.status,
      valor_ug_L: input.cumplimiento?.valor_ug_L ?? null,
      ng_ug_L: input.cumplimiento?.ng_ug_L ?? null,
      pct_cambio_desde_lb: input.pct_cambio_desde_lb
    }
  };
}

// ─── LLM: text generation only ──────────────────────────────────────────────

const LOESchema = z.object({
  loe1_texto: z.string(),
  loe2_texto: z.string(),
  loe3_texto: z.string(),
  loe4_texto: z.string()
});

const SYSTEM_PROMPT = `Sos un especialista en remediación de acuíferos con ZVI (hierro cerovalente).
Recibís un JSON con los status y datos de 4 líneas de evidencia (LOE) ya clasificados.
Tu única tarea es redactar un texto breve para cada LOE.

Reglas de redacción:
- Exactamente 2 oraciones por LOE. Primera: datos clave. Segunda: implicancia operativa.
- Máximo 20 palabras por oración.
- Referite al compuesto con su abreviación (campo "compuesto_abreviado").
- Usá nombres legibles: "mediana de ORP", "mediana de OD", no nombres de campos JSON.
- No repitas números en la segunda oración.
- No agregues recomendaciones ni conclusiones globales.
- Idioma: el indicado en "idioma".

Guía por LOE:

LOE 1 — Condiciones geoquímicas:
- Citar mediana de ORP (mV) y OD (mg/L), y la clasificación (ej: OXIDANTE, REDUCTOR).
- Implicancia: si ORP < -100 mV → condiciones reductoras favorables; 
  si ORP entre -100 y 0 → actividad ZVI limitada; 
  si ORP > 0 → condiciones insuficientes. 
  Solo mencionar pasivación si OD > 2 mg/L.

LOE 2 — Correlaciones con mecanismo ZVI:
- Citar ρ y p del ORP. Si n_eventos =< 4, mencionar que Spearman tiene baja potencia estadística.
- Implicancia: si p > 0.05 o n_eventos =< 4 → sin evidencia interpretable 
  del control de la barrera. No usar "débil evidencia".

LOE 3 — Degradación vs dilución:
- Si trazador_usado ≠ NINGUNO: citar ρ y p del trazador (CE o STD).
- Si trazador_usado = NINGUNO: indicar que no hay datos de conductividad ni sólidos disueltos.
- Implicancia: si ρ(CT, trazador) es alto y positivo → dilución puede ser 
  factor dominante. Si ρ bajo o negativo → dilución no explica la atenuación.

LOE 4 — Cumplimiento regulatorio:
- Citar valor vs nivel guía en µg/L.
- Si hay pct_cambio_desde_lb, mencionar tendencia desde línea base.
- Si status = no_evaluable: indicar que no hay nivel guía definido.`;

export interface LOEResult {
  compuesto_relevante: boolean;
  motivo_irrelevante: string | null;
  loe1: { status: string; texto: string };
  loe2: { status: string; texto: string };
  loe3: { status: string; texto: string };
  loe4: { status: string; texto: string };
}

export async function evaluateLOE(input: LOERawInput): Promise<LOEResult> {
  if (!isZVICompound(input.compuesto)) {
    const abbr = compoundAbbreviation(input.compuesto);
    return {
      compuesto_relevante: false,
      motivo_irrelevante: `${abbr} no es un solvente clorado relevante para ZVI`,
      loe1: { status: 'no_evaluable', texto: '' },
      loe2: { status: 'no_evaluable', texto: '' },
      loe3: { status: 'no_evaluable', texto: '' },
      loe4: { status: 'no_evaluable', texto: '' }
    };
  }

  const payload = buildLOEPayload(input);
  console.log({ payload });

  const { output } = await generateText({
    model,
    output: Output.object({ schema: LOESchema }),
    system: SYSTEM_PROMPT,
    prompt: JSON.stringify(payload, null, 2)
  });
  console.log({ output });
  if (!output) {
    console.error('evaluateLOE: LLM returned no structured output');
    return {
      compuesto_relevante: true,
      motivo_irrelevante: null,
      loe1: { status: payload.loe1.status, texto: '' },
      loe2: { status: payload.loe2.status, texto: '' },
      loe3: { status: payload.loe3.status, texto: '' },
      loe4: { status: payload.loe4.status, texto: '' }
    };
  }

  return {
    compuesto_relevante: true,
    motivo_irrelevante: null,
    loe1: { status: payload.loe1.status, texto: output.loe1_texto },
    loe2: { status: payload.loe2.status, texto: output.loe2_texto },
    loe3: { status: payload.loe3.status, texto: output.loe3_texto },
    loe4: { status: payload.loe4.status, texto: output.loe4_texto }
  };
}
