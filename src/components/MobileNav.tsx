'use client';

import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  // Sembunyikan navbar di halaman login
  if (pathname === '/login') return null;

  // Tidak perlu bottom nav lagi karena hanya 1 halaman utama
  return null;
}
