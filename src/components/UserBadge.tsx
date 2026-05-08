'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import StorageInfo from '@/components/StorageInfo';
import BulkDeleteModal from '@/components/BulkDeleteModal';

export default function UserBadge({ mobileIconOnly = false }: { mobileIconOnly?: boolean }) {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const openChangePassword = () => {
    setOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowChangePassword(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setSaving(true);
    try {
      // Verifikasi password lama dengan re-login
      const supabase = getSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: oldPassword,
      });

      if (signInError) {
        setError('Password lama salah');
        return;
      }

      // Update password baru
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess('Password berhasil diubah');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Terjadi kesalahan, coba lagi');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <>
      <div className="relative flex-shrink-0" ref={ref}>
        {/* Trigger */}
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full py-1 ${mobileIconOnly ? 'p-1 sm:pl-1 sm:pr-3' : 'pl-1 pr-3'}`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAdmin ? 'bg-yellow-400 text-yellow-900' : 'bg-white/30 text-white'}`}>
            {initial}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs text-white font-medium truncate max-w-[140px]">{user.email}</span>
            <span className={`text-xs font-semibold ${isAdmin ? 'text-yellow-300' : 'text-green-200'}`}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          </div>
          {!mobileIconOnly && (
            <span className={`sm:hidden text-xs font-semibold ${isAdmin ? 'text-yellow-300' : 'text-green-200'}`}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          )}
          <svg
            className={`w-3 h-3 text-white/70 transition-transform ${open ? 'rotate-180' : ''} ${mobileIconOnly ? 'hidden sm:block' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-500">Masuk sebagai</p>
              <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{user.email}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${isAdmin ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>

            {/* Ganti Sandi - hanya admin */}
            {isAdmin && (
              <button
                onClick={openChangePassword}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Ganti Sandi
              </button>
            )}

            {/* Info Sistem - hanya admin */}
            {isAdmin && (
              <button
                onClick={() => { setOpen(false); setShowStorageInfo(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Info Sistem
              </button>
            )}

            {/* Hapus Transaksi Bulanan - hanya admin */}
            {isAdmin && (
              <button
                onClick={() => { setOpen(false); setShowBulkDelete(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-b border-gray-100 text-left whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Transaksi Bulanan
              </button>
            )}

            {/* Keluar */}
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Keluar
            </button>
          </div>
        )}
      </div>

      {/* Modal Ganti Sandi */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowChangePassword(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Ganti Sandi</h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ulangi password baru"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              {success && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  {success}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-md text-sm hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-md text-sm hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Info Sistem */}
      {showStorageInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowStorageInfo(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Info Sistem</h2>
              <button
                onClick={() => setShowStorageInfo(false)}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-5">
              <StorageInfo />
            </div>
          </div>
        </div>
      )}

      <BulkDeleteModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
      />
    </>
  );
}
