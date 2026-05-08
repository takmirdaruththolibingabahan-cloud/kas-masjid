import ExcelJS from 'exceljs';
import { Transaction } from './supabase';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; ext: string } | null> {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : 'jpeg';
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return { base64, ext };
  } catch {
    return null;
  }
}

export async function exportToExcel(
  transactions: Transaction[],
  selectedMonth: number,
  selectedYear: number
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Masjid Daruth Tholibin';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(
    `Transaksi ${MONTHS[selectedMonth - 1]} ${selectedYear}`
  );

  // ── Judul ──────────────────────────────────────────────────────────────────
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Masjid Daruth Tholibin';
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF15803D' } };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:G2');
  const subTitleCell = sheet.getCell('A2');
  subTitleCell.value = `Laporan Transaksi — ${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  subTitleCell.font = { size: 11, color: { argb: 'FF6B7280' } };
  subTitleCell.alignment = { horizontal: 'center' };

  sheet.addRow([]); // baris kosong

  // ── Header kolom ──────────────────────────────────────────────────────────
  const headerRow = sheet.addRow(['No', 'Tanggal', 'Uraian', 'Sumber/Penerima', 'Masuk (Rp)', 'Keluar (Rp)', 'Saldo (Rp)', 'Lampiran']);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F6030' } },
      bottom: { style: 'thin', color: { argb: 'FF0F6030' } },
      left: { style: 'thin', color: { argb: 'FF0F6030' } },
      right: { style: 'thin', color: { argb: 'FF0F6030' } },
    };
  });
  headerRow.height = 22;

  // ── Lebar kolom ───────────────────────────────────────────────────────────
  sheet.getColumn(1).width = 5;   // No
  sheet.getColumn(2).width = 16;  // Tanggal
  sheet.getColumn(3).width = 30;  // Uraian
  sheet.getColumn(4).width = 28;  // Sumber/Penerima
  sheet.getColumn(5).width = 18;  // Masuk
  sheet.getColumn(6).width = 18;  // Keluar
  sheet.getColumn(7).width = 18;  // Saldo
  sheet.getColumn(8).width = 22;  // Lampiran

  // ── Data rows ─────────────────────────────────────────────────────────────
  let saldo = 0;
  let totalMasuk = 0;
  let totalKeluar = 0;

  // Fetch semua gambar lampiran secara paralel
  const imagePromises = transactions.map(t =>
    t.lampiran ? fetchImageAsBase64(t.lampiran) : Promise.resolve(null)
  );
  const images = await Promise.all(imagePromises);

  const dataStartRow = 5; // header ada di row 4, data mulai row 5

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const rowIndex = dataStartRow + i;

    if (t.tipe === 'masuk') {
      saldo += t.jumlah;
      totalMasuk += t.jumlah;
    } else {
      saldo -= t.jumlah;
      totalKeluar += t.jumlah;
    }

    const tanggal = new Date(t.tanggal).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

    const row = sheet.addRow([
      i + 1,
      tanggal,
      t.uraian,
      t.sumber_atau_penerima,
      t.tipe === 'masuk' ? t.jumlah : '',
      t.tipe === 'keluar' ? t.jumlah : '',
      saldo,
      t.lampiran ? '(lihat gambar)' : '',
    ]);

    row.height = images[i] ? 80 : 20;

    // Style baris
    const isEven = i % 2 === 0;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: isEven ? 'FFF9FAFB' : 'FFFFFFFF' },
      };
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        left: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        right: { style: 'hair', color: { argb: 'FFE5E7EB' } },
      };
      cell.alignment = { vertical: 'middle' };

      // Format angka
      if (colNumber === 5 || colNumber === 6 || colNumber === 7) {
        if (cell.value !== '') {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
        if (colNumber === 5) cell.font = { color: { argb: 'FF16A34A' } };
        if (colNumber === 6) cell.font = { color: { argb: 'FFDC2626' } };
      }
    });

    // Embed gambar lampiran
    if (images[i]) {
      const { base64, ext } = images[i]!;
      const imageId = workbook.addImage({
        base64,
        extension: ext as 'jpeg' | 'png' | 'gif',
      });
      
      // Type cast to avoid ExcelJS type definition issues
      (sheet.addImage as any)(imageId, {
        tl: { col: 7, row: rowIndex - 1 },
        br: { col: 8, row: rowIndex },
        editAs: 'oneCell',
      });
      
      // Kosongkan teks placeholder karena sudah ada gambar
      sheet.getCell(rowIndex, 8).value = '';
    }
  }

  // ── Baris total ───────────────────────────────────────────────────────────
  const totalRow = sheet.addRow(['', '', '', 'Total', totalMasuk, totalKeluar, totalMasuk - totalKeluar, '']);
  totalRow.height = 22;
  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF15803D' } },
      bottom: { style: 'thin', color: { argb: 'FF15803D' } },
    };
    cell.alignment = { vertical: 'middle' };
    if (colNumber === 5) { cell.numFmt = '#,##0'; cell.font = { bold: true, color: { argb: 'FF15803D' } }; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
    if (colNumber === 6) { cell.numFmt = '#,##0'; cell.font = { bold: true, color: { argb: 'FFDC2626' } }; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
    if (colNumber === 7) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  sheet.addRow([]);
  const footerRow = sheet.addRow([
    '', '', '', '', '', '', '',
    `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  ]);
  footerRow.getCell(8).font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 10 };

  // ── Download ──────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transaksi-${MONTHS[selectedMonth - 1]}-${selectedYear}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
