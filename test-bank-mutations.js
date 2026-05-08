// Script untuk test koneksi ke bank_mutations table
// Jalankan dengan: node test-bank-mutations.js

const fs = require('fs');
const path = require('path');

// Baca .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n=== Test Bank Mutations Table ===\n');

// Test 1: Cek apakah tabel bank_mutations ada
console.log('1. Mengecek tabel bank_mutations...');

fetch(`${SUPABASE_URL}/rest/v1/bank_mutations?select=*&limit=10`, {
  headers: {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log('   Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('   ✓ Tabel ditemukan!');
    console.log('   Jumlah data:', Array.isArray(data) ? data.length : 0);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n2. Data bank_mutations:');
      data.forEach((row, i) => {
        console.log(`   ${i + 1}. ID: ${row.id}, Tanggal: ${row.tanggal}, Jumlah: ${row.jumlah}, Transaction ID: ${row.transaction_id || 'NULL'}`);
      });
    } else {
      console.log('\n   ⚠️  Tabel kosong - belum ada data');
    }

    // Test 2: Coba insert data test
    console.log('\n3. Test insert data...');
    return fetch(`${SUPABASE_URL}/rest/v1/bank_mutations`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        tanggal: new Date().toISOString().split('T')[0],
        uraian: 'Test insert dari script',
        jumlah: 50000,
        transaction_id: null
      })
    });
  })
  .then(response => {
    console.log('   Insert status:', response.status);
    return response.json();
  })
  .then(data => {
    if (data.id) {
      console.log('   ✓ Insert berhasil! ID:', data.id);
      
      // Hapus data test
      console.log('\n4. Menghapus data test...');
      return fetch(`${SUPABASE_URL}/rest/v1/bank_mutations?id=eq.${data.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      });
    } else {
      console.log('   ❌ Insert gagal:', data);
      throw new Error('Insert failed');
    }
  })
  .then(response => {
    console.log('   Delete status:', response.status);
    console.log('   ✓ Data test berhasil dihapus');
    console.log('\n✅ Semua test berhasil! Tabel bank_mutations berfungsi dengan baik.');
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
  });
