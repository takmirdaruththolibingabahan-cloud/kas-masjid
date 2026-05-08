'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import UserBadge from '@/components/UserBadge';
import TransactionModal from '@/components/TransactionModal';
import BankMutationInfoModal from '@/components/BankMutationInfoModal';
import EditModal from '@/components/EditModal';
import MonthSelector from '@/components/MonthSelector';
import { Transaction } from '@/lib/supabase';

type BankMutation = {
  id: number;
  tanggal: string;
  uraian: string;
  jumlah: number;
  created_at: string;
  transaction_id: string | null;
};

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function BankMutationsContent() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [mutations, setMutations] = useState<BankMutation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMutation, setSelectedMutation] = useState<BankMutation | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const fetchMutations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bank-mutations?year=${selectedYear}&month=${selectedMonth}`, { cache: 'no-store' });
      const data = await res.json();
      setMutations(Array.isArray(data) ? data : []);
    } catch (err) {
      alert('Gagal memuat data mutasi bank');
      setMutations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, refreshKey]);

  useEffect(() => {
    fetchMutations();
  }, [fetchMutations]);

  const handleAddMutation = async (body: FormData | any) => {
    // Convert transaction modal data to bank mutation format
    const data = body instanceof FormData ? {
      tanggal: body.get('tanggal'),
      uraian: body.get('uraian'),
      jumlah: body.get('tipe') === 'masuk' ? parseInt(body.get('jumlah') as string) : -parseInt(body.get('jumlah') as string),
    } : {
      tanggal: body.tanggal,
      uraian: body.uraian,
      jumlah: body.tipe === 'masuk' ? body.jumlah : -body.jumlah,
    };

    const res = await fetch('/api/bank-mutations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setRefreshKey(prev => prev + 1);
    } else {
      throw new Error('Gagal menyimpan mutasi bank');
    }
  };

  const handleRowClick = (mutation: BankMutation) => {
    setSelectedMutation(mutation);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
  };

  const handleUpdateTransaction = async (body: FormData | any) => {
    const headers: Record<string, string> = {};
    if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const res = await fetch(`/api/transactions?id=${editTransaction?.id}`, {
      method: 'PUT',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    if (res.ok) {
      setRefreshKey(prev => prev + 1);
      setEditTransaction(null);
    } else {
      throw new Error('Gagal memperbarui transaksi');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRefreshKey(prev => prev + 1);
      setEditTransaction(null);
    } else {
      throw new Error('Gagal menghapus transaksi');
    }
  };

  // Calculate running balance
  let runningBalance = 0;
  const mutationsWithBalance = mutations.map(m => {
    runningBalance += m.jumlah;
    return { ...m, balance: runningBalance };
  });

  const totalMasuk = mutations.filter(m => m.jumlah > 0).reduce((s, m) => s + m.jumlah, 0);
  const totalKeluar = mutations.filter(m => m.jumlah < 0).reduce((s, m) => s + Math.abs(m.jumlah), 0);

  return (
    <div className="min-h-screen bg-green-50">
      <div className="sticky top-0 z-40">
        <header className="bg-green-600 text-white py-0.5 sm:py-1 shadow-lg">
          <div className="max-w-6xl mx-auto px-4">
            <div className="hidden sm:flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 flex-shrink-0">
                  <img src="/daruth-tholibin.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Masjid Daruth Tholibin</h1>
                  <p className="text-green-100 mt-1 text-base">Mutasi Rekening Bank - {MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>
              </div>
              <UserBadge />
            </div>
            <div className="sm:hidden flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => router.push('/')} className="flex-shrink-0 text-white/80 hover:text-white p-1" aria-label="Kembali">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-16 h-16 flex-shrink-0">
                  <img src="/daruth-tholibin.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold leading-tight">Mutasi Bank</h1>
                  <p className="text-green-200 text-xs leading-tight">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>
              </div>
              <UserBadge mobileIconOnly />
            </div>
          </div>
        </header>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        <div className="hidden sm:flex items-center gap-2 mb-4">
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-green-700">Mutasi Rekening Bank</h2>
            <MonthSelector
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : mutations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Belum ada mutasi bank</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-green-700 text-white">
                      <th className="px-3 py-2 text-left font-semibold">No</th>
                      <th className="px-3 py-2 text-left font-semibold">Tanggal</th>
                      <th className="px-3 py-2 text-left font-semibold">Uraian</th>
                      <th className="px-3 py-2 text-right font-semibold">Masuk (Rp)</th>
                      <th className="px-3 py-2 text-right font-semibold">Keluar (Rp)</th>
                      <th className="px-3 py-2 text-right font-semibold">Saldo (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutationsWithBalance.map((m, i) => (
                      <tr 
                        key={m.id} 
                        onClick={() => handleRowClick(m)}
                        className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-green-50 transition-colors cursor-pointer`}
                      >
                        <td className="px-3 py-2 border-b border-gray-200">{i + 1}</td>
                        <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">{formatDate(m.tanggal)}</td>
                        <td className="px-3 py-2 border-b border-gray-200">{m.uraian || '-'}</td>
                        <td className="px-3 py-2 border-b border-gray-200 text-right text-green-600 font-medium">
                          {m.jumlah > 0 ? formatRupiah(m.jumlah) : '-'}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-200 text-right text-red-600 font-medium">
                          {m.jumlah < 0 ? formatRupiah(Math.abs(m.jumlah)) : '-'}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-200 text-right font-semibold">
                          {formatRupiah(m.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-100 font-bold">
                      <td colSpan={3} className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right text-green-700">{formatRupiah(totalMasuk)}</td>
                      <td className="px-3 py-2 text-right text-red-700">{formatRupiah(totalKeluar)}</td>
                      <td className="px-3 py-2 text-right">{formatRupiah(totalMasuk - totalKeluar)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-8 right-4 sm:right-8 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center z-40"
          aria-label="Tambah mutasi bank"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {isAdmin && (
        <TransactionModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSubmit={handleAddMutation}
          isBankMutationMode={true}
        />
      )}

      <BankMutationInfoModal
        mutation={selectedMutation}
        isOpen={!!selectedMutation}
        onClose={() => setSelectedMutation(null)}
        onEditTransaction={isAdmin ? handleEditTransaction : undefined}
      />

      {isAdmin && (
        <EditModal
          transaction={editTransaction}
          isOpen={!!editTransaction}
          onClose={() => setEditTransaction(null)}
          onUpdate={handleUpdateTransaction}
          onDelete={handleDeleteTransaction}
        />
      )}
    </div>
  );
}

export default function BankMutationsPage() {
  return (
    <AuthGuard>
      <BankMutationsContent />
    </AuthGuard>
  );
}
