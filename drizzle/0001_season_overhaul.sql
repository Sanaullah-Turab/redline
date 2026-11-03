CREATE TABLE "round_drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"season" integer NOT NULL,
	"round" integer NOT NULL,
	"driverId" text NOT NULL,
	"code" text NOT NULL,
	"number" text NOT NULL,
	"givenName" text NOT NULL,
	"familyName" text NOT NULL,
	"nationality" text DEFAULT '' NOT NULL,
	"replaces" text,
	"status" text DEFAULT 'entered' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "round_drivers_season_round_driverId_unique" UNIQUE("season","round","driverId")
);
--> statement-breakpoint
CREATE TABLE "round_podiums" (
	"id" serial PRIMARY KEY NOT NULL,
	"season" integer NOT NULL,
	"round" integer NOT NULL,
	"userId" text NOT NULL,
	"points" integer NOT NULL,
	"position" integer NOT NULL,
	"computedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "round_podiums_season_round_userId_unique" UNIQUE("season","round","userId")
);
--> statement-breakpoint
CREATE TABLE "session_classifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"season" integer NOT NULL,
	"round" integer NOT NULL,
	"sessionType" text NOT NULL,
	"source" text NOT NULL,
	"positions" jsonb NOT NULL,
	"fetchedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_classifications_season_round_sessionType_source_unique" UNIQUE("season","round","sessionType","source")
);
--> statement-breakpoint
ALTER TABLE "round_podiums" ADD CONSTRAINT "round_podiums_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "round_podiums_season_round_idx" ON "round_podiums" USING btree ("season","round");--> statement-breakpoint
CREATE INDEX "predictions_season_round_idx" ON "predictions" USING btree ("season","round");
--> statement-breakpoint
ALTER TABLE "round_drivers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "round_podiums" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session_classifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "no_public_access" ON "round_drivers" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);--> statement-breakpoint
CREATE POLICY "no_public_access" ON "round_podiums" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);--> statement-breakpoint
CREATE POLICY "no_public_access" ON "session_classifications" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
