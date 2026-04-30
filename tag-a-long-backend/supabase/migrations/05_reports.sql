-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason            TEXT NOT NULL,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_reported_user_id_idx ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON reports(reporter_id);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = reporter_id::text);

CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT TO authenticated USING (auth.uid()::text = reporter_id::text);
