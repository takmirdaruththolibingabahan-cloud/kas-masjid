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

type KasData = {
  rekeningBank: number;
  kasTunai: number;
  saldoTercatat: number;
};

export async function exportToExcel(
  transactions: Transaction[],
  selectedMonth: number,
  selectedYear: number,
  kasData?: KasData
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Masjid Daruth Tholibin';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(
    `Transaksi ${MONTHS[selectedMonth - 1]} ${selectedYear}`
  );

  // ── Lebar kolom ───────────────────────────────────────────────────────────
  sheet.getColumn(1).width = 5;   // No
  sheet.getColumn(2).width = 16;  // Tanggal
  sheet.getColumn(3).width = 30;  // Uraian
  sheet.getColumn(4).width = 28;  // Sumber/Penerima
  sheet.getColumn(5).width = 18;  // Masuk
  sheet.getColumn(6).width = 18;  // Keluar
  sheet.getColumn(7).width = 18;  // Saldo
  sheet.getColumn(8).width = 22;  // Lampiran

  // ── Helper: border tipis untuk sel kas ────────────────────────────────────
  const kasBorder: ExcelJS.Borders = {
    top:    { style: 'thin', color: { argb: 'FFD1FAE5' } },
    bottom: { style: 'thin', color: { argb: 'FFD1FAE5' } },
    left:   { style: 'thin', color: { argb: 'FFD1FAE5' } },
    right:  { style: 'thin', color: { argb: 'FFD1FAE5' } },
  };

  // ── Judul ──────────────────────────────────────────────────────────────────
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Masjid Daruth Tholibin';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF15803D' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
  sheet.getRow(1).height = 28;

  sheet.mergeCells('A2:H2');
  const subTitleCell = sheet.getCell('A2');
  subTitleCell.value = `Laporan Transaksi — ${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  subTitleCell.font = { size: 11, color: { argb: 'FF6B7280' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
  sheet.getRow(2).height = 20;

  sheet.addRow([]); // row 3 — spacer

  // ── Info Kas & Rekening (di atas tabel) ───────────────────────────────────
  let dataStartRow: number;

  if (kasData) {
    // Row 4 — label header seksi
    sheet.mergeCells('A4:H4');
    const kasSecLabel = sheet.getCell('A4');
    kasSecLabel.value = 'Info Kas & Rekening  (akumulasi semua tahun)';
    kasSecLabel.font = { bold: true, size: 11, color: { argb: 'FF065F46' } };
    kasSecLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    kasSecLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    sheet.getRow(4).height = 20;

    // Row 5 — 3 kartu sejajar: Saldo Tercatat | Rekening Bank | Kas Tunai
    // Kartu 1: A5:B6 — Saldo Tercatat (biru)
    // Kartu 2: D5:E6 — Rekening Bank (hijau)
    // Kartu 3: G5:H6 — Kas Tunai (kuning)

    const paintCard = (
      labelCell: string, valueCell: string, mergeLabel: string, mergeValue: string,
      label: string, value: number,
      bgArgb: string, valArgb: string,
    ) => {
      sheet.mergeCells(mergeLabel);
      sheet.mergeCells(mergeValue);

      const lCell = sheet.getCell(labelCell);
      lCell.value = label;
      lCell.font = { size: 9, color: { argb: 'FF6B7280' } };
      lCell.alignment = { horizontal: 'center', vertical: 'bottom' };
      lCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      lCell.border = kasBorder;

      const vCell = sheet.getCell(valueCell);
      vCell.value = value;
      vCell.numFmt = '#,##0';
      vCell.font = { bold: true, size: 12, color: { argb: valArgb } };
      vCell.alignment = { horizontal: 'center', vertical: 'top' };
      vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      vCell.border = kasBorder;
    };

    // Saldo Tercatat — kolom A-B
    paintCard('A5','A6','A5:C5','A6:C6',
      'Saldo Tercatat', kasData.saldoTercatat, 'FFDBEAFE', 'FF1D4ED8');

    // Rekening Bank — kolom D-F (tengah, ada gap col C & D — gunakan D-F saja, skip C)
    paintCard('D5','D6','D5:F5','D6:F6',
      'Rekening Bank', kasData.rekeningBank, 'FFD1FAE5', 'FF065F46');

    // Kas Tunai — kolom G-H
    paintCard('G5','G6','G5:H5','G6:H6',
      'Kas Tunai  (Saldo − Rekening)', kasData.kasTunai,
      'FFFEF9C3', kasData.kasTunai >= 0 ? 'FFB45309' : 'FFDC2626');

    sheet.getRow(5).height = 16;
    sheet.getRow(6).height = 22;

    sheet.addRow([]); // row 7 — spacer sebelum tabel

    // Header tabel mulai row 8, data row 9
    dataStartRow = 9;

    // ── Header kolom (row 8) ───────────────────────────────────────────────
    const headerRow = sheet.addRow(['No', 'Tanggal', 'Uraian', 'Sumber/Penerima', 'Masuk (Rp)', 'Keluar (Rp)', 'Saldo (Rp)', 'Lampiran']);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FF0F6030' } },
        bottom: { style: 'thin', color: { argb: 'FF0F6030' } },
        left:   { style: 'thin', color: { argb: 'FF0F6030' } },
        right:  { style: 'thin', color: { argb: 'FF0F6030' } },
      };
    });
    headerRow.height = 22;
  } else {
    // Tidak ada kasData — layout semula, header tabel di row 4
    sheet.addRow([]); // row 3 — sudah dibuat, ini row 4 sebenarnya... addRow lagi
    const headerRow = sheet.addRow(['No', 'Tanggal', 'Uraian', 'Sumber/Penerima', 'Masuk (Rp)', 'Keluar (Rp)', 'Saldo (Rp)', 'Lampiran']);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FF0F6030' } },
        bottom: { style: 'thin', color: { argb: 'FF0F6030' } },
        left:   { style: 'thin', color: { argb: 'FF0F6030' } },
        right:  { style: 'thin', color: { argb: 'FF0F6030' } },
      };
    });
    headerRow.height = 22;
    dataStartRow = 5;
  }

  // ── Data rows ─────────────────────────────────────────────────────────────
  let saldo = 0;
  let totalMasuk = 0;
  let totalKeluar = 0;

  // Fetch semua gambar lampiran secara paralel
  const imagePromises = transactions.map(t =>
    t.lampiran ? fetchImageAsBase64(t.lampiran) : Promise.resolve(null)
  );
  const images = await Promise.all(imagePromises);

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
