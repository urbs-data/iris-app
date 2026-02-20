CREATE TYPE "public"."preset" AS ENUM('formulario_6_provincia_ba');--> statement-breakpoint
CREATE TYPE "public"."tipo_reporte" AS ENUM('individual', 'preset');--> statement-breakpoint
CREATE TABLE "reportes" (
	"id_reporte" varchar(100) PRIMARY KEY NOT NULL,
	"organization_id" varchar(100) NOT NULL,
	"fecha_desde" timestamp NOT NULL,
	"fecha_hasta" timestamp NOT NULL,
	"extension" varchar(10) NOT NULL,
	"nombre_archivo" varchar(100) NOT NULL,
	"tipo_reporte" "tipo_reporte",
	"preset" "preset",
	"id_usuario" varchar(100) NOT NULL,
	"email_usuario" varchar(100) NOT NULL,
	"nombre_usuario" varchar(100) NOT NULL,
	"url_archivo" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reportes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "reportes_org_isolation" ON "reportes" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));