ALTER TABLE "reportes" ALTER COLUMN "tipo_reporte" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tipo_reporte";--> statement-breakpoint
CREATE TYPE "public"."tipo_reporte" AS ENUM('well_depth', 'sampling_params', 'concentrations');--> statement-breakpoint
ALTER TABLE "reportes" ALTER COLUMN "tipo_reporte" SET DATA TYPE "public"."tipo_reporte" USING "tipo_reporte"::"public"."tipo_reporte";