CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('instant', 'manual');--> statement-breakpoint
CREATE TABLE "product_specifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"icon_type" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"buy_price" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"expired_days" integer DEFAULT 30 NOT NULL,
	"type" "product_type" DEFAULT 'manual' NOT NULL,
	"badge" varchar(50),
	"status" "product_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prod_spec_product_id_idx" ON "product_specifications" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_id_idx" ON "products" USING btree ("product_id");