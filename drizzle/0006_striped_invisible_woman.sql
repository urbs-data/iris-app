CREATE TABLE "parametros_fisico_quimicos_new" (
	"id_parametro_fq" varchar(100) PRIMARY KEY NOT NULL,
	"organization_id" varchar(100) NOT NULL,
	"fecha_hora_medicion" timestamp,
	"id_pozo" varchar(100),
	"programa_muestreo" varchar(100),
	"id_muestra" varchar(100),
	"profundidad_inicio" real,
	"profundidad_fin" real,
	"unidad_profundidad" varchar(20),
	"parametro" varchar(100),
	"valor_medicion" real,
	"unidad_medicion" varchar(50),
	"comentarios" varchar(500),
	"documento_origen" varchar(200)
);
--> statement-breakpoint
ALTER TABLE "parametros_fisico_quimicos_new" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "parametros_fisico_quimicos_org_isolation" ON "parametros_fisico_quimicos" CASCADE;--> statement-breakpoint
DROP TABLE "parametros_fisico_quimicos" CASCADE;--> statement-breakpoint
ALTER TABLE "parametros_fisico_quimicos_new" ADD CONSTRAINT "parametros_fisico_quimicos_new_id_pozo_pozos_id_pozo_fk" FOREIGN KEY ("id_pozo") REFERENCES "public"."pozos"("id_pozo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros_fisico_quimicos_new" ADD CONSTRAINT "parametros_fisico_quimicos_new_id_muestra_muestras_id_muestra_fk" FOREIGN KEY ("id_muestra") REFERENCES "public"."muestras"("id_muestra") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "parametros_fisico_quimicos_org_isolation" ON "parametros_fisico_quimicos_new" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));