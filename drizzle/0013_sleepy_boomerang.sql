CREATE TABLE "reporte_configuraciones" (
	"id" varchar(100) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_reporte" varchar(100) NOT NULL,
	"tipo_reporte" "tipo_reporte" NOT NULL,
	"pozos" json
);
--> statement-breakpoint
ALTER TABLE "parametros_fisico_quimicos_new" DROP CONSTRAINT IF EXISTS "parametros_fisico_quimicos_new_id_muestra_muestras_id_muestra_fk";
--> statement-breakpoint
-- ALTER TABLE "parametros_fisico_quimicos_new" ADD COLUMN "muestra" varchar(100);--> statement-breakpoint
ALTER TABLE "reporte_configuraciones"
ADD CONSTRAINT "reporte_configuraciones_id_reporte_reportes_id_reporte_fk" FOREIGN KEY ("id_reporte") REFERENCES "public"."reportes"("id_reporte") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
-- ALTER TABLE "parametros_fisico_quimicos_new" DROP COLUMN "id_muestra";
--> statement-breakpoint
ALTER TABLE "reportes" DROP COLUMN "tipo_reporte";
--> statement-breakpoint
ALTER TABLE "reportes" DROP COLUMN "preset";
--> statement-breakpoint
DROP TYPE "public"."preset";