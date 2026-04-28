CREATE TABLE "resumen_parametros" (
	"id_resumen_parametros" varchar(100) PRIMARY KEY NOT NULL,
	"organization_id" varchar(100) NOT NULL,
	"id_pozo" varchar(100),
	"fecha_hora_medicion" timestamp,
	"olor" varchar(255),
	"apariencia_agua_inicio" varchar(255),
	"apariencia_agua_estabilizacion" varchar(255),
	"documento_origen" varchar(200)
);
--> statement-breakpoint
ALTER TABLE "resumen_parametros" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resumen_parametros" ADD CONSTRAINT "resumen_parametros_id_pozo_pozos_id_pozo_fk" FOREIGN KEY ("id_pozo") REFERENCES "public"."pozos"("id_pozo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "resumen_parametros_org_isolation" ON "resumen_parametros" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));