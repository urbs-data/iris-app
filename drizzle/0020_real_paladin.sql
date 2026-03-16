CREATE TABLE "campanas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"fecha_inicio" timestamp NOT NULL,
	"fecha_fin" timestamp NOT NULL,
	"orden" integer NOT NULL,
	"es_linea_base" boolean DEFAULT false NOT NULL
);
