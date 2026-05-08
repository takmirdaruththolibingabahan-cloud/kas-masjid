# Cara Restart Development Server

## Masalah yang Diperbaiki

✅ Menambahkan IP `192.168.88.242` ke `allowedDevOrigins`
✅ Menambahkan flag `-H 0.0.0.0` agar server bisa diakses dari IP manapun di jaringan

## Langkah-langkah:

### 1. Stop Server yang Sedang Berjalan
Tekan `Ctrl + C` di terminal tempat server berjalan

### 2. Jalankan Ulang Server
```bash
npm run dev
```

### 3. Test Akses
Setelah server berjalan, coba akses:
- ✅ http://localhost:3002 (harus tetap bisa)
- ✅ http://192.168.88.242:3002 (sekarang harus bisa)

## Penjelasan Perubahan

### File: `next.config.ts`
```typescript
allowedDevOrigins: ["192.168.1.6", "192.168.88.242"]
```
Menambahkan IP 192.168.88.242 ke daftar origin yang diizinkan.

### File: `package.json`
```json
"dev": "next dev --webpack -p 3002 -H 0.0.0.0"
```
Flag `-H 0.0.0.0` membuat server listen di semua network interface, bukan hanya localhost.

## Troubleshooting

Jika masih tidak bisa:

1. **Cek Firewall Windows**
   - Buka Windows Defender Firewall
   - Pastikan port 3002 tidak diblokir

2. **Cek IP Address**
   ```bash
   ipconfig
   ```
   Pastikan IP 192.168.88.242 adalah IP yang benar

3. **Test dari Device Lain**
   Coba akses dari HP/laptop lain di jaringan yang sama

4. **Cek Console Browser**
   Tekan F12 dan lihat tab Console untuk error messages
