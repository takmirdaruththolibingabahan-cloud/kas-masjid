'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/lib/supabase';

type BankMutation = {
  id: number;
  tanggal: string;
  uraian: string;
  jumlah: number;
  created_at: string;
  transaction_id: string | null;
};

type BankMutationInfoModalProps = {
  mutation: BankMutation | null;
  isOpen: boolean;
  onClose: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
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
    month: 'long',
    year: 'numeric',
  });
}

export default function BankMutationInfoModal({
  mutation,
  isOpen,
  onClose,
  onEditTransaction,
}: BankMutationInfoModalProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loadingTransaction, setLoadingTransaction] = useState(false);

  // Debug props
  useEffect(() => {
    if (isOpen) {
      console.log('BankMutationInfoModal opened with:', {
        mutation,
        hasOnEditTransaction: !!onEditTransaction,
        transaction_id: mutation?.transaction_id,
      });
    }
  }, [isOpen, mutation, onEditTransaction]);

  useEffect(() => {
    if (isOpen && mutation?.transaction_id) {
      console.log('Fetching transaction for ID:', mutation.transaction_id);
      // Fetch transaction data
      setLoadingTransaction(true);
      fetch(`/api/transactions?id=${mutation.transaction_id}`)
        .then(res => res.json())
        .then(data => {
          console.log('Transaction data received:', data);
          if (Array.isArray(data) && data.length > 0) {
            setTransaction(data[0]);
          } else if (data.id) {
            setTransaction(data);
          } else {
            console.error('Transaction not found or invalid format:', data);
          }
        })
        .catch(err => {
          console.error('Failed to fetch transaction:', err);
        })
        .finally(() => {
          setLoadingTransaction(false);
        });
    } else {
      console.log('No transaction_id or modal closed:', { isOpen, transaction_id: mutation?.transaction_id });
      setTransaction(null);
    }
  }, [isOpen, mutation]);

  if (!isOpen || !mutation) return null;

  const handleEditClick = () => {
    if (transaction && onEditTransaction) {
      onEditTransaction(transaction);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg sm:text-xl font-bold text-green-700">Detail Mutasi Bank</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Info Mutasi Bank */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal</label>
              <p className="text-sm font-medium text-gray-800">{formatDate(mutation.tanggal)}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Uraian</label>
              <p className="text-sm font-medium text-gray-800">{mutation.uraian || '-'}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah</label>
              <p className={`text-base font-bold ${mutation.jumlah >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mutation.jumlah >= 0 ? '+' : ''}{formatRupiah(mutation.jumlah)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipe</label>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                mutation.jumlah >= 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {mutation.jumlah >= 0 ? 'Pemasukan' : 'Pengeluaran'}
              </span>
            </div>
          </div>

          {/* Info Transaksi Terkait */}
          {mutation.transaction_id && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Transaksi Terkait
              </h3>

              {loadingTransaction ? (
                <div className="text-center py-4 text-gray-500 text-sm">Memuat data transaksi...</div>
              ) : transaction ? (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Uraian Transaksi</p>
                      <p className="text-sm font-medium text-gray-800">{transaction.uraian}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-600">Sumber/Penerima</p>
                      <p className="text-sm font-medium text-gray-800">{transaction.sumber_atau_penerima}</p>
                    </div>
                  </div>

                  {transaction.lampiran && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Lampiran</p>
                      <img
                        src={transaction.lampiran}
                        alt="Lampiran"
                        className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90"
                        onClick={() => window.open(transaction.lampiran!, '_blank')}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Transaksi terkait tidak ditemukan atau sudah dihapus.
                  </p>
                </div>
              )}

              {/* Tombol Edit - Tampilkan jika ada callback dan ada transaction_id */}
              {onEditTransaction && mutation.transaction_id && (
                <button
                  onClick={handleEditClick}
                  disabled={loadingTransaction || !transaction}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {loadingTransaction ? 'Memuat...' : !transaction ? 'Transaksi Tidak Ditemukan' : 'Edit Transaksi'}
                </button>
              )}
            </div>
          )}

          {!mutation.transaction_id && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                ℹ️ Mutasi ini ditambahkan secara manual dan tidak terkait dengan transaksi.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
