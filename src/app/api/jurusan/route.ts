import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const jurusans = await db.jurusan.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      jurusans,
      total: jurusans.length,
    });
  } catch (error) {
    console.error('Error fetching jurusans:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data jurusan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nama, kode } = await request.json();

    if (!nama || !kode) {
      return NextResponse.json(
        { error: 'Nama dan kode jurusan diperlukan' },
        { status: 400 }
      );
    }

    const jurusan = await db.jurusan.create({
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
    console.error('Error creating jurusan:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Kode atau nama jurusan sudah ada' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal membuat jurusan baru' },
      { status: 500 }
    );
  }
}
