'use client';

import { Transaction } from '@/lib/supabase';

type MonthlyTableProps = {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MonthlyTable({ transactions, onRowClick }: MonthlyTableProps) {
  let saldo = 0;

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const totalMasuk = safeTransactions
    .filter((t) => t.tipe === 'masuk')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalKeluar = safeTransactions
    .filter((t) => t.tipe === 'keluar')
    .reduce((sum, t) => sum + t.jumlah, 0);

  if (safeTransactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">No</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Uraian</th>
                <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold">Masuk (Rp)</th>
                <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold">Keluar (Rp)</th>
                <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold">Saldo (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                  Belum ada transaksi untuk bulan ini
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">No</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Uraian</th>
              <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">Masuk (Rp)</th>
              <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">Keluar (Rp)</th>
              <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">Saldo (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {safeTransactions.map((t, index) => {
              if (t.tipe === 'masuk') {
                saldo += t.jumlah;
              } else {
                saldo -= t.jumlah;
              }

              return (
                <tr
                  key={t.id}
                  onClick={() => onRowClick?.(t)}
                  className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${onRowClick ? 'cursor-pointer hover:bg-green-50' : ''} transition-colors`}
                >
                  <td className="px-4 py-3 text-xs sm:text-sm whitespace-nowrap">{index + 1}</td>
                  <td className="px-4 py-3 text-xs sm:text-sm whitespace-nowrap">{formatDate(t.tanggal)}</td>
                  <td className="px-4 py-3 text-xs sm:text-sm whitespace-nowrap">{t.uraian}</td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-right text-green-600 font-medium whitespace-nowrap">
                    {t.tipe === 'masuk' ? formatRupiah(t.jumlah) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-right text-red-600 font-medium whitespace-nowrap">
                    {t.tipe === 'keluar' ? formatRupiah(t.jumlah) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-right font-medium whitespace-nowrap">{formatRupiah(saldo)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-green-100 font-bold">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-xs sm:text-sm">
                Total
              </td>
              <td className="px-4 py-3 text-xs sm:text-sm text-right text-green-700 whitespace-nowrap">{formatRupiah(totalMasuk)}</td>
              <td className="px-4 py-3 text-xs sm:text-sm text-right text-red-700 whitespace-nowrap">{formatRupiah(totalKeluar)}</td>
              <td className="px-4 py-3 text-xs sm:text-sm text-right whitespace-nowrap">{formatRupiah(totalMasuk - totalKeluar)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
