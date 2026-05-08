-- ============================================
-- MIGRASI: Tambah kolom transaction_id ke bank_mutations
-- File: 005_add_transaction_id_to_bank_mutations.sql
-- ============================================

-- Cek apakah kolom sudah ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bank_mutations' 
        AND column_name = 'transaction_id'
    ) THEN
        -- Add transaction_id column to bank_mutations table to link with transactions
        -- PENTING: Gunakan UUID karena transactions.id adalah UUID
        ALTER TABLE bank_mutations 
        ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Kolom transaction_id berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom transaction_id sudah ada';
    END IF;
END $$;

-- Add index for faster lookups (jika belum ada)
CREATE INDEX IF NOT EXISTS idx_bank_mutations_transaction_id ON bank_mutations(transaction_id);

-- Add comment
COMMENT ON COLUMN bank_mutations.transaction_id IS 'Foreign key to transactions table. NULL if bank mutation is created directly (not from transaction).';

-- Verifikasi hasil
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bank_mutations'
ORDER BY ordinal_position;

-- Tampilkan jumlah data
SELECT 
    COUNT(*) as total_mutations,
    COUNT(transaction_id) as mutations_with_transaction_id,
    COUNT(*) - COUNT(transaction_id) as mutations_without_transaction_id
FROM bank_mutations;
