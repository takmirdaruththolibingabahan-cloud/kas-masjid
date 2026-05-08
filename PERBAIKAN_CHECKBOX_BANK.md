# Perbaikan Checkbox Rekening Bank

## Masalah yang Diperbaiki

Ketika menambah transaksi di tabel bulanan dan mencentang checkbox "Masuk ke Rekening Bank" atau "Ambil dari Rekening Bank", transaksi memang tersimpan ke database `bank_mutations`, tetapi **tidak ada notifikasi atau redirect ke halaman rekening bank**.

## Solusi yang Diterapkan

### 1. Menambahkan Callback di TransactionModal

**File**: `src/components/TransactionModal.tsx`

- Menambahkan prop `onBankTransactionCreated?: () => void`
- Callback ini dipanggil setelah transaksi berhasil disimpan DAN checkbox bank dicentang
- Callback hanya dipanggil jika `useBank === true` dan `isBankMutationMode === false`

```typescript
// Trigger callback jika transaksi bank dibuat
if (useBank && !isBankMutationMode && onBankTransactionCreated) {
  onBankTransactionCreated();
}
```

### 2. Menambahkan Handler di Halaman Transaksi

**File**: `src/app/transaksi/page.tsx`

- Menambahkan fungsi `handleBankTransactionCreated()`
- Fungsi ini menampilkan dialog konfirmasi
- Jika user klik "OK", redirect ke `/bank-mutations`
- Jika user klik "Cancel", tetap di halaman transaksi

```typescript
const handleBankTransactionCreated = () => {
  const shouldRedirect = confirm(
    'Transaksi berhasil disimpan dan ditambahkan ke Rekening Bank!\n\n' +
    'Apakah Anda ingin melihat halaman Rekening Bank sekarang?'
  );
  if (shouldRedirect) {
    router.push('/bank-mutations');
  }
};
```

### 3. Menghubungkan Callback ke Modal

```typescript
<TransactionModal 
  isOpen={isAddModalOpen} 
  onClose={() => setIsAddModalOpen(false)} 
  onSubmit={handleAddTransaction}
  onBankTransactionCreated={handleBankTransactionCreated}
/>
```

## Alur Kerja Setelah Perbaikan

1. User membuka modal tambah transaksi
2. User mengisi form transaksi
3. User mencentang checkbox "Masuk ke Rekening Bank" atau "Ambil dari Rekening Bank"
4. User klik "Simpan"
5. Transaksi disimpan ke tabel `transactions`
6. Mutasi bank otomatis dibuat di tabel `bank_mutations`
7. **Dialog konfirmasi muncul**: "Transaksi berhasil disimpan dan ditambahkan ke Rekening Bank! Apakah Anda ingin melihat halaman Rekening Bank sekarang?"
8. Jika user klik **OK**: Redirect ke `/bank-mutations`
9. Jika user klik **Cancel**: Tetap di halaman transaksi

## Testing

### Test Case 1: Transaksi dengan Checkbox Bank Dicentang
1. Buka halaman `/transaksi`
2. Klik tombol tambah transaksi (+)
3. Isi form:
   - Tanggal: (pilih tanggal)
   - Jenis: Pemasukan
   - Uang Diterima Dari: "Test Donor"
   - Jumlah: 100000
   - Uraian: "Test transaksi bank"
   - ✅ **Centang** "Masuk ke Rekening Bank"
4. Klik "Simpan"
5. **Expected**: Dialog konfirmasi muncul
6. Klik "OK"
7. **Expected**: Redirect ke halaman `/bank-mutations`
8. **Expected**: Transaksi muncul di tabel mutasi bank

### Test Case 2: Transaksi tanpa Checkbox Bank
1. Buka halaman `/transaksi`
2. Klik tombol tambah transaksi (+)
3. Isi form (sama seperti di atas)
4. **Jangan centang** checkbox bank
5. Klik "Simpan"
6. **Expected**: Tidak ada dialog konfirmasi
7. **Expected**: Tetap di halaman transaksi
8. **Expected**: Transaksi TIDAK muncul di halaman bank mutations

### Test Case 3: Transaksi dari Halaman Bank Mutations
1. Buka halaman `/bank-mutations`
2. Klik tombol tambah (+)
3. Isi form transaksi
4. **Expected**: Checkbox bank TIDAK muncul (karena `isBankMutationMode=true`)
5. Klik "Simpan"
6. **Expected**: Tidak ada dialog konfirmasi
7. **Expected**: Tetap di halaman bank mutations

## Catatan Teknis

- Callback `onBankTransactionCreated` bersifat **optional** (menggunakan `?`)
- Jika tidak disediakan, modal tetap berfungsi normal tanpa redirect
- Dialog menggunakan `confirm()` native browser untuk UX yang sederhana
- Bisa diganti dengan modal custom jika diperlukan UI yang lebih baik

## File yang Dimodifikasi

1. ✅ `src/components/TransactionModal.tsx`
   - Tambah prop `onBankTransactionCreated`
   - Panggil callback setelah submit berhasil

2. ✅ `src/app/transaksi/page.tsx`
   - Tambah handler `handleBankTransactionCreated`
   - Pass handler ke TransactionModal

## Fitur Tambahan yang Bisa Ditambahkan (Opsional)

1. **Toast Notification**: Ganti `confirm()` dengan toast notification yang lebih modern
2. **Auto Redirect**: Langsung redirect tanpa konfirmasi (bisa jadi lebih smooth)
3. **Undo Action**: Tambahkan tombol "Undo" di notifikasi untuk membatalkan transaksi bank
4. **Highlight Row**: Highlight row yang baru ditambahkan di halaman bank mutations
