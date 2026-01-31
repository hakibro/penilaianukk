import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import { getUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		// 1. Ambil User & Validasi Role
		const user = await getUser();

		if (!user || user.role !== "ADMIN_JURUSAN") {
			return NextResponse.json(
				{
					error:
						"Unauthorized. Hanya Admin Jurusan yang dapat melakukan impor.",
				},
				{ status: 403 },
			);
		}

		// 2. Ambil Jurusan ID dari relasi Admin Jurusan
		const adminJurusan = await db.adminJurusan.findFirst({
			where: { userId: user.id },
			select: { jurusanId: true },
		});

		if (!adminJurusan) {
			return NextResponse.json(
				{ error: "Data relasi jurusan admin tidak ditemukan" },
				{ status: 404 },
			);
		}

		// Kunci jurusanId untuk seluruh proses import ini
		const targetJurusanId = adminJurusan.jurusanId;

		// 3. Proses File Excel
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{ error: "File tidak ditemukan" },
				{ status: 400 },
			);
		}

		const arrayBuffer = await file.arrayBuffer();
		const workbook = XLSX.read(arrayBuffer, { type: "array" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const jsonData = XLSX.utils.sheet_to_json(worksheet, {
			header: 1,
		}) as any[][];

		// Data dimulai dari baris ke-2 (index 1)
		const dataRows = jsonData.slice(1);
		const aspekData: any[] = [];

		for (let i = 0; i < dataRows.length; i++) {
			const row = dataRows[i];

			// STRUKTUR BARU EXCEL:
			// Index 0: Nama Aspek
			// Index 1: Nama Elemen
			// Index 2: Nama Sub Elemen (Opsional)
			// Kode Jurusan dan Bobot sudah tidak digunakan

			const [namaAspek, namaElemen, namaSubElemen] = row;

			if (!namaAspek || !namaElemen) {
				continue; // Skip baris jika data utama kosong
			}

			// Cek apakah aspek sudah ada DI JURUSAN INI SAJA
			const existingAspek = await db.aspekPenilaian.findFirst({
				where: {
					nama: namaAspek.toString().trim(),
					jurusanId: targetJurusanId, // Filter ke jurusan user saja
				},
			});

			if (existingAspek) continue; // Skip jika aspek sudah ada

			aspekData.push({
				nama: namaAspek.toString().trim(),
				jurusanId: targetJurusanId, // Gunakan ID jurusan user
				elemen: namaElemen.toString().trim(),
				subElemen: namaSubElemen ? namaSubElemen.toString().trim() : null,
			});
		}

		// 4. Grouping Elemen dan Sub-Elemen
		const groupedAspeks = aspekData.reduce((acc: any, curr: any) => {
			const key = `${curr.nama}-${curr.jurusanId}`;
			if (!acc[key]) {
				acc[key] = {
					nama: curr.nama,
					jurusanId: curr.jurusanId,
					elemens: [],
				};
			}

			let existingElemen = acc[key].elemens.find(
				(e: any) => e.nama === curr.elemen,
			);

			if (existingElemen) {
				if (curr.subElemen) {
					existingElemen.subElemens.push({ nama: curr.subElemen });
				}
			} else {
				const elemenData: any = {
					nama: curr.elemen,
					subElemens: curr.subElemen ? [{ nama: curr.subElemen }] : [],
				};
				acc[key].elemens.push(elemenData);
			}
			return acc;
		}, {});

		const createdAspeks = [];
		const errors: string[] = [];

		// 5. Simpan ke Database
		for (const key in groupedAspeks) {
			const aspek = groupedAspeks[key];

			try {
				const created = await db.aspekPenilaian.create({
					data: {
						nama: aspek.nama,
						jurusanId: aspek.jurusanId,
						elemens: {
							create: aspek.elemens.map((e: any) => ({
								nama: e.nama,
								subElemens:
									e.subElemens.length > 0
										? {
												create: e.subElemens,
											}
										: undefined,
							})),
						},
					},
				});
				createdAspeks.push(created);
			} catch (error: any) {
				console.error(`Error creating aspek ${aspek.nama}:`, error);
				errors.push(`Aspek "${aspek.nama}": ${error.message}`);
			}
		}

		return NextResponse.json({
			success: true,
			message: `Berhasil mengimpor ${createdAspeks.length} aspek penilaian`,
			created: createdAspeks.length,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error: any) {
		console.error("Import Error:", error);
		return NextResponse.json(
			{ error: error.message || "Gagal mengimpor data" },
			{ status: 500 },
		);
	}
}
