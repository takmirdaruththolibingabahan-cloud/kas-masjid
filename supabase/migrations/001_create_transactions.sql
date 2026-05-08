-- Create transactions table for Masjid Daruth Tholibin
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  uraian TEXT NOT NULL,
  tipe VARCHAR(10) NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
  jumlah BIGINT NOT NULL,
  sumber_atau_penerima TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster monthly queries
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON transactions(tanggal);
CREATE INDEX IF NOT EXISTS idx_transactions_tipe ON transactions(tipe);

-- Enable Row Level Security (optional - for public access we allow all)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (can be restricted later)
CREATE POLICY "Allow all operations" ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);
