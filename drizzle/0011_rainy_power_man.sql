CREATE TABLE "parametros_muestras" (
	"id_parametro_muestra" varchar(100) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(100) NOT NULL,
	"id_laboratorio" integer,
	"ccc" integer,
	"pi" integer,
	"fecha_muestra" timestamp,
	"muestra" varchar(100),
	"analisis" varchar(200)
);
--> statement-breakpoint
ALTER TABLE "parametros_muestras" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "parametros_muestras_org_isolation" ON "parametros_muestras" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));