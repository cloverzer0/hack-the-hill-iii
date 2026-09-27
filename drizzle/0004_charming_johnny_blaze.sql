ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "sponsor_mp" jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "sponsor_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "url" text;--> statement-breakpoint
ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "stage_before_live" "campaign_stage";
