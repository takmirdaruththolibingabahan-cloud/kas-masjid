import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sumber = searchParams.get('sumber');

  const supabase = getSupabaseAdmin();

  let query = supabase.from('transactions').select('tipe, jumlah');

  if (sumber) {
    query = query.eq('sumber', sumber);
  }

  const { data, error } = await query;

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
