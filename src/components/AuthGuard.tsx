'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Tampilkan error jika loading terlalu lama
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mb-4"></div>
          <p className="text-gray-500 text-sm">Memuat...</p>
          {showError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md max-w-md">
              <p className="text-red-700 text-sm font-medium mb-2">Koneksi bermasalah</p>
              <p className="text-red-600 text-xs mb-3">
                Tidak dapat terhubung ke server. Periksa:
              </p>
              <ul className="text-left text-xs text-red-600 space-y-1 mb-3">
                <li>• Koneksi internet</li>
                <li>• Konfigurasi Supabase di .env.local</li>
                <li>• Console browser (F12) untuk error detail</li>
              </ul>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Muat Ulang
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
