import {
  pgTable,
  integer,
  varchar,
  timestamp,
  real,
  serial,
  pgPolicy
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const orgIsolationPolicy = (tableName: string) =>
  pgPolicy(`${tableName}_org_isolation`, {
    as: 'permissive',
    for: 'all',
    using: sql`organization_id = current_setting('app.current_org', true)`,
    withCheck: sql`organization_id = current_setting('app.current_org', true)`
  });

export const countryTable = pgTable('country', {
  id: integer('id').primaryKey(),
  name_en: varchar('name_en', { length: 255 }).notNull(),
  name_es: varchar('name_es', { length: 255 }).notNull(),
  code: varchar('code', { length: 10 }),
  zone: varchar('zone', { length: 50 })
});

export const destinationTable = pgTable('destination', {
  id: integer('id').primaryKey(),
  name_en: varchar('name_en', { length: 255 }).notNull(),
  name_es: varchar('name_es', { length: 255 }).notNull(),
  country_id: integer('country_id').references(() => countryTable.id)
});

export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  photo_url: varchar('photo_url', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  price: real('price').notNull(),
  category: varchar('category', { length: 255 }).notNull(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

export const substancesTable = pgTable('sustancias', {
  id_sustancia: varchar('id_sustancia', { length: 100 }).primaryKey(),
  organization_id: varchar('organization_id', { length: 100 }).notNull(),
  nombre_ingles: varchar('nombre_ingles', { length: 255 }).notNull(),
  nombre_espanol: varchar('nombre_espanol', { length: 255 }),
  alias: varchar('alias', { length: 255 }),
  categoria: varchar('categoria', { length: 100 }),
  nivel_guia: real('nivel_guia'),
  unidad_guia: varchar('unidad_guia', { length: 50 }),
  nivel_guia_suelo: real('nivel_guia_suelo'),
  unidad_guia_suelo: varchar('unidad_guia_suelo', { length: 50 })
});

export const pozosTable = pgTable(
  'pozos',
  {
    id_pozo: varchar('id_pozo', { length: 100 }).primaryKey(),
    organization_id: varchar('organization_id', { length: 100 }).notNull(),
    tipo: varchar('tipo', { length: 100 }),
    cota_tuberia: real('cota_tuberia'),
    elevacion_terreno: real('elevacion_terreno'),
    coordenada_norte: real('coordenada_norte'),
    coordenada_este: real('coordenada_este'),
    latitud_decimal: real('latitud_decimal'),
    longitud_decimal: real('longitud_decimal'),
    fecha_relevamiento: timestamp('fecha_relevamiento'),
    responsable_relevamiento: varchar('responsable_relevamiento', {
      length: 100
    }),
    empresa_relevamiento: varchar('empresa_relevamiento', { length: 100 }),
    comentarios: varchar('comentarios', { length: 100 }),
    descripcion: varchar('descripcion', { length: 100 }),
    area: varchar('area', { length: 100 })
  },
  (t) => [orgIsolationPolicy('pozos')]
).enableRLS();

export const estudiosTable = pgTable(
  'estudios',
  {
    id_estudio: varchar('id_estudio', { length: 100 }).primaryKey(),
    organization_id: varchar('organization_id', { length: 100 }).notNull(),
    proveedor: varchar('proveedor', { length: 100 }),
    informe_final: varchar('informe_final', { length: 100 }),
    fecha_desde: timestamp('fecha_desde'),
    fecha_hasta: timestamp('fecha_hasta')
  },
  (t) => [orgIsolationPolicy('estudios')]
).enableRLS();

export const documentosTable = pgTable(
  'documentos',
  {
    id_documento: varchar('id_documento', { length: 100 }).primaryKey(),
    organization_id: varchar('organization_id', { length: 100 }).notNull(),
    id_estudio: varchar('id_estudio', { length: 100 }).references(
      () => estudiosTable.id_estudio
    ),
    documento: varchar('documento', { length: 100 })
  },
  (t) => [orgIsolationPolicy('documentos')]
).enableRLS();

export const estudiosPozosTable = pgTable(
  'estudios_pozos',
  {
    id_estudio_pozo: varchar('id_estudio_pozo', { length: 100 }).primaryKey(),
    organization_id: varchar('organization_id', { length: 100 }).notNull(),
    id_estudio: varchar('id_estudio', { length: 100 }).references(
      () => estudiosTable.id_estudio
    ),
    id_pozo: varchar('id_pozo', { length: 100 }).references(
      () => pozosTable.id_pozo
    )
  },
  (t) => [orgIsolationPolicy('estudios_pozos')]
).enableRLS();

export const muestrasTable = pgTable(
  'muestras',
  {
    id_muestra: varchar('id_muestra', { length: 100 }).primaryKey(),
    organization_id: varchar('organization_id', { length: 100 }).notNull(),
    muestra: varchar('muestra', { length: 100 }),
    id_estudio_pozo: varchar('id_estudio_pozo', { length: 100 }).references(
      () => estudiosPozosTable.id_estudio_pozo
    ),
    tipo: varchar('tipo', { length: 100 }),
    profundidad: real('profundidad'),
    fecha: timestamp('fecha')
  },
  (t) => [orgIsolationPolicy('muestras')]
).enableRLS();

export const concentracionesTable = pgTable(
  'concentraciones',
  {
    id_concentracion: varchar('id_concentracion', { length: 100 }).primaryKey(),
    organization_id: varchar('organization_id', { length: 100 }).notNull(),
    id_muestra: varchar('id_muestra', { length: 100 }).references(
      () => muestrasTable.id_muestra
    ),
    fecha_laboratorio: timestamp('fecha_laboratorio'),
    metodologia_muestreo: varchar('metodologia_muestreo', { length: 100 }),
    protocolo: varchar('protocolo', { length: 100 }),
    id_sustancia: varchar('id_sustancia', { length: 100 }).references(
      () => substancesTable.id_sustancia
    ),
    metodo: varchar('metodo', { length: 100 }),
    unidad: varchar('unidad', { length: 100 }),
    limite_deteccion: varchar('limite_deteccion', { length: 100 }),
    limite_cuantificacion: varchar('limite_cuantificacion', { length: 100 }),
    concentracion: real('concentracion'),
    documento_origen: varchar('documento_origen', { length: 200 })
  },
  (t) => [orgIsolationPolicy('concentraciones')]
).enableRLS();

export const parametrosFisicoQuimicosTable = pgTable(
  'parametros_fisico_quimicos_new',
  {
    id_parametro_fq: varchar('id_parametro_fq', { length: 100 }).primaryKey(),
    organization_id: varchar('organization_id', { length: 100 }).notNull(),
    fecha_hora_medicion: timestamp('fecha_hora_medicion'), // FIELD_MEASUREMENT_DATETIME

    // Identificadores de sitio y ubicación
    id_pozo: varchar('id_pozo', { length: 100 }).references(
      () => pozosTable.id_pozo
    ), // LOCATION_ID
    programa_muestreo: varchar('programa_muestreo', { length: 100 }), // SAMPLING_PROGRAM
    id_muestra: varchar('id_muestra', { length: 100 }).references(
      () => muestrasTable.id_muestra
    ), // tendriamos que buscarla porque tenemos FIELD_SAMPLE_ID

    // Profundidad
    profundidad_inicio: real('profundidad_inicio'), // FIELD_MEASUREMENT_START_DEPTH
    profundidad_fin: real('profundidad_fin'), // FIELD_MEASUREMENT_END_DEPTH
    unidad_profundidad: varchar('unidad_profundidad', { length: 20 }), // FIELD_MEASUREMENT_DEPTH_UNITS

    // Parámetro y medición
    parametro: varchar('parametro', { length: 100 }), // FIELD_PARAMETER
    valor_medicion: real('valor_medicion'), // FIELD_MEASUREMENT_VALUE
    unidad_medicion: varchar('unidad_medicion', { length: 50 }), // FIELD_MEASUREMENT_UNITS

    // Metadatos
    comentarios: varchar('comentarios', { length: 500 }), // FIELD_MEASUREMENT_COMMENTS
    documento_origen: varchar('documento_origen', { length: 200 }) // DOCUMENT
  },
  (t) => [orgIsolationPolicy('parametros_fisico_quimicos')]
).enableRLS();

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

export type Substance = typeof substancesTable.$inferSelect;
export type NewSubstance = typeof substancesTable.$inferInsert;

export type Pozo = typeof pozosTable.$inferSelect;
export type NewPozo = typeof pozosTable.$inferInsert;

export type Estudio = typeof estudiosTable.$inferSelect;
export type NewEstudio = typeof estudiosTable.$inferInsert;

export type Documento = typeof documentosTable.$inferSelect;
export type NewDocumento = typeof documentosTable.$inferInsert;

export type EstudioPozo = typeof estudiosPozosTable.$inferSelect;
export type NewEstudioPozo = typeof estudiosPozosTable.$inferInsert;

export type Muestra = typeof muestrasTable.$inferSelect;
export type NewMuestra = typeof muestrasTable.$inferInsert;

export type Concentracion = typeof concentracionesTable.$inferSelect;
export type NewConcentracion = typeof concentracionesTable.$inferInsert;

export type ParametroFisicoQuimico =
  typeof parametrosFisicoQuimicosTable.$inferSelect;
export type NewParametroFisicoQuimico =
  typeof parametrosFisicoQuimicosTable.$inferInsert;
