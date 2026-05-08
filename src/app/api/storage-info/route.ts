import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseAdmin();

  try {
    // Hitung jumlah & ukuran file di storage bucket 'attachments'
    const { data: files, error: storageError } = await supabase.storage
      .from('attachments')
      .list('', { limit: 10000 });

    if (storageError) throw storageError;

    const fileCount = files?.length ?? 0;
    const totalStorageBytes = files?.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0) ?? 0;

    // Hitung jumlah row di tabel transactions
    const { count: transactionCount, error: dbError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (dbError) throw dbError;

    // Hitung jumlah row di tabel kas_info
    const { count: kasCount, error: kasError } = await supabase
      .from('kas_info')
      .select('*', { count: 'exact', head: true });

    if (kasError) throw kasError;

    return NextResponse.json({
      storage: {
        usedBytes: totalStorageBytes,
        fileCount,
        // Supabase free tier: 1 GB storage
        limitBytes: 1 * 1024 * 1024 * 1024,
      },
      database: {
        transactionCount: transactionCount ?? 0,
        kasCount: kasCount ?? 0,
        totalRows: (transactionCount ?? 0) + (kasCount ?? 0),
        // Supabase free tier: 500 MB database (50.000 rows estimasi)
        rowLimit: 50000,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
