import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let whereClause: any = {};

		// LOGIKA FILTER BERDASARKAN ROLE
		if (user.role === "ADMIN_JURUSAN") {
			// Menggunakan logika yang sama dengan jurusan-mine/route.ts
			const adminJurusan = await db.adminJurusan.findFirst({
				where: {
					userId: user.id,
				},
			});

			if (!adminJurusan) {
				console.log(
					`❌ Laporan: Admin ${user.id} tidak memiliki data di tabel adminJurusan`,
				);
				return NextResponse.json(
					{ error: "Akses jurusan tidak ditemukan" },
					{ status: 403 },
				);
			}

			console.log(`✅ Laporan: Admin untuk jurusan ${adminJurusan.jurusanId}`);

			// Filter: Hanya ambil penilaian dari siswa yang memiliki jurusanId tersebut
			whereClause = {
				siswa: {
					jurusanId: adminJurusan.jurusanId,
				},
			};
		} else if (user.role === "PENILAI") {
			// Jika penilai juga mengakses ini, batasi hanya penilaian yang dia buat
			whereClause = { penilaiId: user.id };
		}
		// Jika SUPERADMIN, whereClause tetap kosong {} (ambil semua)

		// Ambil data penilaian
		const penilaian = await db.penilaianAspek.findMany({
			where: whereClause,
			include: {
				siswa: {
					include: { jurusan: true },
				},
				penilai: true,
				elemen: {
					include: { aspek: true },
				},
			},
			orderBy: { createdAt: "asc" },
		});

		console.log(`📊 Ditemukan ${penilaian.length} data penilaian`);

		// Proses Grouping Data (StudentMap)
		const studentMap = new Map<string, any>();

		penilaian.forEach((p) => {
			const siswaId = p.siswaId;
			if (!studentMap.has(siswaId)) {
				studentMap.set(siswaId, {
					siswa: p.siswa,
					totalNilaiBobot: 0,
					totalBobot: 0,
					details: [],
				});
			}

			const data = studentMap.get(siswaId);
			const bobot = p.elemen?.bobot ?? 1;
			const nilaiBobot = p.nilai * bobot;

			data.totalNilaiBobot += nilaiBobot;
			data.totalBobot += bobot;

			data.details.push({
				aspek: p.elemen.aspek.nama,
				elemen: p.elemen.nama,
				bobot: bobot,
				nilai: p.nilai,
				nilaiBobot: nilaiBobot,
				penilai: p.penilai.nama,
			});
		});

		const kriterias = await db.kriteriaPenilaian.findMany({
			orderBy: { nilaiMin: "asc" },
		});

		const laporan = Array.from(studentMap.values()).map((data) => {
			const nilaiAkhir =
				data.totalBobot > 0 ? data.totalNilaiBobot / data.totalBobot : 0;
			const nilaiFinal = Number(nilaiAkhir.toFixed(2));
			const kriteria = kriterias.find(
				(k) => nilaiFinal >= k.nilaiMin && nilaiFinal <= k.nilaiMax,
			);

			return {
				siswa: {
					id: data.siswa.id,
					nama: data.siswa.nama,
					kelasFormal: data.siswa.kelasFormal,
					jurusan: data.siswa.jurusan.nama,
				},
				totalNilai: nilaiFinal,
				kriteria: kriteria?.nama ?? "Belum Dinilai",
				details: data.details,
			};
		});

		return NextResponse.json({ success: true, laporan });
	} catch (error: any) {
		console.error("Laporan API Error:", error);
		return NextResponse.json(
			{ error: "Gagal mengambil laporan", details: error.message },
			{ status: 500 },
		);
	}
}
