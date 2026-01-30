CREATE TYPE "public"."stock_status" AS ENUM('ready', 'sold', 'reserved');--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"code" varchar(255) NOT NULL,
	"status" "stock_status" DEFAULT 'ready' NOT NULL,
	"sold_to" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_sold_to_users_id_fk" FOREIGN KEY ("sold_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_product_id_idx" ON "stocks" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_status_idx" ON "stocks" USING btree ("status");