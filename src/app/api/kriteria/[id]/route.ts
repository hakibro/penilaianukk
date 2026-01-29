import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const kriteria = await db.kriteriaPenilaian.update({
      where: { id },
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
  } catch (error: any) {
    console.error('Error updating kriteria:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kriteria tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal mengupdate kriteria' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.kriteriaPenilaian.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Kriteria berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting kriteria:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kriteria tidak ditemukan' },
        { status: 404 }
      );
    }

    if (error.code === 'P2003' || error.code === 'P2014') {
      return NextResponse.json(
        { error: 'Gagal menghapus kriteria karena masih ada penilaian yang menggunakan kriteria ini.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal menghapus kriteria: ' + error.message },
      { status: 500 }
    );
  }
}
