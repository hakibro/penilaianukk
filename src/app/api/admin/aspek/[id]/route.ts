import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('🗑️ [ASPEK API DELETE] Received DELETE request for aspek:', id);

    // Check if aspek exists
    const aspek = await db.aspekPenilaian.findUnique({
      where: { id },
      include: {
        elemens: true,
      },
    });

    if (!aspek) {
      console.log('❌ [ASPEK API DELETE] Aspek not found:', id);
      return NextResponse.json(
        { error: 'Aspek penilaian tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('✅ [ASPEK API DELETE] Aspek found:', aspek.nama);
    console.log('📋 [ASPEK API DELETE] Elemen count:', aspek.elemens.length);

    // Check if aspek is being used in any penilaian
    if (aspek.elemens && aspek.elemens.length > 0) {
      const elemenIds = aspek.elemens.map(e => e.id);

      const penilaianCount = await db.penilaianAspek.count({
        where: {
          elemenId: {
            in: elemenIds,
          },
        },
      });

      console.log('📊 [ASPEK API DELETE] Penilaian count using elemens:', penilaianCount);

      if (penilaianCount > 0) {
        console.log('⚠️ [ASPEK API DELETE] Aspek is in use, cannot delete');
        return NextResponse.json(
          { error: 'Aspek penilaian tidak dapat dihapus karena sudah digunakan dalam penilaian' },
          { status: 400 }
        );
      }
    }

    console.log('🗑️ [ASPEK API DELETE] Starting cascade delete...');

    // Manually delete in correct order due to lack of cascade in schema:
    // 1. Delete all penilaian that use these elemens
    if (aspek.elemens && aspek.elemens.length > 0) {
      const elemenIds = aspek.elemens.map(e => e.id);
      await db.penilaianAspek.deleteMany({
        where: {
          elemenId: {
            in: elemenIds,
          },
        },
      });
      console.log('🗑️ [ASPEK API DELETE] Deleted penilaian records');
    }

    // 2. Delete all sub-elemen
    if (aspek.elemens && aspek.elemens.length > 0) {
      const elemenIds = aspek.elemens.map(e => e.id);
      await db.subElemenKompetensi.deleteMany({
        where: {
          elemenId: {
            in: elemenIds,
          },
        },
      });
      console.log('🗑️ [ASPEK API DELETE] Deleted sub-elemen records');
    }

    // 3. Delete all elemens
    if (aspek.elemens && aspek.elemens.length > 0) {
      await db.elemenKompetensi.deleteMany({
        where: {
          aspekId: id,
        },
      });
      console.log('🗑️ [ASPEK API DELETE] Deleted elemen records');
    }

    // 4. Delete the aspek
    await db.aspekPenilaian.delete({
      where: { id },
    });

    console.log('✅ [ASPEK API DELETE] Aspek deleted successfully:', id);

    return NextResponse.json({
      success: true,
      message: 'Aspek penilaian berhasil dihapus',
    });
  } catch (error) {
    console.error('❌ [ASPEK API DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus aspek penilaian' },
      { status: 500 }
    );
  }
}
