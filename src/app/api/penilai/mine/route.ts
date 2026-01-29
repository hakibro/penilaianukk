import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';

/**
 * GET endpoint to get current penilai's data
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'PENILAI') {
      return NextResponse.json(
        { error: 'Not a penilai' },
        { status: 403 }
      );
    }

    // Find penilai by userId
    const penilai = await db.penilai.findFirst({
      where: { userId: user.id },
      include: {
        jurusan: true,
        user: true,
      },
    });

    if (!penilai) {
      return NextResponse.json(
        { error: 'Penilai not found' },
        { status: 404 }
      );
    }

    console.log('✅ [PENILAI MINE API] Penilai found:', penilai.nama, 'Jurusan:', penilai.jurusan.nama);

    return NextResponse.json({
      success: true,
      penilai,
    });
  } catch (error) {
    console.error('Error fetching penilai:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data penilai' },
      { status: 500 }
    );
  }
}
