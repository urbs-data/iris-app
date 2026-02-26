ALTER TYPE "public"."tipo_reporte" ADD VALUE 'sampling_params_cig' BEFORE 'concentrations';--> statement-breakpoint
ALTER TABLE "reportes" ALTER COLUMN "url_archivo" SET DATA TYPE varchar(400);