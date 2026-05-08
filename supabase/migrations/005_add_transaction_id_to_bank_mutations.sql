-- Add transaction_id column to bank_mutations table to link with transactions
ALTER TABLE bank_mutations 
ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX idx_bank_mutations_transaction_id ON bank_mutations(transaction_id);

-- Add comment
COMMENT ON COLUMN bank_mutations.transaction_id IS 'Foreign key to transactions table. NULL if bank mutation is created directly (not from transaction).';
