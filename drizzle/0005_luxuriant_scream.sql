CREATE TYPE "public"."blog_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "blog_post_translation" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"og_image" text,
	"focus_keyword" text,
	"seo_score" integer
);
--> statement-breakpoint
CREATE TABLE "blog_post" (
	"id" text PRIMARY KEY NOT NULL,
	"cover_url" text,
	"status" "blog_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"author_id" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_post_translation" ADD CONSTRAINT "blog_post_translation_post_id_blog_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blog_post_translation_post_locale_uq" ON "blog_post_translation" USING btree ("post_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_post_translation_locale_slug_uq" ON "blog_post_translation" USING btree ("locale","slug");