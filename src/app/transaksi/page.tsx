'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Transaction } from '@/lib/supabase';
import TransactionModal from '@/components/TransactionModal';
import InfoModal from '@/components/InfoModal';
import EditModal from '@/components/EditModal';
import MonthlyTable from '@/components/MonthlyTable';
import MonthSelector from '@/components/MonthSelector';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import UserBadge from '@/components/UserBadge';
import ConfirmModal from '@/components/ConfirmModal';

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

function TransaksiContent() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState(
    parseInt(searchParams.get('year') || String(now.getFullYear()))
  );
  const [selectedMonth, setSelectedMonth] = useState(
    parseInt(searchParams.get('month') || String(now.getMonth() + 1))
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [infoTransaction, setInfoTransaction] = useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [showBankConfirmModal, setShowBankConfirmModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/transactions?year=${selectedYear}&month=${selectedMonth}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      alert('Gagal memuat data transaksi');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, refreshKey]);

  // Search transactions across all years
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Fetch all transactions without year/month filter
      const res = await fetch('/api/transactions', { cache: 'no-store' });
      const allData = await res.json();
      const allTransactions = Array.isArray(allData) ? allData : [];
      
      // Filter by search query (case insensitive)
      const filtered = allTransactions.filter((t: Transaction) =>
        t.uraian.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filtered);
    } catch (err) {
      console.error('Gagal mencari transaksi:', err);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleGoToMonth = (year: number, month: number) => {
    // Clear search dan navigasi ke bulan yang dipilih
    clearSearch();
    setSelectedYear(year);
    setSelectedMonth(month);
    
    // Set highlighted transaction ID
    if (infoTransaction) {
      setHighlightedId(infoTransaction.id);
      
      // Clear highlight setelah 3 detik
      setTimeout(() => {
        setHighlightedId(null);
      }, 3000);
    }
    
    // Update URL
    router.push(`/transaksi?year=${year}&month=${month}`);
  };

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleBankTransactionCreated = () => {
    // Tampilkan modal konfirmasi custom
    setShowBankConfirmModal(true);
  };

  const handleConfirmRedirect = () => {
    setShowBankConfirmModal(false);
    router.push('/bank-mutations');
  };

  const handleCancelRedirect = () => {
    setShowBankConfirmModal(false);
    // Refresh data transaksi
    setRefreshKey(prev => prev + 1);
  };

  const handleAddTransaction = async (body: FormData | any) => {
    const headers: Record<string, string> = {};
    if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const res = await fetch('/api/transactions', {
      method: 'POST', headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    if (res.ok) setRefreshKey(prev => prev + 1);
    else throw new Error('Gagal menyimpan transaksi');
  };

  const handleUpdateTransaction = async (body: FormData | any) => {
    const headers: Record<string, string> = {};
    if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const res = await fetch(`/api/transactions?id=${editTransaction?.id}`, {
      method: 'PUT', headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    if (res.ok) setRefreshKey(prev => prev + 1);
    else throw new Error('Gagal memperbarui transaksi');
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    if (res.ok) setRefreshKey(prev => prev + 1);
    else throw new Error('Gagal menghapus transaksi');
  };

  const handleEditFromInfo = (t: Transaction) => {
    setInfoTransaction(null);
    if (isAdmin) setEditTransaction(t);
  };

  const handleGeneratePreview = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      // Tampilkan dulu elemen export
      exportRef.current.style.display = 'block';
      await new Promise(r => setTimeout(r, 100)); // tunggu render

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 0,
      });

      exportRef.current.style.display = 'none';
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.95));
    } catch (err) {
      if (exportRef.current) exportRef.current.style.display = 'none';
      console.error(err);
      alert('Gagal membuat preview');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = `transaksi-${MONTHS[selectedMonth - 1]}-${selectedYear}.jpg`;
    link.href = previewUrl;
    link.click();
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const { exportToExcel } = await import('@/lib/exportExcel');
      await exportToExcel(transactions, selectedMonth, selectedYear);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  // Hitung total & saldo berjalan untuk tabel ekspor
  const totalMasuk = transactions.filter(t => t.tipe === 'masuk').reduce((s, t) => s + t.jumlah, 0);
  const totalKeluar = transactions.filter(t => t.tipe === 'keluar').reduce((s, t) => s + t.jumlah, 0);

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
                  <p className="text-green-100 mt-1 text-base">Manajemen Keuangan Masjid Daruth Tholibin</p>
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
                  <h1 className="text-sm font-bold leading-tight">Tabel Transaksi</h1>
                  <p className="text-green-200 text-xs leading-tight">Masjid Daruth Tholibin</p>
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
            <h2 className="text-lg sm:text-xl font-bold text-green-700">Tabel Transaksi</h2>
            <div className="flex items-center gap-2">
              <MonthSelector
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
              />
              <button
                onClick={handleGeneratePreview}
                disabled={exporting || loading}
                title="Bagikan sebagai gambar"
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 whitespace-nowrap"
              >
                {exporting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )}
                <span className="hidden sm:inline">{exporting ? 'Memproses...' : 'Bagikan'}</span>
              </button>

              {/* Tombol Export Excel */}
              <button
                onClick={handleExportExcel}
                disabled={exportingExcel || loading}
                title="Export ke Excel"
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 text-white text-xs sm:text-sm rounded-md hover:bg-emerald-800 transition-colors disabled:bg-gray-400 whitespace-nowrap"
              >
                {exportingExcel ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span className="hidden sm:inline">{exportingExcel ? 'Mengekspor...' : 'Excel'}</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Cari uraian transaksi di semua tahun..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {isSearching && searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                Ditemukan {searchResults.length} transaksi
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : (
            <MonthlyTable 
              transactions={isSearching ? searchResults : transactions} 
              onRowClick={(t) => setInfoTransaction(t)}
              highlightedId={highlightedId}
            />
          )}
        </div>
      </div>

      {/* Hidden export element — dirender dengan inline style agar html2canvas bisa capture */}
      <div
        ref={exportRef}
        style={{
          display: 'none',
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '800px',
          backgroundColor: '#ffffff',
          padding: '24px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          color: '#111',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #15803d' }}>
          <img src="/daruth-tholibin.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} crossOrigin="anonymous" />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#15803d' }}>Masjid Daruth Tholibin</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Laporan Transaksi — {MONTHS[selectedMonth - 1]} {selectedYear}</div>
          </div>
        </div>

        {/* Tabel */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#15803d', color: '#ffffff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>No</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Tanggal</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Uraian</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Masuk (Rp)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Keluar (Rp)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Saldo (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let saldo = 0;
              return transactions.map((t, i) => {
                saldo = t.tipe === 'masuk' ? saldo + t.jumlah : saldo - t.jumlah;
                return (
                  <tr key={t.id} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>{i + 1}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{formatDate(t.tanggal)}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>{t.uraian}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#16a34a' }}>
                      {t.tipe === 'masuk' ? formatRupiah(t.jumlah) : '-'}
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#dc2626' }}>
                      {t.tipe === 'keluar' ? formatRupiah(t.jumlah) : '-'}
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 500 }}>
                      {formatRupiah(saldo)}
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#dcfce7', fontWeight: 'bold' }}>
              <td colSpan={3} style={{ padding: '8px 10px' }}>Total</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#15803d' }}>{formatRupiah(totalMasuk)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#dc2626' }}>{formatRupiah(totalKeluar)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatRupiah(totalMasuk - totalKeluar)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div style={{ marginTop: '12px', fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>
          Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Modal Preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-800">Preview Gambar</h3>
              <button onClick={() => setPreviewUrl(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <img src={previewUrl} alt="Preview tabel transaksi" className="w-full rounded-md border border-gray-200" />
            </div>
            <div className="px-5 py-4 border-t flex gap-3">
              <button
                onClick={() => setPreviewUrl(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download JPG
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-8 right-4 sm:right-8 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center z-40"
          aria-label="Tambah transaksi"
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
          onSubmit={handleAddTransaction}
          onBankTransactionCreated={handleBankTransactionCreated}
          defaultMonth={selectedMonth}
          defaultYear={selectedYear}
        />
      )}

      <InfoModal
        transaction={infoTransaction}
        isOpen={!!infoTransaction}
        onClose={() => setInfoTransaction(null)}
        onEdit={isAdmin ? handleEditFromInfo : undefined}
        onGoToMonth={handleGoToMonth}
        isSearchMode={isSearching}
      />

      {isAdmin && (
        <EditModal
          transaction={editTransaction}
          isOpen={!!editTransaction}
          onClose={() => setEditTransaction(null)}
          onUpdate={handleUpdateTransaction}
          onDelete={handleDelete}
        />
      )}

      {/* Modal Konfirmasi Bank Transaction */}
      <ConfirmModal
        isOpen={showBankConfirmModal}
        title="Transaksi Berhasil Disimpan!"
        message="Transaksi berhasil disimpan dan ditambahkan ke Rekening Bank.&#10;&#10;Apakah Anda ingin melihat halaman Rekening Bank sekarang?"
        confirmText="Lihat Rekening Bank"
        cancelText="Tetap di Sini"
        onConfirm={handleConfirmRedirect}
        onCancel={handleCancelRedirect}
        icon="success"
      />
    </div>
  );
}

export default function TransaksiPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Memuat...</div>}>
        <TransaksiContent />
      </Suspense>
    </AuthGuard>
  );
}
