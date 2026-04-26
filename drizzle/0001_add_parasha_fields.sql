ALTER TABLE "stories" ADD COLUMN "parasha_ref" varchar(100);--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "parasha_idea" jsonb;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "sanity_report" jsonb;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "step_prompts" jsonb;