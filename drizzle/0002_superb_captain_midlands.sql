CREATE TABLE "sustancias" (
	"id_sustancia" varchar(100) PRIMARY KEY NOT NULL,
	"nombre_ingles" varchar(255) NOT NULL,
	"nombre_espanol" varchar(255),
	"alias" varchar(255),
	"categoria" varchar(100),
	"nivel_guia" real,
	"unidad_guia" varchar(50),
	"nivel_guia_suelo" real,
	"unidad_guia_suelo" varchar(50)
);
--> statement-breakpoint
DROP TABLE "substances" CASCADE;