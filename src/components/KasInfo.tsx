'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type TotalKeseluruhan = {
  totalMasuk: number;
  totalKeluar: number;
  saldo: number;
};

type KasInfoProps = {
  totalKeseluruhan: TotalKeseluruhan | null;
  isAdmin: boolean;
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function KasInfo({ totalKeseluruhan, isAdmin }: KasInfoProps) {
  const router = useRouter();
  const [rekeningBank, setRekeningBank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBankBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/bank-mutations', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Calculate total from all bank mutations
        const total = data.reduce((sum: number, mutation: any) => sum + mutation.jumlah, 0);
        setRekeningBank(total);
      }
    } catch (err) {
      console.error('Gagal memuat data bank');
      setRekeningBank(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankBalance();
  }, [fetchBankBalance]);

  // Kas Tunai = Saldo Tercatat - Rekening Bank
  const kasTunai = totalKeseluruhan && rekeningBank !== null 
    ? totalKeseluruhan.saldo - rekeningBank 
    : null;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="text-lg sm:text-xl font-bold text-green-700 mb-4">Ringkasan Keuangan Semua Tahun</h2>

      {/* Saldo Keseluruhan dari transaksi */}
      {totalKeseluruhan === null ? (
        <p className="text-gray-500 text-sm mb-4">Memuat data...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total Pemasukan</p>
            <p className="text-sm sm:text-base font-bold text-green-700">{formatRupiah(totalKeseluruhan.totalMasuk)}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total Pengeluaran</p>
            <p className="text-sm sm:text-base font-bold text-red-700">{formatRupiah(totalKeseluruhan.totalKeluar)}</p>
          </div>
          <div className={`${totalKeseluruhan.saldo >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-3`}>
            <p className="text-xs text-gray-500 mb-1">Saldo Tercatat</p>
            <p className={`text-sm sm:text-base font-bold ${totalKeseluruhan.saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatRupiah(totalKeseluruhan.saldo)}
            </p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 mb-4" />

      {/* Kas Aktual */}
      <p className="text-sm font-semibold text-gray-600 mb-3">Kas Aktual</p>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat data...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Rekening Bank - clickable */}
            <div 
              className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-green-500 hover:shadow-md transition-all"
              onClick={() => router.push('/bank-mutations')}
            >
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm font-medium">Rekening Bank</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-gray-800">
                {rekeningBank !== null ? formatRupiah(rekeningBank) : 'Memuat...'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Klik untuk lihat mutasi</p>
            </div>

            {/* Kas Tunai = Saldo Tercatat - Rekening Bank */}
            <div className="border border-gray-200 rounded-lg p-3 bg-yellow-50">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium">Kas Tunai</span>
              </div>
              <p className="text-xs text-gray-400 mb-1">Saldo Tercatat − Rekening Bank</p>
              {kasTunai === null ? (
                <p className="text-base font-bold text-gray-400">Memuat...</p>
              ) : (
                <p className={`text-base sm:text-lg font-bold ${kasTunai >= 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {formatRupiah(kasTunai)}
                </p>
              )}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
