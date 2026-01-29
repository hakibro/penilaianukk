import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nama, kode } = await request.json();

    if (!nama || !kode) {
      return NextResponse.json(
        { error: 'Nama dan kode jurusan diperlukan' },
        { status: 400 }
      );
    }

    const jurusan = await db.jurusan.update({
      where: { id },
      data: {
        nama,
        kode: kode.toUpperCase(),
      },
    });

    return NextResponse.json({
      success: true,
      jurusan,
    });
  } catch (error: any) {
    console.error('Error updating jurusan:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Jurusan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Kode atau nama jurusan sudah ada' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal mengupdate jurusan' },
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

    await db.jurusan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Jurusan berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting jurusan:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Jurusan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (error.code === 'P2003' || error.code === 'P2014') {
      return NextResponse.json(
        { error: 'Gagal menghapus jurusan karena masih ada data yang terhubung (siswa, penilai, admin jurusan, atau aspek penilaian). Hapus data terkait terlebih dahulu.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal menghapus jurusan: ' + error.message },
      { status: 500 }
    );
  }
}
