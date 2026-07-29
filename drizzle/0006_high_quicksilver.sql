CREATE TABLE "product_review" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"variant_label" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_spec" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"label" text NOT NULL,
	"sku" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"is_made_to_order" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_post_tag" (
	"post_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "blog_post_tag_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "blog_tag_translation" (
	"id" text PRIMARY KEY NOT NULL,
	"tag_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "back_in_stock_request" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"email" text NOT NULL,
	"locale" "locale" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notified_at" timestamp,
	CONSTRAINT "back_in_stock_product_variant_email_uq" UNIQUE NULLS NOT DISTINCT("product_id","variant_id","email")
);
--> statement-breakpoint
CREATE TABLE "discount_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"percent_off" integer,
	"amount_off_gel" integer,
	"amount_off_usd" integer,
	"min_subtotal_gel" integer,
	"min_subtotal_usd" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"max_redemptions" integer,
	"redemptions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discount_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"locale" "locale" NOT NULL,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscriber_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wishlist_item" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text,
	"product_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "cart_item_cart_product_uq";--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "edition_size" integer;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "engraving" text;--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "is_gift" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "discount_code" text;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "variant_label" text;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "engraving" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "discount_code" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "discount_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "is_gift" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_post" ADD COLUMN "product_id" text;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tag" ADD CONSTRAINT "blog_post_tag_post_id_blog_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tag" ADD CONSTRAINT "blog_post_tag_tag_id_blog_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_tag_translation" ADD CONSTRAINT "blog_tag_translation_tag_id_blog_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "back_in_stock_request" ADD CONSTRAINT "back_in_stock_request_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "back_in_stock_request" ADD CONSTRAINT "back_in_stock_request_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_review_product_user_uq" ON "product_review" USING btree ("product_id","user_id");--> statement-breakpoint
CREATE INDEX "product_review_product_idx" ON "product_review" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_spec_product_locale_idx" ON "product_spec" USING btree ("product_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_product_label_uq" ON "product_variant" USING btree ("product_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_tag_translation_tag_locale_uq" ON "blog_tag_translation" USING btree ("tag_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_tag_translation_locale_slug_uq" ON "blog_tag_translation" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "back_in_stock_pending_idx" ON "back_in_stock_request" USING btree ("product_id","notified_at");--> statement-breakpoint
CREATE INDEX "discount_code_active_idx" ON "discount_code" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "newsletter_subscriber_active_idx" ON "newsletter_subscriber" USING btree ("unsubscribed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_item_token_product_uq" ON "wishlist_item" USING btree ("token","product_id");--> statement-breakpoint
CREATE INDEX "wishlist_item_user_idx" ON "wishlist_item" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_product_uq" UNIQUE NULLS NOT DISTINCT("cart_id","product_id","variant_id","engraving");