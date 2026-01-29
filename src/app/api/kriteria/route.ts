import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const kriterias = await db.kriteriaPenilaian.findMany({
      orderBy: { nilaiMin: 'asc' },
    });

    return NextResponse.json({
      success: true,
      kriterias,
      total: kriterias.length,
    });
  } catch (error) {
    console.error('Error fetching kriterias:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data kriteria' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nama, nilaiMin, nilaiMax, keterangan } = await request.json();

    if (!nama || nilaiMin === undefined || nilaiMax === undefined || !keterangan) {
      return NextResponse.json(
        { error: 'Semua field diperlukan' },
        { status: 400 }
      );
    }

    if (nilaiMin < 0 || nilaiMax > 100 || nilaiMin > nilaiMax) {
      return NextResponse.json(
        { error: 'Range nilai tidak valid' },
        { status: 400 }
      );
    }

    const kriteria = await db.kriteriaPenilaian.create({
      data: {
        nama,
        nilaiMin,
        nilaiMax,
        keterangan,
      },
    });

    return NextResponse.json({
      success: true,
      kriteria,
    });
  } catch (error) {
    console.error('Error creating kriteria:', error);
    return NextResponse.json(
      { error: 'Gagal membuat kriteria baru' },
      { status: 500 }
    );
  }
}
