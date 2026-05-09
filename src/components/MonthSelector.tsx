'use client';

import { useState, useRef, useEffect } from 'react';

type MonthSelectorProps = {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function MonthSelector({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'month' | 'year'>('month');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const label = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {label}
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop untuk mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed md:absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 top-1/2 -translate-y-1/2 md:translate-y-0 md:top-full mt-0 md:mt-2 bg-white border border-gray-200 rounded-lg shadow-xl md:shadow-lg w-[90vw] max-w-xs md:w-64 z-50 p-3">
            {view === 'month' ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Pilih Bulan</h3>
                  <button
                    onClick={() => setView('year')}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    Ganti Tahun
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onMonthChange(index + 1);
                        setIsOpen(false);
                      }}
                      className={`text-xs py-1.5 rounded-md transition-colors ${
                        selectedMonth === index + 1
                          ? 'bg-green-600 text-white font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {month.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setView('month')}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    Pilih Bulan
                  </button>
                  <h3 className="text-sm font-semibold text-gray-700">Pilih Tahun</h3>
                  <div className="w-16" />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        onYearChange(year);
                        setView('month');
                      }}
                      className={`text-xs py-1.5 rounded-md transition-colors ${
                        selectedYear === year
                          ? 'bg-green-600 text-white font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
