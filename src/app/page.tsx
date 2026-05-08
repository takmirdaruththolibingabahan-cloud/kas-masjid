'use client';

import { useState, useEffect, useCallback } from 'react';
import YearSelector from '@/components/YearSelector';
import KasInfo from '@/components/KasInfo';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import UserBadge from '@/components/UserBadge';
import { useRouter } from 'next/navigation';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function HomeContent() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [monthlySummary, setMonthlySummary] = useState<
    { month: number; totalMasuk: number; totalKeluar: number; saldo: number }[]
  >([]);
  const [totalKeseluruhan, setTotalKeseluruhan] = useState<{
    totalMasuk: number;
    totalKeluar: number;
    saldo: number;
  } | null>(null);

  const fetchMonthlySummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions?year=${selectedYear}`, { cache: 'no-store' });
      const data: any[] = await res.json();

      const summary: Record<number, { totalMasuk: number; totalKeluar: number }> = {};
      for (let i = 1; i <= 12; i++) {
        summary[i] = { totalMasuk: 0, totalKeluar: 0 };
      }

      for (const t of data) {
        const month = new Date(t.tanggal).getMonth() + 1;
        if (t.tipe === 'masuk') {
          summary[month].totalMasuk += t.jumlah;
        } else {
          summary[month].totalKeluar += t.jumlah;
        }
      }

      const summaryArray = Object.entries(summary).map(([month, d]) => ({
        month: parseInt(month),
        totalMasuk: d.totalMasuk,
        totalKeluar: d.totalKeluar,
        saldo: d.totalMasuk - d.totalKeluar,
      }));

      setMonthlySummary(summaryArray);
    } catch (err) {
      console.error('Gagal memuat ringkasan bulanan');
    }
  }, [selectedYear]);

  const fetchTotalKeseluruhan = useCallback(async () => {
    try {
      const res = await fetch('/api/transactions/total', { cache: 'no-store' });
      const data = await res.json();
      setTotalKeseluruhan(data);
    } catch (err) {
      console.error('Gagal memuat total keseluruhan');
    }
  }, []);

  useEffect(() => {
    fetchMonthlySummary();
  }, [fetchMonthlySummary]);

  useEffect(() => {
    fetchTotalKeseluruhan();
  }, [fetchTotalKeseluruhan]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMonthlySummary();
        fetchTotalKeseluruhan();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchMonthlySummary, fetchTotalKeseluruhan]);

  const totalTahunMasuk = monthlySummary.reduce((sum, m) => sum + m.totalMasuk, 0);
  const totalTahunKeluar = monthlySummary.reduce((sum, m) => sum + m.totalKeluar, 0);

  return (
    <div className="min-h-screen bg-green-50 pb-16 sm:pb-0">
      <div className="sticky top-0 z-40">
        <header className="bg-green-600 text-white py-0.5 sm:py-1 shadow-lg">
          <div className="max-w-6xl mx-auto px-4">
            {/* Desktop */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 flex-shrink-0">
                  <img src="/daruth-tholibin.png" alt="Logo Masjid Daruth Tholibin" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Masjid Daruth Tholibin</h1>
                  <p className="text-green-100 mt-1 text-base">Manajemen Keuangan Masjid Daruth Tholibin</p>
                </div>
              </div>
              <UserBadge />
            </div>
            {/* Mobile */}
            <div className="sm:hidden flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-16 h-16 flex-shrink-0">
                  <img src="/daruth-tholibin.png" alt="Logo Masjid Daruth Tholibin" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold leading-tight">Masjid Daruth Tholibin</h1>
                  <p className="text-green-200 text-xs leading-tight">Manajemen Keuangan</p>
                </div>
              </div>
              <UserBadge mobileIconOnly />
            </div>
          </div>
        </header>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">

        <KasInfo totalKeseluruhan={totalKeseluruhan} isAdmin={isAdmin} />

        {/* Tabel Ringkasan Tahunan */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-green-700">Ringkasan Tahunan</h2>
            <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Bulan</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">Pemasukan</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">Pengeluaran</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummary.map((summary, index) => (
                  <tr
                    key={summary.month}
                    onClick={() => router.push(`/transaksi?year=${selectedYear}&month=${summary.month}`)}
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} cursor-pointer hover:bg-green-50 transition-colors`}
                  >
                    <td className="px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap">
                      <span className="text-green-700 hover:underline">{MONTHS[summary.month - 1]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-right text-green-600 whitespace-nowrap">
                      {formatRupiah(summary.totalMasuk)}
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-right text-red-600 whitespace-nowrap">
                      {formatRupiah(summary.totalKeluar)}
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-right font-medium whitespace-nowrap">
                      <span className={summary.saldo >= 0 ? 'text-gray-800' : 'text-red-600'}>
                        {formatRupiah(summary.saldo)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-green-100 font-bold">
                <tr>
                  <td className="px-4 py-3 text-xs sm:text-sm whitespace-nowrap">Total Tahun {selectedYear}</td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-right text-green-700 whitespace-nowrap">{formatRupiah(totalTahunMasuk)}</td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-right text-red-700 whitespace-nowrap">{formatRupiah(totalTahunKeluar)}</td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-right whitespace-nowrap">{formatRupiah(totalTahunMasuk - totalTahunKeluar)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}
