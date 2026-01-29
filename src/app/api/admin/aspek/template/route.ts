import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // Get existing jurusans
    const jurusans = await db.jurusan.findMany({
      orderBy: { kode: 'asc' },
    });

    // Use first jurusan or default to TKJ
    const sampleJurusan = jurusans.length > 0 ? jurusans[0] : { kode: 'TKJ', nama: 'Teknik Komputer dan Jaringan' };

    // Create template data
    const templateData = [
      ['Kode Jurusan', 'Nama Aspek Penilaian', 'Nama Elemen Kompetensi', 'Bobot (%)', 'Sub-Elemen (Opsional)'],
      [sampleJurusan.kode, 'Sikap Kerja', 'Tanggung Jawab', 50, 'Selalu menyelesaikan tugas tepat waktu'],
      [sampleJurusan.kode, 'Sikap Kerja', 'Tanggung Jawab', 50, 'Melaporkan hasil pekerjaan dengan jujur'],
      [sampleJurusan.kode, 'Sikap Kerja', 'Kerjasama', 25, 'Bekerja sama dengan tim dengan baik'],
      [sampleJurusan.kode, 'Sikap Kerja', 'Kerjasama', 25, 'Mau membantu rekan kerja'],
      [sampleJurusan.kode, 'Sikap Kerja', 'Kedisiplinan', 25, 'Datang tepat waktu'],
      [sampleJurusan.kode, 'Sikap Kerja', 'Kedisiplinan', 25, 'Mengikuti aturan kerja'],
    ];

    // Add available jurusans info
    if (jurusans.length > 0) {
      templateData.push([]);
      templateData.push(['KODE JURUSAN YANG TERSEDIA:']);
      jurusans.forEach((j) => {
        templateData.push([j.kode, j.nama]);
      });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aspek Penilaian');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Kode Jurusan
      { wch: 30 }, // Nama Aspek Penilaian
      { wch: 30 }, // Nama Elemen Kompetensi
      { wch: 12 }, // Bobot (%)
      { wch: 50 }, // Sub-Elemen
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-aspek-penilaian.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Gagal membuat template' },
      { status: 500 }
    );
  }
}
