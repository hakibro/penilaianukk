import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Parse kode jurusan dari format KelasFormal: "(XII) (jurusanCode) angka"
// Contoh: "(XII) (DPIB) 1" -> "DPIB"
// Contoh: "(XII) (TKJ) 2" -> "TKJ"
// Contoh: "(XII) (TSM) 1" -> "TSM"
const getJurusanKodeFromKelas = (kelas: string): string | null => {
	if (!kelas) return null;

	// Regex ini akan mengambil kata pertama setelah "XII"
	// Contoh: "XII DPIB -" -> Match: "DPIB"
	// Contoh: "(XII) (DPIB) 1" -> Match: "DPIB"
	const match = kelas.match(/XII\s*\(?([A-Z]+)\)?/i);

	if (match && match[1]) {
		const kode = match[1].trim().toUpperCase();
		console.log(
			`✅ [JURUSAN PARSER] Berhasil ekstrak: "${kode}" dari "${kelas}"`,
		);
		return kode;
	}

	console.warn(`⚠️ [JURUSAN PARSER] Gagal ekstrak dari: "${kelas}"`);
	return null;
};

export async function POST(request: NextRequest) {
	try {
		console.log("Starting siswa import...");

		// Create timeout controller
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

		// Fetch data from external API with timeout
		const response = await fetch(
			"https://api.daruttaqwa.or.id/sisda/v1/siswa",
			{
				signal: controller.signal,
			},
		);

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(
				`Gagal mengambil data dari API eksternal: ${response.status}`,
			);
		}

		const result = await response.json();
		console.log("API response:", {
			responseCode: result.responseCode,
			dataCount: result.data?.length,
		});

		// Data is in result.data property
		const siswaList = Array.isArray(result.data) ? result.data : [];

		// Get all jurusans from database
		const jurusans = await db.jurusan.findMany();
		const jurusanMap = new Map(jurusans.map((j) => [j.kode, j.id]));
		console.log(
			"✅ Available jurusans in database:",
			jurusans.map((j) => ({ kode: j.kode, id: j.id, nama: j.nama })),
		);
		console.log("📊 JurusanMap keys:", Array.from(jurusanMap.keys()));

		let imported = 0;
		let skipped = 0;
		let notMatched = 0;
		let deleted = 0;
		const unmatchedJurusans: Record<string, string[]> = {};
		const importedIdpersons = new Set<string>();

		for (const siswaData of siswaList) {
			// Filter for SMK and class XII only
			if (
				siswaData.UnitFormal !== "SMK" ||
				!siswaData.KelasFormal?.includes("XII")
			) {
				skipped++;
				continue;
			}

			const jurusanKode = getJurusanKodeFromKelas(siswaData.KelasFormal);

			if (!jurusanKode) {
				console.warn(
					`❌ Cannot extract jurusan kode from kelas "${siswaData.KelasFormal}" for siswa: ${siswaData.nama}`,
				);
				notMatched++;
				skipped++;
				continue;
			}

			const jurusanId = jurusanMap.get(jurusanKode);

			if (!jurusanId) {
				console.warn(
					`❌ Jurusan NOT FOUND in database: "${jurusanKode}" (from kelas "${siswaData.KelasFormal}") for siswa: ${siswaData.nama}`,
				);
				notMatched++;
				skipped++;

				// Track unmatched jurusans for summary
				if (!unmatchedJurusans[jurusanKode]) {
					unmatchedJurusans[jurusanKode] = [];
				}
				unmatchedJurusans[jurusanKode].push(
					`${siswaData.nama} (${siswaData.KelasFormal})`,
				);

				continue;
			}

			// Log successful match for first few students
			if (imported < 5) {
				console.log(
					`✅ Matched: ${siswaData.nama} -> ${jurusanKode} (${jurusanId}) from kelas: ${siswaData.KelasFormal}`,
				);
			}

			// Track idperson for deletion later
			importedIdpersons.add(siswaData.idperson);

			// Check if siswa already exists
			const existingSiswa = await db.siswa.findUnique({
				where: { idperson: siswaData.idperson },
			});

			if (existingSiswa) {
				// Update existing siswa data and jurusan
				await db.siswa.update({
					where: { id: existingSiswa.id },
					data: {
						nama: siswaData.nama,
						gender: siswaData.gender || "L",
						lahirTempat: siswaData.lahirtempat || "",
						lahirTanggal: siswaData.lahirtanggal || "",
						phone: siswaData.phone || "",
						idkelasFormal: siswaData.idkelasFormal || "",
						kelasFormal: siswaData.KelasFormal || "",
						asramaPondok: siswaData.AsramaPondok || "",
						kamarPondok: siswaData.KamarPondok || "",
						tingkatDiniyah: siswaData.TingkatDiniyah || "",
						kelasDiniyah: siswaData.KelasDiniyah || "",
						siswaStatus: siswaData.siswa_status || "1",
						personStatus: siswaData.person_status || "1",
						jurusanId, // Update jurusanId to match current jurusan
					},
				});
				console.log(`✅ Updated siswa: ${siswaData.nama} -> ${jurusanKode}`);
				imported++;
			} else {
				// Create new siswa
				await db.siswa.create({
					data: {
						idperson: siswaData.idperson,
						nama: siswaData.nama,
						gender: siswaData.gender || "L",
						lahirTempat: siswaData.lahirtempat || "",
						lahirTanggal: siswaData.lahirtanggal || "",
						phone: siswaData.phone || "",
						idkelasFormal: siswaData.idkelasFormal || "",
						kelasFormal: siswaData.KelasFormal || "",
						asramaPondok: siswaData.AsramaPondok || "",
						kamarPondok: siswaData.KamarPondok || "",
						tingkatDiniyah: siswaData.TingkatDiniyah || "",
						kelasDiniyah: siswaData.KelasDiniyah || "",
						siswaStatus: siswaData.siswa_status || "1",
						personStatus: siswaData.person_status || "1",
						jurusanId,
					},
				});
				console.log(`✅ Created siswa: ${siswaData.nama} -> ${jurusanKode}`);
				imported++;
			}
		}

		console.log(
			`📦 Import completed: ${imported} imported, ${skipped} skipped, ${notMatched} not matched`,
		);

		// Log unmatched jurusans summary
		if (Object.keys(unmatchedJurusans).length > 0) {
			console.log("⚠️ Unmatched jurusans summary:");
			for (const [kode, students] of Object.entries(unmatchedJurusans)) {
				console.log(
					`  - ${kode}: ${students.length} students (sample: ${students.slice(0, 3).join(", ")}${students.length > 3 ? "..." : ""})`,
				);
			}
		}

		// Delete siswa that are not in API anymore (kelas XII only)
		console.log("🗑️ Starting deletion of siswa not in API...");
		const siswaToDelete = await db.siswa.findMany({
			where: {
				kelasFormal: {
					contains: "XII",
				},
				idperson: {
					notIn: Array.from(importedIdpersons),
				},
			},
			select: {
				id: true,
				idperson: true,
				nama: true,
				kelasFormal: true,
			},
		});

		if (siswaToDelete.length > 0) {
			console.log(
				`🔍 Found ${siswaToDelete.length} siswa to delete that are not in API`,
			);

			// Delete penilaianAspek for these students first (cascade delete)
			const siswaIds = siswaToDelete.map((s) => s.id);
			await db.penilaianAspek.deleteMany({
				where: {
					siswaId: {
						in: siswaIds,
					},
				},
			});

			// Delete the students
			await db.siswa.deleteMany({
				where: {
					id: {
						in: siswaIds,
					},
				},
			});

			deleted = siswaToDelete.length;
			console.log(`✅ Deleted ${deleted} siswa:`);
			siswaToDelete.forEach((s, i) => {
				if (i < 5) {
					console.log(`   - ${s.nama} (${s.idperson}) - ${s.kelasFormal}`);
				}
			});
			if (siswaToDelete.length > 5) {
				console.log(`   ... and ${siswaToDelete.length - 5} more`);
			}
		} else {
			console.log("✅ No siswa to delete - database is in sync with API");
		}

		console.log(
			`📊 Final summary: ${imported} imported, ${skipped} skipped, ${notMatched} not matched, ${deleted} deleted`,
		);

		return NextResponse.json({
			success: true,
			imported,
			skipped,
			notMatched,
			deleted,
			unmatchedJurusans,
			message: `Berhasil mengimpor ${imported} siswa. ${skipped} dilewati. ${notMatched} tidak ter-assign jurusan. ${deleted} dihapus (tidak ada di API).`,
		});
	} catch (error: any) {
		console.error("Error importing siswas:", error);
		return NextResponse.json(
			{ error: error.message || "Gagal mengimpor data siswa" },
			{ status: 500 },
		);
	}
}
