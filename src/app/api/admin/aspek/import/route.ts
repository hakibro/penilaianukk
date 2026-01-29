import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    console.log('Processing aspek import file:', file.name, file.size);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    console.log('Excel data rows:', jsonData.length);
    console.log('Sample row data:', JSON.stringify(jsonData.slice(0, 2), null, 2));

    // Skip header row, process data
    const dataRows = jsonData.slice(1);
    const aspekData: any[] = [];

    // Get all available jurusans for better error messages
    const allJurusans = await db.jurusan.findMany();
    console.log('Available jurusans:', allJurusans.map(j => `${j.kode} (${j.nama})`));

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const [kodeJurusan, namaAspek, namaElemen, bobot, namaSubElemen] = row;

      console.log(`Row ${i + 1}:`, { kodeJurusan, namaAspek, namaElemen, bobot, namaSubElemen });

      if (!kodeJurusan || !namaAspek || !namaElemen || !bobot) {
        console.log(`Row ${i + 1}: Skipping - missing required data`);
        continue;
      }

      // Find jurusan by kode
      const jurusan = await db.jurusan.findFirst({
        where: { kode: kodeJurusan.toString().trim().toUpperCase() },
      });

      if (!jurusan) {
        console.log(`Row ${i + 1}: Jurusan not found for kode:`, kodeJurusan);
        continue;
      }

      console.log(`Row ${i + 1}: Found jurusan`, jurusan.nama, `(${jurusan.kode})`);

      // Check if aspek already exists
      const existingAspek = await db.aspekPenilaian.findFirst({
        where: {
          nama: namaAspek.toString().trim(),
          jurusanId: jurusan.id,
        },
      });

      if (existingAspek) {
        console.log(`Row ${i + 1}: Aspek already exists, skipping:`, namaAspek);
        continue;
      }

      aspekData.push({
        nama: namaAspek.toString().trim(),
        jurusanId: jurusan.id,
        jurusanKode: jurusan.kode,
        elemen: namaElemen.toString().trim(),
        bobot: parseFloat(bobot),
        subElemen: namaSubElemen ? namaSubElemen.toString().trim() : null,
      });
    }

    console.log('Valid aspek data rows:', aspekData.length);

    // Group by aspek
    const groupedAspeks = aspekData.reduce((acc: any, curr: any) => {
      const key = `${curr.nama}-${curr.jurusanId}`;
      if (!acc[key]) {
        acc[key] = {
          nama: curr.nama,
          jurusanId: curr.jurusanId,
          elemens: [],
        };
      }

      // Check if elemen already exists
      const existingElemen = acc[key].elemens.find((e: any) => e.nama === curr.elemen);
      if (existingElemen) {
        if (curr.subElemen && curr.subElemen.trim()) {
          existingElemen.subElemens.push({ nama: curr.subElemen });
        }
      } else {
        const elemenData: any = {
          nama: curr.elemen,
          bobot: curr.bobot,
          subElemens: [],
        };

        if (curr.subElemen && curr.subElemen.trim()) {
          elemenData.subElemens.push({ nama: curr.subElemen });
        }

        acc[key].elemens.push(elemenData);
      }

      return acc;
    }, {});

    // Validate and create aspeks
    const createdAspeks = [];
    const errors: string[] = [];
    const skippedInfo: string[] = [];

    for (const key in groupedAspeks) {
      const aspek = groupedAspeks[key];

      // Validate total bobot
      const totalBobot = aspek.elemens.reduce((sum: number, e: any) => sum + e.bobot, 0);
      if (totalBobot !== 100) {
        errors.push(`Aspek "${aspek.nama}" (${aspek.kodeJurusan}): Total bobot ${totalBobot}% (harus 100%)`);
        continue;
      }

      console.log('Creating aspek:', aspek.nama, 'with', aspek.elemens.length, 'elemens');

      try {
        const created = await db.aspekPenilaian.create({
          data: {
            nama: aspek.nama,
            jurusanId: aspek.jurusanId,
            elemens: {
              create: aspek.elemens.map((e: any) => ({
                nama: e.nama,
                bobot: e.bobot,
                subElemens: e.subElemens.length > 0 ? {
                  create: e.subElemens,
                } : undefined,
              })),
            },
          },
          include: {
            elemens: {
              include: {
                subElemens: true,
              },
            },
          },
        });

        createdAspeks.push(created);
        console.log('Created aspek successfully:', created.nama);
      } catch (error: any) {
        console.error('Failed to create aspek:', aspek.nama, error);
        errors.push(`Aspek "${aspek.nama}" (${aspek.kodeJurusan}): ${error.message || 'Gagal membuat'}`);
      }
    }

    // Add info about skipped rows
    const totalRows = dataRows.length;
    const skippedRows = totalRows - aspekData.length;

    if (skippedRows > 0) {
      skippedInfo.push(`${skippedRows} baris dilewati (jurusan tidak ditemukan atau aspek sudah ada)`);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${createdAspeks.length} aspek penilaian`,
      created: createdAspeks.length,
      totalRows,
      skippedRows,
      skippedInfo: skippedInfo.length > 0 ? skippedInfo : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error importing aspek:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengimpor aspek penilaian' },
      { status: 500 }
    );
  }
}
