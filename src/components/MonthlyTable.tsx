'use client';

import { Transaction } from '@/lib/supabase';
import { useState, useMemo, useEffect, useRef } from 'react';

type MonthlyTableProps = {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
  highlightedId?: string | null; // ID transaksi yang perlu di-highlight
};

type SortField = 'tanggal' | 'uraian' | 'masuk' | 'keluar' | null;
type SortDirection = 'asc' | 'desc';

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

export default function MonthlyTable({ transactions, onRowClick, highlightedId }: MonthlyTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Scroll to highlighted row
  useEffect(() => {
    if (highlightedId && highlightedRowRef.current) {
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [highlightedId]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction jika field sama
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set field baru dengan direction asc
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    if (!sortField) return safeTransactions;

    return [...safeTransactions].sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'tanggal':
          compareResult = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
          break;
        case 'uraian':
          compareResult = a.uraian.localeCompare(b.uraian);
          break;
        case 'masuk':
          // Prioritaskan transaksi masuk, lalu sort berdasarkan jumlah
          if (a.tipe === 'masuk' && b.tipe === 'keluar') return -1;
          if (a.tipe === 'keluar' && b.tipe === 'masuk') return 1;
          // Jika sama-sama masuk atau sama-sama keluar, sort berdasarkan jumlah
          compareResult = a.jumlah - b.jumlah;
          break;
        case 'keluar':
          // Prioritaskan transaksi keluar, lalu sort berdasarkan jumlah
          if (a.tipe === 'keluar' && b.tipe === 'masuk') return -1;
          if (a.tipe === 'masuk' && b.tipe === 'keluar') return 1;
          // Jika sama-sama masuk atau sama-sama keluar, sort berdasarkan jumlah
          compareResult = a.jumlah - b.jumlah;
          break;
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [safeTransactions, sortField, sortDirection]);

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 inline-block ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

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

  let saldo = 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">No</th>
              <th 
                className="px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-green-600 transition-colors select-none"
                onClick={() => handleSort('tanggal')}
              >
                Tanggal
                <SortIcon field="tanggal" />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-green-600 transition-colors select-none"
                onClick={() => handleSort('uraian')}
              >
                Uraian
                <SortIcon field="uraian" />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-green-600 transition-colors select-none"
                onClick={() => handleSort('masuk')}
              >
                Masuk (Rp)
                <SortIcon field="masuk" />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-green-600 transition-colors select-none"
                onClick={() => handleSort('keluar')}
              >
                Keluar (Rp)
                <SortIcon field="keluar" />
              </th>
              <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">Saldo (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((t, index) => {
              if (t.tipe === 'masuk') {
                saldo += t.jumlah;
              } else {
                saldo -= t.jumlah;
              }

              const isHighlighted = highlightedId === t.id;

              return (
                <tr
                  key={t.id}
                  ref={isHighlighted ? highlightedRowRef : null}
                  onClick={() => onRowClick?.(t)}
                  className={`
                    ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} 
                    ${onRowClick ? 'cursor-pointer hover:bg-green-50' : ''} 
                    ${isHighlighted ? 'animate-highlight' : ''}
                    transition-colors
                  `}
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
