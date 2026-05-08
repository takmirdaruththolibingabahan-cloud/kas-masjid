# Masjid Daruth Tholibin - Sistem Keuangan

Aplikasi web untuk pencatatan keuangan Masjid Daruth Tholibin.

## Fitur

- Input transaksi pemasukan dan pengeluaran
- Filter transaksi per bulan
- Laporan ringkasan bulanan dan tahunan
- Tampilan tabel dengan kolom: Tanggal, Uraian, Keterangan (sumber/penerima), Masuk, Keluar, Saldo

## Setup

### 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka SQL Editor di dashboard Supabase
3. Jalankan SQL migration dari file `supabase/migrations/001_create_transactions.sql`
4. Copy URL dan API key dari Settings > API

### 2. Konfigurasi Environment

Buat file `.env.local` (sudah ada template):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Ganti dengan URL dan API key dari Supabase project Anda.

### 3. Install Dependencies

```bash
npm install
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Halaman

- **/** - Halaman utama untuk input transaksi dan lihat tabel per bulan
- **/laporan** - Halaman laporan dengan ringkasan tahunan dan detail bulanan

## Struktur Database

Tabel `transactions`:
- `id` - UUID primary key
- `tanggal` - Tanggal transaksi
- `uraian` - Deskripsi transaksi
- `tipe` - 'masuk' atau 'keluar'
- `jumlah` - Jumlah uang
- `sumber_atau_penerima` - Nama pemberi/penerima uang
- `created_at` - Timestamp pembuatan
