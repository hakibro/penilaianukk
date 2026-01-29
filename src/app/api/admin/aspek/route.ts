import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jurusanId = searchParams.get('jurusanId');

    const aspeks = await db.aspekPenilaian.findMany({
      where: jurusanId ? { jurusanId } : undefined,
      include: {
        elemens: {
          include: {
            subElemens: true,
          },
        },
        jurusan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      aspeks,
      total: aspeks.length,
    });
  } catch (error) {
    console.error('Error fetching aspeks:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data aspek' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received POST /api/admin/aspek with body:', JSON.stringify(body, null, 2));

    const { nama, jurusanId, elemens } = body;

    if (!nama || !jurusanId || !elemens || !Array.isArray(elemens)) {
      console.log('Validation failed: Missing required fields', { nama, jurusanId, elemens });
      return NextResponse.json(
        { error: 'Nama, jurusan, dan elemen diperlukan' },
        { status: 400 }
      );
    }

    // Validate elemens have nama and bobot
    const invalidElemens = elemens.filter((e: any) => !e.nama || typeof e.bobot !== 'number' || e.bobot <= 0);
    if (invalidElemens.length > 0) {
      console.log('Validation failed: Invalid elemens', invalidElemens);
      return NextResponse.json(
        { error: 'Setiap elemen harus memiliki nama dan bobot yang valid' },
        { status: 400 }
      );
    }

    // Validate total bobot
    const totalBobot = elemens.reduce((sum: number, e: any) => sum + (e.bobot || 0), 0);
    if (totalBobot !== 100) {
      console.log('Validation failed: Total bobot not 100%', { totalBobot });
      return NextResponse.json(
        { error: `Total bobot elemen harus 100%. Saat ini: ${totalBobot}%` },
        { status: 400 }
      );
    }

    console.log('Creating aspek with:', { nama, jurusanId, elemenCount: elemens.length });

    const aspek = await db.aspekPenilaian.create({
      data: {
        nama,
        jurusanId,
        elemens: {
          create: elemens.map((e: any) => {
            const elemenData: any = {
              nama: e.nama,
              bobot: e.bobot,
            };

            if (e.subElemens && Array.isArray(e.subElemens) && e.subElemens.length > 0) {
              const validSubElemens = e.subElemens.filter((se: any) => se.nama && se.nama.trim());
              if (validSubElemens.length > 0) {
                elemenData.subElemens = {
                  create: validSubElemens.map((se: any) => ({
                    nama: se.nama,
                  })),
                };
              }
            }

            return elemenData;
          }),
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

    console.log('Aspek created successfully:', aspek.id);

    return NextResponse.json({
      success: true,
      aspek,
    });
  } catch (error: any) {
    console.error('Error creating aspek:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat aspek baru' },
      { status: 500 }
    );
  }
}
