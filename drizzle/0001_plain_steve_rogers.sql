CREATE TABLE "pozos" (
	"id_pozo" varchar(100) PRIMARY KEY NOT NULL,
	"tipo" varchar(100),
	"elevacion_terreno" real,
	"coordenada_norte" real,
	"coordenada_este" real,
	"latitud_decimal" real,
	"longitud_decimal" real,
	"fecha_relevamiento" timestamp,
	"responsable_relevamiento" varchar(100),
	"empresa_relevamiento" varchar(100),
	"comentarios" varchar(100),
	"descripcion" varchar(100),
	"area" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "substances" (
	"id_sustancia" varchar(100) PRIMARY KEY NOT NULL,
	"nombre_ingles" varchar(255) NOT NULL,
	"nombre_espanol" varchar(255),
	"categoria" varchar(100),
	"nivel_guia" real,
	"unidad_guia" varchar(50),
	"nivel_guia_suelo" real,
	"unidad_guia_suelo" varchar(50)
);
