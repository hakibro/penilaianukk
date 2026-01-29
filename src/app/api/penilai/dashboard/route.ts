import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const user = await getUser(request);

		if (!user || user.role !== "PENILAI") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const penilai = await db.penilai.findFirst({
			where: { userId: user.id },
			select: {
				id: true,
				jurusanId: true,
			},
		});

		if (!penilai) {
			return NextResponse.json(
				{ error: "Penilai tidak ditemukan" },
				{ status: 404 },
			);
		}

		// 🔹 Total penilaian (per aspek)
		const totalPenilaian = await db.penilaianAspek.count({
			where: { penilaiId: penilai.id },
		});

		// 🔹 Siswa yang sudah dinilai oleh penilai ini
		const siswaSudahDinilai = await db.penilaianAspek.findMany({
			where: { penilaiId: penilai.id },
			select: { siswaId: true },
			distinct: ["siswaId"],
		});

		const siswaSudahDinilaiCount = siswaSudahDinilai.length;

		// 🔹 Total siswa jurusan penilai
		const totalSiswaJurusan = await db.siswa.count({
			where: { jurusanId: penilai.jurusanId },
		});

		const siswaPerluDinilai = totalSiswaJurusan - siswaSudahDinilaiCount;

		return NextResponse.json({
			success: true,
			data: {
				siswaPerluDinilai,
				penilaianSelesai: siswaSudahDinilaiCount,
				totalPenilaian,
			},
		});
	} catch (error) {
		console.error("Dashboard penilai error:", error);
		return NextResponse.json(
			{ error: "Gagal mengambil data dashboard" },
			{ status: 500 },
		);
	}
}
