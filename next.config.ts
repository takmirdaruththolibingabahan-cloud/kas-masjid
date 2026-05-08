import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan akses dari semua IP di jaringan lokal
  allowedDevOrigins: ["192.168.1.6", "192.168.88.242"],
};

export default nextConfig;
