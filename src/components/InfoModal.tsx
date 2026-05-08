'use client';

import { Transaction } from '@/lib/supabase';

type InfoModalProps = {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function InfoModal({ transaction, isOpen, onClose, onEdit }: InfoModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
        <div className={`px-6 py-4 ${transaction.tipe === 'masuk' ? 'bg-green-600' : 'bg-red-600'} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {transaction.tipe === 'masuk' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">{transaction.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}</h3>
              <p className="text-sm text-white/80">{formatDate(transaction.tanggal)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Uraian</p>
            <p className="text-base font-medium mt-1">{transaction.uraian}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {transaction.tipe === 'masuk' ? 'Diterima Dari' : 'Diberikan Kepada'}
            </p>
            <p className="text-sm font-medium">{transaction.sumber_atau_penerima}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Jumlah</p>
            <p className={`text-2xl font-bold mt-1 ${transaction.tipe === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(transaction.jumlah)}
            </p>
          </div>

          {transaction.lampiran && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Lampiran</p>
              <img
                src={transaction.lampiran}
                alt="Lampiran"
                className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(transaction.lampiran!, '_blank')}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors"
            >
              Tutup
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
