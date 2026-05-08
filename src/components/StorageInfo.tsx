'use client';

import { useEffect, useState } from 'react';

type StorageData = {
  storage: {
    usedBytes: number;
    fileCount: number;
    limitBytes: number;
  };
  database: {
    transactionCount: number;
    kasCount: number;
    totalRows: number;
    rowLimit: number;
  };
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type CircleProps = {
  percent: number;
  color: string;
  trackColor: string;
  size?: number;
  strokeWidth?: number;
  children: React.ReactNode;
};

function CircularProgress({ percent, color, trackColor, size = 120, strokeWidth = 10, children }: CircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default function StorageInfo() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/storage-info', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-bold text-green-700 mb-4">Penggunaan Sistem</h2>
        <p className="text-sm text-gray-400">Memuat data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-bold text-green-700 mb-4">Penggunaan Sistem</h2>
        <p className="text-sm text-red-500">Gagal memuat: {error}</p>
      </div>
    );
  }

  const storagePercent = (data.storage.usedBytes / data.storage.limitBytes) * 100;
  const dbPercent = (data.database.transactionCount / data.database.rowLimit) * 100;

  const storageColor = storagePercent > 80 ? '#dc2626' : storagePercent > 60 ? '#f59e0b' : '#16a34a';
  const dbColor = dbPercent > 80 ? '#dc2626' : dbPercent > 60 ? '#f59e0b' : '#2563eb';

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="text-lg sm:text-xl font-bold text-green-700 mb-5">Penggunaan Sistem</h2>

      <div className="grid grid-cols-2 gap-4 sm:gap-8">

        {/* Storage */}
        <div className="flex flex-col items-center gap-3">
          <CircularProgress
            percent={storagePercent}
            color={storageColor}
            trackColor="#e5e7eb"
            size={120}
            strokeWidth={10}
          >
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: storageColor }}>
                {storagePercent < 1 ? '<1' : storagePercent.toFixed(1)}%
              </p>
            </div>
          </CircularProgress>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Storage</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatBytes(data.storage.usedBytes)} / {formatBytes(data.storage.limitBytes)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{data.storage.fileCount} file lampiran</p>
          </div>
        </div>

        {/* Database */}
        <div className="flex flex-col items-center gap-3">
          <CircularProgress
            percent={dbPercent}
            color={dbColor}
            trackColor="#e5e7eb"
            size={120}
            strokeWidth={10}
          >
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: dbColor }}>
                {dbPercent < 1 ? '<1' : dbPercent.toFixed(1)}%
              </p>
            </div>
          </CircularProgress>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Database</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {data.database.transactionCount.toLocaleString('id-ID')} / {data.database.rowLimit.toLocaleString('id-ID')} transaksi
            </p>
          </div>
        </div>

      </div>

      {/* Legend warna */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex justify-center gap-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Aman
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Perhatian
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Kritis
        </span>
      </div>
    </div>
  );
}
