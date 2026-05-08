CREATE TABLE IF NOT EXISTS kas_info (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  jumlah BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default rows
INSERT INTO kas_info (id, label, jumlah) VALUES
  ('cash', 'Kas Tunai', 0),
  ('bank', 'Rekening Bank', 0)
ON CONFLICT (id) DO NOTHING;
