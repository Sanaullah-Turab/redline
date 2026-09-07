-- Enable Row Level Security on all tables
-- The app connects as the postgres/service_role which bypasses RLS,
-- so these policies only block direct REST API / anon access.

ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "predictions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_results" ENABLE ROW LEVEL SECURITY;

-- Deny all access via the public REST API (anon / authenticated roles).
-- The server-side Drizzle connection uses the postgres superuser which
-- bypasses RLS, so the app continues to work normally.

CREATE POLICY "no_public_access" ON "user" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "no_public_access" ON "session" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "no_public_access" ON "account" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "no_public_access" ON "verification" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "no_public_access" ON "predictions" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "no_public_access" ON "event_results" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
