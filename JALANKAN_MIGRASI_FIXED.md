# ✅ Cara Menjalankan Migrasi Database (FIXED)

## ⚠️ Perbaikan Tipe Data

**PENTING:** Tabel `transactions` menggunakan `UUID` untuk kolom `id`, bukan `BIGINT`.
Jadi kolom `transaction_id` di `bank_mutations` juga harus `UUID`.

## 🚀 Langkah-langkah

### 1. Buka Supabase Dashboard

1. Buka https://supabase.com/dashboard
2. Login dengan akun Anda
3. Pilih project: `pazzqcpgrvcabduuexez`

### 2. Buka SQL Editor

1. Di sidebar kiri, klik **SQL Editor**
2. Klik **New Query**

### 3. Copy & Paste SQL ini, lalu klik RUN:

```sql
-- Add transaction_id column to bank_mutations table
-- PENTING: Gunakan UUID karena transactions.id adalah UUID
ALTER TABLE bank_mutations 
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bank_mutations_transaction_id ON bank_mutations(transaction_id);

-- Add comment
COMMENT ON COLUMN bank_mutations.transaction_id IS 'Foreign key to transactions table. NULL if bank mutation is created directly (not from transaction).';
```

### 4. Verifikasi dengan query ini:

```sql
-- Cek struktur tabel
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bank_mutations'
ORDER BY ordinal_position;
```

**Expected output:** Harus ada kolom `transaction_id` dengan tipe **`uuid`** (bukan bigint!)

### 5. Test Aplikasi

1. Buka `http://192.168.88.242:3002/transaksi`
2. Klik tombol **+** (tambah transaksi)
3. Isi form dan **centang checkbox "Masuk ke Rekening Bank"**
4. Klik **"Simpan"**
5. **Expected:** Dialog konfirmasi muncul
6. Klik **"OK"**
7. **Expected:** Redirect ke `/bank-mutations` dan data muncul! ✅

## 🐛 Troubleshooting

### Error: "column already exists"

Jika kolom sudah ada dengan tipe yang salah (BIGINT), hapus dulu:

```sql
-- Hapus kolom yang salah
ALTER TABLE bank_mutations DROP COLUMN IF EXISTS transaction_id;

-- Tambah ulang dengan tipe yang benar (UUID)
ALTER TABLE bank_mutations 
ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_bank_mutations_transaction_id ON bank_mutations(transaction_id);
```

### Error: "incompatible types"

Ini berarti Anda masih menggunakan BIGINT. Pastikan SQL menggunakan **UUID**, bukan BIGINT.

## ✅ Setelah Migrasi Berhasil

Fitur checkbox rekening bank akan berfungsi:

1. ✅ Transaksi tersimpan dengan UUID
2. ✅ Mutasi bank dibuat dengan `transaction_id` (UUID) yang benar
3. ✅ Dialog konfirmasi muncul
4. ✅ Redirect ke halaman bank mutations
5. ✅ Data muncul di tabel
6. ✅ Cascade delete: hapus transaksi → mutasi bank otomatis terhapus
