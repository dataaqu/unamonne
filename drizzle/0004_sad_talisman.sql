CREATE TABLE "abandoned_cart_email" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"offer_code" text
);
--> statement-breakpoint
ALTER TABLE "abandoned_cart_email" ADD CONSTRAINT "abandoned_cart_email_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "abandoned_cart_email_cart_idx" ON "abandoned_cart_email" USING btree ("cart_id");