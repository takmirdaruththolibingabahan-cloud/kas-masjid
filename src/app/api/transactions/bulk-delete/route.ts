import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const STORAGE_BUCKET = 'attachments';

function extractStoragePath(url: string): string | null {
  try {
    const marker = `/object/public/${STORAGE_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  } catch {
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!year || !month) {
    return NextResponse.json({ error: 'year dan month wajib diisi' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

  // Ambil semua transaksi bulan tersebut beserta lampirannya
  const { data: transactions, error: fetchError } = await supabase
    .from('transactions')
    .select('id, lampiran')
    .gte('tanggal', startDate)
    .lte('tanggal', endDate);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({ deleted: 0, filesDeleted: 0 });
  }

  // Hapus semua file lampiran dari storage
  const storagePaths = transactions
    .filter(t => t.lampiran)
    .map(t => extractStoragePath(t.lampiran!))
    .filter((p): p is string => p !== null);

  let filesDeleted = 0;
  if (storagePaths.length > 0) {
    // Hapus dalam batch maksimal 100 file sekaligus
    for (let i = 0; i < storagePaths.length; i += 100) {
      const batch = storagePaths.slice(i, i + 100);
      await supabase.storage.from(STORAGE_BUCKET).remove(batch);
      filesDeleted += batch.length;
    }
  }

  // Hapus semua transaksi bulan tersebut
  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .gte('tanggal', startDate)
    .lte('tanggal', endDate);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    deleted: transactions.length,
    filesDeleted,
  });
}
