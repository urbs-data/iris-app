ALTER TABLE "concentraciones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "documentos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "estudios_pozos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "estudios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "muestras" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "parametros_fisico_quimicos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pozos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sustancias" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Agregar columnas con valores default para datos existentes
ALTER TABLE "concentraciones" ADD COLUMN "organization_id" varchar(100) NOT NULL DEFAULT 'org_default';--> statement-breakpoint
ALTER TABLE "documentos" ADD COLUMN "organization_id" varchar(100) NOT NULL DEFAULT 'org_default';--> statement-breakpoint
ALTER TABLE "estudios_pozos" ADD COLUMN "organization_id" varchar(100) NOT NULL DEFAULT 'org_default';--> statement-breakpoint
ALTER TABLE "estudios" ADD COLUMN "organization_id" varchar(100) NOT NULL DEFAULT 'org_default';--> statement-breakpoint
ALTER TABLE "muestras" ADD COLUMN "organization_id" varchar(100) NOT NULL DEFAULT 'org_default';--> statement-breakpoint
ALTER TABLE "parametros_fisico_quimicos" ADD COLUMN "organization_id" varchar(100) NOT NULL DEFAULT 'org_default';--> statement-breakpoint
ALTER TABLE "pozos" ADD COLUMN "organization_id" varchar(100) NOT NULL DEFAULT 'org_default';--> statement-breakpoint
-- Remover defaults después de asignar valores
ALTER TABLE "concentraciones" ALTER COLUMN "organization_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "documentos" ALTER COLUMN "organization_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "estudios_pozos" ALTER COLUMN "organization_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "estudios" ALTER COLUMN "organization_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "muestras" ALTER COLUMN "organization_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "parametros_fisico_quimicos" ALTER COLUMN "organization_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pozos" ALTER COLUMN "organization_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sustancias" ALTER COLUMN "organization_id" DROP DEFAULT;--> statement-breakpoint
-- Crear índices para performance
CREATE INDEX IF NOT EXISTS "idx_concentraciones_org" ON "concentraciones" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documentos_org" ON "documentos" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_estudios_pozos_org" ON "estudios_pozos" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_estudios_org" ON "estudios" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_muestras_org" ON "muestras" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parametros_org" ON "parametros_fisico_quimicos" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pozos_org" ON "pozos" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sustancias_org" ON "sustancias" ("organization_id");--> statement-breakpoint
-- Crear políticas RLS
CREATE POLICY "concentraciones_org_isolation" ON "concentraciones" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));--> statement-breakpoint
CREATE POLICY "documentos_org_isolation" ON "documentos" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));--> statement-breakpoint
CREATE POLICY "estudios_pozos_org_isolation" ON "estudios_pozos" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));--> statement-breakpoint
CREATE POLICY "estudios_org_isolation" ON "estudios" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));--> statement-breakpoint
CREATE POLICY "muestras_org_isolation" ON "muestras" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));--> statement-breakpoint
CREATE POLICY "parametros_fisico_quimicos_org_isolation" ON "parametros_fisico_quimicos" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));--> statement-breakpoint
CREATE POLICY "pozos_org_isolation" ON "pozos" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));--> statement-breakpoint
CREATE POLICY "sustancias_org_isolation" ON "sustancias" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_org', true)) WITH CHECK (organization_id = current_setting('app.current_org', true));