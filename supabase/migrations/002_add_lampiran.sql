-- Add lampiran (attachment) column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS lampiran TEXT;

-- Create storage bucket for transaction attachments
-- Note: Run this in Supabase Dashboard > Storage to create the bucket
-- Then create the policy below
