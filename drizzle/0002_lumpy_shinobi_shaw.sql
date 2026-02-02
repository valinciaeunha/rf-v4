CREATE TYPE "public"."deposit_status" AS ENUM('pending', 'success', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'success', 'failed', 'expired', 'refund');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(50) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" bigint,
	"performed_by" bigint NOT NULL,
	"changes" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"amount" numeric(15, 2) NOT NULL,
	"total_bayar" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"total_diterima" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"payment_channel" varchar(50) NOT NULL,
	"ref_id" varchar(100),
	"trx_id" varchar(100) NOT NULL,
	"qr_link" varchar(500) DEFAULT '',
	"qr_string" text,
	"pay_url" varchar(500) DEFAULT '',
	"status" "deposit_status" DEFAULT 'pending' NOT NULL,
	"source" varchar(20) DEFAULT 'web',
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar(100),
	"snap_token" varchar(255),
	"public_id" varchar(64),
	"user_id" bigint,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"stock_id" integer,
	"assigned_stocks" text,
	"price" numeric(12, 2) NOT NULL,
	"total_amount" numeric(15, 2),
	"payment_method" varchar(32) NOT NULL,
	"payment_proof" varchar(255),
	"qr_string" text,
	"payment_url" varchar(500),
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"expired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_performed_by_idx" ON "audit_logs" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deposit_user_id_idx" ON "deposits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deposit_status_idx" ON "deposits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deposit_created_at_idx" ON "deposits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transaction_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transaction_order_id_idx" ON "transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "transaction_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transaction_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_sold_to_idx" ON "stocks" USING btree ("sold_to");