import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const user = await getUser(request);

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// =========================
		// 🧠 SUPERADMIN → semua siswa
		// =========================
		if (user.role === "SUPERADMIN") {
			const siswas = await db.siswa.findMany({
				include: {
					jurusan: true,
					_count: {
						select: {
							penilaianAspeks: true,
						},
					},
				},
				orderBy: {
					nama: "asc",
				},
			});

			return NextResponse.json({
				success: true,
				siswas,
				total: siswas.length,
			});
		}

		// =========================
		// 🧑‍🏭 PENILAI → per jurusan
		// =========================
		if (user.role === "PENILAI") {
			const penilai = await db.penilai.findFirst({
				where: { userId: user.id },
				select: {
					jurusanId: true,
				},
			});

			if (!penilai?.jurusanId) {
				return NextResponse.json(
					{ error: "Penilai belum memiliki jurusan" },
					{ status: 400 },
				);
			}

			const siswas = await db.siswa.findMany({
				where: {
					jurusanId: penilai.jurusanId,
				},
				include: {
					jurusan: true,
					_count: {
						select: {
							penilaianAspeks: true,
						},
					},
				},
				orderBy: {
					nama: "asc",
				},
			});

			return NextResponse.json({
				success: true,
				siswas,
				total: siswas.length,
			});
		}

		// =========================
		// 🚫 ROLE LAIN
		// =========================
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	} catch (error) {
		console.error("Error fetching siswas:", error);
		return NextResponse.json(
			{ error: "Gagal mengambil data siswa" },
			{ status: 500 },
		);
	}
}
