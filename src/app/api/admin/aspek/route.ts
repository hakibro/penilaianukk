import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const user = await getUser();
		const { searchParams } = new URL(request.url);
		let jurusanId = searchParams.get("jurusanId");

		// PRIORITAS OTORITAS:
		// Jika user adalah ADMIN_JURUSAN, abaikan input URL dan paksa ke miliknya sendiri
		if (user?.role === "ADMIN_JURUSAN") {
			const adminJurusan = await db.adminJurusan.findFirst({
				where: { userId: user.id },
			});

			if (!adminJurusan) {
				// Jika dia admin tapi tidak punya relasi jurusan, kembalikan data kosong
				return NextResponse.json({ success: true, aspeks: [], total: 0 });
			}

			jurusanId = adminJurusan.jurusanId;
		}

		// Jalankan query dengan filter yang sudah divalidasi
		const aspeks = await db.aspekPenilaian.findMany({
			where: {
				// Jika superadmin dan tidak pilih jurusan, ambil semua.
				// Jika admin_jurusan, ini sudah terisi ID otomatis.
				...(jurusanId ? { jurusanId } : {}),
			},
			include: {
				elemens: {
					include: {
						subElemens: true,
					},
				},
				jurusan: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({
			success: true,
			aspeks,
			total: aspeks.length,
		});
	} catch (error) {
		console.error("Error fetching aspeks:", error);
		return NextResponse.json(
			{ error: "Gagal mengambil data aspek" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getUser();
		const body = await request.json();
		let { nama, jurusanId, elemens } = body;

		// PROTEKSI: Jika user ADMIN_JURUSAN, paksa jurusanId ke milik mereka
		if (user?.role === "ADMIN_JURUSAN") {
			const adminJurusan = await db.adminJurusan.findFirst({
				where: { userId: user.id },
			});

			if (!adminJurusan) {
				return NextResponse.json(
					{ error: "Otoritas jurusan tidak ditemukan" },
					{ status: 403 },
				);
			}

			jurusanId = adminJurusan.jurusanId;
		}

		if (!nama || !jurusanId || !elemens || !Array.isArray(elemens)) {
			return NextResponse.json(
				{ error: "Nama, jurusan, dan elemen diperlukan" },
				{ status: 400 },
			);
		}

		const aspek = await db.aspekPenilaian.create({
			data: {
				nama,
				jurusanId,
				elemens: {
					create: elemens.map((e: any) => ({
						nama: e.nama,
						subElemens:
							e.subElemens?.length > 0
								? {
										create: e.subElemens.map((se: any) => ({
											nama: typeof se === "string" ? se : se.nama,
										})),
									}
								: undefined,
					})),
				},
			},
			include: {
				elemens: {
					include: { subElemens: true },
				},
			},
		});

		return NextResponse.json({ success: true, aspek });
	} catch (error: any) {
		console.error("Error creating aspek:", error);
		return NextResponse.json(
			{ error: error.message || "Gagal membuat aspek baru" },
			{ status: 500 },
		);
	}
}
