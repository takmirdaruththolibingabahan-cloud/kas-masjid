import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const transaction_id = searchParams.get('transaction_id');

  const supabase = getSupabaseAdmin();

  // If querying by transaction_id
  if (transaction_id) {
    const { data, error } = await supabase
      .from('bank_mutations')
      .select('*')
      .eq('transaction_id', transaction_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  }

  let query = supabase
    .from('bank_mutations')
    .select('*')
    .order('tanggal', { ascending: true })
    .order('created_at', { ascending: true });

  if (year && month) {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
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
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tanggal, uraian, jumlah } = body;

  if (!tanggal || jumlah === undefined) {
    return NextResponse.json({ error: 'tanggal dan jumlah wajib diisi' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('bank_mutations')
    .insert({ tanggal, uraian: uraian || '', jumlah })
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
  const transaction_id = searchParams.get('transaction_id');

  if (!id && !transaction_id) {
    return NextResponse.json({ error: 'ID or transaction_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  let query = supabase.from('bank_mutations').delete();

  if (id) {
    query = query.eq('id', id);
  } else if (transaction_id) {
    query = query.eq('transaction_id', transaction_id);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transaction_id = searchParams.get('transaction_id');

  if (!transaction_id) {
    return NextResponse.json({ error: 'transaction_id required' }, { status: 400 });
  }

  const body = await request.json();
  const { tanggal, uraian, jumlah } = body;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('bank_mutations')
    .update({ tanggal, uraian, jumlah })
    .eq('transaction_id', transaction_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
