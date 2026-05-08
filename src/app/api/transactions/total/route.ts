import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('transactions')
    .select('tipe, jumlah');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let totalMasuk = 0;
  let totalKeluar = 0;

  for (const t of data ?? []) {
    if (t.tipe === 'masuk') {
      totalMasuk += t.jumlah;
    } else {
      totalKeluar += t.jumlah;
    }
  }

  return NextResponse.json(
    { totalMasuk, totalKeluar, saldo: totalMasuk - totalKeluar },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
