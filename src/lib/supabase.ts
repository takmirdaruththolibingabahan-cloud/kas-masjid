import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Supabase URL or Anon Key is missing');
    }
    
    console.log('Initializing Supabase client with URL:', supabaseUrl);
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

export type Transaction = {
  id: string;
  tanggal: string;
  uraian: string;
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  sumber_atau_penerima: string;
  lampiran: string | null;
  created_at: string;
};

export type TransactionInput = {
  tanggal: string;
  uraian: string;
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  sumber_atau_penerima: string;
  lampiran?: string | null;
};
