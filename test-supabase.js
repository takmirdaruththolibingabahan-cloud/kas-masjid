// Script untuk test koneksi Supabase
// Jalankan dengan: node test-supabase.js

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
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n=== Test Konfigurasi Supabase ===\n');

console.log('1. SUPABASE_URL:', SUPABASE_URL);
console.log('   ✓ Format:', SUPABASE_URL?.startsWith('https://') ? 'OK' : '❌ SALAH');

console.log('\n2. ANON_KEY:', ANON_KEY?.substring(0, 50) + '...');
console.log('   Length:', ANON_KEY?.length || 0);

// Cek format JWT
const isJWT = ANON_KEY?.split('.').length === 3;
console.log('   ✓ Format JWT:', isJWT ? 'OK' : '❌ SALAH - Bukan JWT!');

if (!isJWT) {
  console.log('\n❌ MASALAH DITEMUKAN!');
  console.log('   ANON_KEY bukan format JWT yang valid.');
  console.log('   Format yang benar: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.log('\n   Cara memperbaiki:');
  console.log('   1. Buka https://supabase.com/dashboard');
  console.log('   2. Pilih project Anda');
  console.log('   3. Settings → API');
  console.log('   4. Copy "anon public" key');
  console.log('   5. Paste ke .env.local sebagai NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Test koneksi
console.log('\n3. Test koneksi ke Supabase...');

fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`
  }
})
  .then(response => {
    console.log('   Status:', response.status);
    if (response.status === 200) {
      console.log('   ✓ Koneksi berhasil!');
    } else {
      console.log('   ❌ Koneksi gagal!');
      return response.text().then(text => {
        console.log('   Error:', text);
      });
    }
  })
  .catch(error => {
    console.log('   ❌ Error:', error.message);
  });
