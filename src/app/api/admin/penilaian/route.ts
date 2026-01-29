import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const penilaian = await db.penilaianAspek.findMany({
      distinct: ['siswaId'],
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      penilaian,
      total: penilaian.length,
    });
  } catch (error) {
    console.error('Error fetching penilaian:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data penilaian' },
      { status: 500 }
    );
  }
}
