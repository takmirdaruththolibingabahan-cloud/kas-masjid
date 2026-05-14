'use client';

import { useState, useEffect, useRef } from 'react';
import { compressImage } from '@/lib/imageUtils';

type TransactionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (body: FormData | { tanggal: string; uraian: string; tipe: 'masuk' | 'keluar'; jumlah: number; sumber_atau_penerima: string }) => Promise<void>;
  isBankMutationMode?: boolean; // Mode khusus untuk bank mutations, hide checkbox
  onBankTransactionCreated?: () => void; // Callback ketika transaksi bank dibuat
  defaultMonth?: number; // Bulan yang sedang dibuka (1-12)
  defaultYear?: number; // Tahun yang sedang dibuka
};

export default function TransactionModal({ isOpen, onClose, onSubmit, isBankMutationMode = false, onBankTransactionCreated, defaultMonth, defaultYear }: TransactionFormProps) {
  // Jika ada defaultMonth dan defaultYear, gunakan tanggal hari ini tapi dengan bulan/tahun yang sedang dibuka
  // Jika tanggal hari ini melebihi hari terakhir bulan tersebut, gunakan hari terakhir
  const getDefaultDate = () => {
    if (defaultMonth && defaultYear) {
      const today = new Date();
      const currentDay = today.getDate();
      
      // Cari hari terakhir dari bulan yang dipilih
      const lastDayOfMonth = new Date(defaultYear, defaultMonth, 0).getDate();
      
      // Gunakan tanggal hari ini, atau hari terakhir jika melebihi
      const day = Math.min(currentDay, lastDayOfMonth);
      
      // Format: YYYY-MM-DD
      const month = defaultMonth.toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      return `${defaultYear}-${month}-${dayStr}`;
    }
    return new Date().toISOString().split('T')[0];
  };
  
  const [tanggal, setTanggal] = useState(getDefaultDate());
  const [uraian, setUraian] = useState('');
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [jumlah, setJumlah] = useState('');
  const [jumlahDisplay, setJumlahDisplay] = useState(''); // Untuk tampilan dengan format Rp
  const [sumber_atau_penerima, setSumberAtauPenerima] = useState('');
  const [lampiran, setLampiran] = useState<File | null>(null);
  const [lampiranPreview, setLampiranPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useBank, setUseBank] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTanggal(getDefaultDate());
      setUraian('');
      setJumlah('');
      setJumlahDisplay('');
      setSumberAtauPenerima('');
      setTipe('masuk');
      setLampiran(null);
      setLampiranPreview(null);
      setUseBank(false);
    }
  }, [isOpen, defaultMonth, defaultYear]);

  // Format angka ke Rupiah
  const formatRupiah = (value: string) => {
    // Hapus semua karakter non-digit
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Format dengan pemisah ribuan
    return new Intl.NumberFormat('id-ID').format(parseInt(numbers));
  };

  // Handle perubahan input jumlah
  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Hapus semua karakter non-digit
    const numbers = value.replace(/\D/g, '');
    
    setJumlah(numbers);
    setJumlahDisplay(numbers ? formatRupiah(numbers) : '');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setLampiran(compressed);
      setLampiranPreview(URL.createObjectURL(compressed));
    }
  };

  const removeFile = () => {
    setLampiran(null);
    setLampiranPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle paste dari clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Hanya proses jika modal terbuka
      if (!isOpen) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      // Cari item yang berupa gambar
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const compressed = await compressImage(file);
            setLampiran(compressed);
            setLampiranPreview(URL.createObjectURL(compressed));
          }
          break;
        }
      }
    };

    if (isOpen) {
      window.addEventListener('paste', handlePaste);
    }

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !uraian || !jumlah || !sumber_atau_penerima) return;

    console.log('TransactionModal - useBank:', useBank, 'isBankMutationMode:', isBankMutationMode);

    setLoading(true);
    try {
      if (lampiran) {
        const formData = new FormData();
        formData.append('tanggal', tanggal);
        formData.append('uraian', uraian);
        formData.append('tipe', tipe);
        formData.append('jumlah', jumlah);
        formData.append('sumber_atau_penerima', sumber_atau_penerima);
        formData.append('lampiran', lampiran);
        if (useBank && !isBankMutationMode) {
          formData.append('useBank', 'true');
          console.log('Adding useBank=true to FormData');
        }

        await onSubmit(formData);
      } else {
        const body: any = {
          tanggal,
          uraian,
          tipe,
          jumlah: parseInt(jumlah),
          sumber_atau_penerima,
        };
        
        if (useBank && !isBankMutationMode) {
          body.useBank = true;
          console.log('Adding useBank=true to JSON body');
        }

        await onSubmit(body);
      }

      onClose();
      
      // Trigger callback jika transaksi bank dibuat
      if (useBank && !isBankMutationMode && onBankTransactionCreated) {
        onBankTransactionCreated();
      }
    } catch (err) {
      alert('Gagal menambahkan transaksi');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-green-700">Input Transaksi Baru</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 pb-24 sm:pb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Transaksi</label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="masuk"
                  checked={tipe === 'masuk'}
                  onChange={() => setTipe('masuk')}
                  className="mr-2 w-4 h-4 text-green-600"
                />
                <span className="text-green-600 font-medium">Pemasukan</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="keluar"
                  checked={tipe === 'keluar'}
                  onChange={() => setTipe('keluar')}
                  className="mr-2 w-4 h-4 text-red-600"
                />
                <span className="text-red-600 font-medium">Pengeluaran</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tipe === 'masuk' ? 'Uang Diterima Dari' : 'Uang Diberikan Kepada'}
            </label>
            <input
              type="text"
              value={sumber_atau_penerima}
              onChange={(e) => setSumberAtauPenerima(e.target.value)}
              placeholder={tipe === 'masuk' ? 'Contoh: H. Ahmad (Infaq)' : 'Contoh: Toko Bangunan (Semen)'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
              <input
                type="text"
                value={jumlahDisplay}
                onChange={handleJumlahChange}
                placeholder="0"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uraian</label>
            <input
              type="text"
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Contoh: Infaq Jumat, Pembelian Karpet"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Bank Integration Checkbox - only show if NOT in bank mutation mode */}
          {!isBankMutationMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBank}
                  onChange={(e) => setUseBank(e.target.checked)}
                  className="mt-0.5 mr-2 w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    {tipe === 'masuk' ? 'Masuk ke Rekening Bank' : 'Ambil dari Rekening Bank'}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tipe === 'masuk' 
                      ? 'Centang jika uang ini masuk ke rekening bank' 
                      : 'Centang jika uang ini diambil dari rekening bank'}
                  </p>
                </div>
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lampiran (Opsional)</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-md px-4 py-6 text-center hover:border-green-500 transition-colors">
                  <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Klik untuk pilih gambar</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, max 5MB</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">atau tekan Ctrl+V untuk paste</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {lampiranPreview && (
              <div className="mt-3 relative">
                <img src={lampiranPreview} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                >
                  &times;
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 sm:static fixed bottom-0 left-0 right-0 p-4 bg-white border-t sm:border-t-0 sm:bg-transparent sm:p-0 sm:static">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
