CREATE TYPE "public"."source_type" AS ENUM('tanakh', 'gmara', 'zohar', 'midrash', 'other');--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(32) NOT NULL,
	"title" varchar(500),
	"source_type" "source_type" DEFAULT 'other' NOT NULL,
	"original_text" text NOT NULL,
	"children_story" text,
	"tts_script" text,
	"audio_data" "bytea",
	"audio_mime_type" varchar(50),
	"model" varchar(100) NOT NULL,
	"thinking_level" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stories_slug_unique" UNIQUE("slug")
);
