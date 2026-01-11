CREATE TABLE "concentraciones" (
	"id_concentracion" varchar(100) PRIMARY KEY NOT NULL,
	"id_muestra" varchar(100),
	"fecha_laboratorio" timestamp,
	"metodologia_muestreo" varchar(100),
	"protocolo" varchar(100),
	"id_sustancia" varchar(100),
	"metodo" varchar(100),
	"unidad" varchar(100),
	"limite_deteccion" varchar(100),
	"limite_cuantificacion" varchar(100),
	"concentracion" real,
	"documento_origen" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "documentos" (
	"id_documento" varchar(100) PRIMARY KEY NOT NULL,
	"id_estudio" varchar(100),
	"documento" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "estudios_pozos" (
	"id_estudio_pozo" varchar(100) PRIMARY KEY NOT NULL,
	"id_estudio" varchar(100),
	"id_pozo" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "estudios" (
	"id_estudio" varchar(100) PRIMARY KEY NOT NULL,
	"proveedor" varchar(100),
	"informe_final" varchar(100),
	"fecha_desde" timestamp,
	"fecha_hasta" timestamp
);
--> statement-breakpoint
CREATE TABLE "muestras" (
	"id_muestra" varchar(100) PRIMARY KEY NOT NULL,
	"muestra" varchar(100),
	"id_estudio_pozo" varchar(100),
	"tipo" varchar(100),
	"profundidad" real,
	"fecha" timestamp
);
--> statement-breakpoint
CREATE TABLE "parametros_fisico_quimicos" (
	"fecha_hora" timestamp,
	"id_pozo" varchar(100),
	"muestra" varchar(100),
	"profundidad_inicio" real,
	"profundidad_fin" real,
	"unidad_profundidad" varchar(20),
	"parametro" varchar(100),
	"valor" real,
	"unidad" varchar(100),
	"documento_origen" varchar(200)
);
--> statement-breakpoint
ALTER TABLE "concentraciones" ADD CONSTRAINT "concentraciones_id_muestra_muestras_id_muestra_fk" FOREIGN KEY ("id_muestra") REFERENCES "public"."muestras"("id_muestra") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concentraciones" ADD CONSTRAINT "concentraciones_id_sustancia_sustancias_id_sustancia_fk" FOREIGN KEY ("id_sustancia") REFERENCES "public"."sustancias"("id_sustancia") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_id_estudio_estudios_id_estudio_fk" FOREIGN KEY ("id_estudio") REFERENCES "public"."estudios"("id_estudio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estudios_pozos" ADD CONSTRAINT "estudios_pozos_id_estudio_estudios_id_estudio_fk" FOREIGN KEY ("id_estudio") REFERENCES "public"."estudios"("id_estudio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estudios_pozos" ADD CONSTRAINT "estudios_pozos_id_pozo_pozos_id_pozo_fk" FOREIGN KEY ("id_pozo") REFERENCES "public"."pozos"("id_pozo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "muestras" ADD CONSTRAINT "muestras_id_estudio_pozo_estudios_pozos_id_estudio_pozo_fk" FOREIGN KEY ("id_estudio_pozo") REFERENCES "public"."estudios_pozos"("id_estudio_pozo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros_fisico_quimicos" ADD CONSTRAINT "parametros_fisico_quimicos_id_pozo_pozos_id_pozo_fk" FOREIGN KEY ("id_pozo") REFERENCES "public"."pozos"("id_pozo") ON DELETE no action ON UPDATE no action;