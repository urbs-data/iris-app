CREATE TABLE "country" (
	"id" integer PRIMARY KEY NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_es" varchar(255) NOT NULL,
	"code" varchar(10),
	"zone" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "destination" (
	"id" integer PRIMARY KEY NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_es" varchar(255) NOT NULL,
	"country_id" integer
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"photo_url" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"price" real NOT NULL,
	"category" varchar(255) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "destination" ADD CONSTRAINT "destination_country_id_country_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."country"("id") ON DELETE no action ON UPDATE no action;