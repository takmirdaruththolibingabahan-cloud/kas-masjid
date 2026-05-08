'use client';

import { useState, useRef, useEffect } from 'react';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type Step = 'select' | 'confirm' | 'success';

// Custom dropdown komponen
function CustomSelect<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
      >
        <span className="text-gray-800">{selected?.label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {options.map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-700 transition-colors ${
                  opt.value === value ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BulkDeleteModal({ isOpen, onClose }: Props) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [step, setStep] = useState<Step>('select');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ deleted: number; filesDeleted: number } | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const expectedConfirm = `HAPUS ${MONTHS[selectedMonth - 1].toUpperCase()} ${selectedYear}`;

  const handleClose = () => {
    setStep('select');
    setConfirmText('');
    setResult(null);
    onClose();
  };

  const handleProceedToConfirm = () => {
    setConfirmText('');
    setStep('confirm');
  };

  const handleDelete = async () => {
    if (confirmText !== expectedConfirm) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/transactions/bulk-delete?year=${selectedYear}&month=${selectedMonth}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStep('success');
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);
  const yearOptions = years.map(y => ({ label: String(y), value: y }));
  const monthOptions = MONTHS.map((m, i) => ({ label: m, value: i + 1 }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={step !== 'confirm' ? handleClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Hapus Transaksi Bulanan</h2>
          {step !== 'confirm' && (
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          )}
        </div>

        {/* Step 1: Pilih bulan & tahun */}
        {step === 'select' && (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-red-700">Semua transaksi dan lampiran pada bulan yang dipilih akan <strong>dihapus permanen</strong> dan tidak dapat dikembalikan.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <CustomSelect
                value={selectedYear}
                options={yearOptions}
                onChange={setSelectedYear}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
              <CustomSelect
                value={selectedMonth}
                options={monthOptions}
                onChange={setSelectedMonth}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={handleClose} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Batal
              </button>
              <button onClick={handleProceedToConfirm} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Konfirmasi ketik ulang */}
        {step === 'confirm' && (
          <div className="p-5 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Anda akan menghapus semua transaksi bulan</p>
              <p className="text-base font-bold text-red-600 mt-1">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Ketik <span className="font-mono font-bold text-gray-800">{expectedConfirm}</span> untuk konfirmasi
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={expectedConfirm}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('select')} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Kembali
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== expectedConfirm || loading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:text-gray-400"
              >
                {loading ? 'Menghapus...' : 'Hapus Sekarang'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Sukses */}
        {step === 'success' && result && (
          <div className="p-5 text-center space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-800">Berhasil Dihapus</p>
              <p className="text-sm text-gray-500 mt-1">{result.deleted} transaksi dihapus</p>
              {result.filesDeleted > 0 && (
                <p className="text-sm text-gray-500">{result.filesDeleted} file lampiran dihapus dari storage</p>
              )}
            </div>
            <button onClick={handleClose} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors">
              Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
