import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan akses dari IP HP di jaringan lokal
  allowedDevOrigins: ['192.168.1.3'],
  
  // Ignore TypeScript errors during build (untuk deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Tambahkan turbopack config kosong untuk fix error
  turbopack: {},
};

export default nextConfig;
