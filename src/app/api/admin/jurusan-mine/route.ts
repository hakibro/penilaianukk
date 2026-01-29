import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';

/**
 * Get the jurusan associated with the current ADMIN_JURUSAN user
 * Returns the jurusan ID and details from the admin_jurusan table
 */
export async function GET(request: NextRequest) {
  console.log('🔍 [ADMIN JURUSAN API] Fetching admin jurusan data...');

  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN_JURUSAN') {
      return NextResponse.json(
        { error: 'Forbidden - Not an admin jurusan' },
        { status: 403 }
      );
    }

    // Get the admin jurusan record
    const adminJurusan = await db.adminJurusan.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        jurusan: true,
      },
    });

    if (!adminJurusan) {
      return NextResponse.json(
        { error: 'Admin jurusan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jurusanId: adminJurusan.jurusanId,
      jurusan: adminJurusan.jurusan,
    });
  } catch (error) {
    console.error('Error fetching admin jurusan:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data jurusan admin' },
      { status: 500 }
    );
  }
}
