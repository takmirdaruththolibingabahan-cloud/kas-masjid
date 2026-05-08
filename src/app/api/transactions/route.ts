import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, TransactionInput } from '@/lib/supabase';

const STORAGE_BUCKET = 'attachments';

// Helper: ekstrak path file dari URL storage Supabase
function extractStoragePath(url: string): string | null {
  try {
    const marker = `/object/public/${STORAGE_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    // Decode URI component untuk handle nama file dengan karakter spesial
    return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  } catch {
    return null;
  }
}

async function deleteStorageFile(supabase: ReturnType<typeof getSupabaseAdmin>, url: string) {
  const path = extractStoragePath(url);
  if (path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const id = searchParams.get('id');

  const supabase = getSupabaseAdmin();

  // If querying by ID
  if (id) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  let query = supabase
    .from('transactions')
    .select('*')
    .order('tanggal', { ascending: true });

  if (year && month) {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    // Hitung hari terakhir bulan dengan benar
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;
    query = query.gte('tanggal', startDate).lte('tanggal', endDate);
  } else if (year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    query = query.gte('tanggal', startDate).lte('tanggal', endDate);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('lampiran') as File | null;
    const tanggal = formData.get('tanggal') as string;
    const uraian = formData.get('uraian') as string;
    const tipe = formData.get('tipe') as 'masuk' | 'keluar';
    const jumlah = parseInt(formData.get('jumlah') as string);
    const sumber_atau_penerima = formData.get('sumber_atau_penerima') as string;
    const useBank = formData.get('useBank') === 'true';

    console.log('POST FormData - useBank:', useBank);
    console.log('POST FormData - tipe:', tipe, 'jumlah:', jumlah);

    const supabase = getSupabaseAdmin();
    let lampiranUrl: string | null = null;

    if (file && file.size > 0) {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      lampiranUrl = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({ tanggal, uraian, tipe, jumlah, sumber_atau_penerima, lampiran: lampiranUrl })
      .select()
      .single();

    if (error) {
      console.error('Transaction insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Transaction created with ID:', data.id);

    // Create bank mutation if useBank is true
    if (useBank && data) {
      console.log('Creating bank mutation for transaction:', data.id);
      const bankAmount = tipe === 'masuk' ? jumlah : -jumlah;
      console.log('Bank amount:', bankAmount);
      
      const bankMutationData = {
        tanggal,
        uraian: `${tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}: ${uraian}`,
        jumlah: bankAmount,
        transaction_id: data.id,
      };
      
      console.log('Bank mutation data:', JSON.stringify(bankMutationData));
      
      const { data: bankData, error: bankError } = await supabase
        .from('bank_mutations')
        .insert(bankMutationData)
        .select()
        .single();

      if (bankError) {
        console.error('Failed to create bank mutation:', bankError);
        console.error('Bank error details:', JSON.stringify(bankError));
      } else {
        console.log('Bank mutation created successfully:', bankData);
      }
    } else {
      console.log('Skipping bank mutation - useBank:', useBank, 'data:', !!data);
    }

    return NextResponse.json(data);
  }

  const body: any = await request.json();
  const useBank = body.useBank;
  delete body.useBank; // Remove useBank from transaction data

  console.log('POST JSON body - useBank:', useBank);
  console.log('POST JSON body:', JSON.stringify(body));
  
  const supabase = getSupabaseAdmin();

  try {
    console.log('Attempting Supabase insert...');
    const { data, error } = await supabase
      .from('transactions')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Transaction created with ID:', data.id);

    // Create bank mutation if useBank is true
    if (useBank && data) {
      console.log('Creating bank mutation for transaction:', data.id);
      const bankAmount = body.tipe === 'masuk' ? body.jumlah : -body.jumlah;
      console.log('Bank amount:', bankAmount);
      
      const bankMutationData = {
        tanggal: body.tanggal,
        uraian: `${body.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}: ${body.uraian}`,
        jumlah: bankAmount,
        transaction_id: data.id,
      };
      
      console.log('Bank mutation data:', JSON.stringify(bankMutationData));
      
      const { data: bankData, error: bankError } = await supabase
        .from('bank_mutations')
        .insert(bankMutationData)
        .select()
        .single();

      if (bankError) {
        console.error('Failed to create bank mutation:', bankError);
        console.error('Bank error details:', JSON.stringify(bankError));
      } else {
        console.log('Bank mutation created successfully:', bankData);
      }
    } else {
      console.log('Skipping bank mutation - useBank:', useBank, 'data:', !!data);
    }

    console.log('Insert successful:', data);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error in POST:', err);
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('lampiran') as File | null;
    const tanggal = formData.get('tanggal') as string;
    const uraian = formData.get('uraian') as string;
    const tipe = formData.get('tipe') as 'masuk' | 'keluar';
    const jumlah = parseInt(formData.get('jumlah') as string);
    const sumber_atau_penerima = formData.get('sumber_atau_penerima') as string;
    const keepLampiran = formData.get('keep_lampiran') as string;
    const removeLampiran = formData.get('remove_lampiran') as string;

    const supabase = getSupabaseAdmin();
    let lampiranUrl: string | null = undefined as any;

    // Ambil lampiran lama untuk dihapus jika perlu
    const { data: existing } = await supabase
      .from('transactions')
      .select('lampiran')
      .eq('id', id)
      .single();

    if (removeLampiran === 'true') {
      // Hapus file lama dari storage
      if (existing?.lampiran) await deleteStorageFile(supabase, existing.lampiran);
      lampiranUrl = null;
    } else if (file && file.size > 0) {
      // Hapus file lama dari storage sebelum upload baru
      if (existing?.lampiran) await deleteStorageFile(supabase, existing.lampiran);

      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      lampiranUrl = urlData.publicUrl;
    } else if (keepLampiran === 'true') {
      lampiranUrl = undefined as any;
    }

    const updateData: Record<string, any> = { tanggal, uraian, tipe, jumlah, sumber_atau_penerima };
    if (lampiranUrl !== undefined) {
      updateData.lampiran = lampiranUrl;
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  const supabase = getSupabaseAdmin();
  const body = await request.json();

  const { data, error } = await supabase
    .from('transactions')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('transactions')
    .select('lampiran')
    .eq('id', id)
    .single();

  if (existing?.lampiran) {
    await deleteStorageFile(supabase, existing.lampiran);
  }

  // Delete associated bank mutation (if exists)
  // Note: This will also be handled by CASCADE, but we do it explicitly for clarity
  await supabase
    .from('bank_mutations')
    .delete()
    .eq('transaction_id', id);

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
