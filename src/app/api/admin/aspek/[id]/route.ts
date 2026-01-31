import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

// ================= PATCH =================
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }, // 1. Tambahkan Promise di sini
) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params; // 2. Tambahkan await di sini
		const body = await request.json();
		const { nama, jurusanId, elemens } = body;

		// 1. Ambil aspek
		const existingAspek = await db.aspekPenilaian.findUnique({
			where: { id },
			include: { elemens: true },
		});

		if (!existingAspek) {
			return NextResponse.json(
				{ error: "Aspek tidak ditemukan" },
				{ status: 404 },
			);
		}

		// 2. Proteksi ADMIN_JURUSAN
		let finalJurusanId = jurusanId;

		if (user.role === "ADMIN_JURUSAN") {
			const adminJurusan = await db.adminJurusan.findFirst({
				where: { userId: user.id },
			});

			if (!adminJurusan) {
				return NextResponse.json(
					{ error: "Otoritas jurusan tidak ditemukan" },
					{ status: 403 },
				);
			}

			if (existingAspek.jurusanId !== adminJurusan.jurusanId) {
				return NextResponse.json(
					{ error: "Tidak memiliki akses ke aspek ini" },
					{ status: 403 },
				);
			}

			finalJurusanId = adminJurusan.jurusanId; // 🔒 override
		}

		// 3. Transaction update
		const updatedAspek = await db.$transaction(async (tx) => {
			await tx.aspekPenilaian.update({
				where: { id },
				data: {
					nama,
					jurusanId: finalJurusanId,
				},
			});

			const oldElemenIds = existingAspek.elemens.map((e) => e.id);

			await tx.subElemenKompetensi.deleteMany({
				where: { elemenId: { in: oldElemenIds } },
			});

			await tx.elemenKompetensi.deleteMany({
				where: { aspekId: id },
			});

			return tx.aspekPenilaian.update({
				where: { id },
				data: {
					elemens: {
						create: elemens.map((e: any) => ({
							nama: e.nama,
							subElemens:
								e.subElemens?.length > 0
									? {
											create: e.subElemens.map((se: any) => ({
												nama: se.nama,
											})),
										}
									: undefined,
						})),
					},
				},
				include: {
					elemens: { include: { subElemens: true } },
				},
			});
		});

		return NextResponse.json({
			success: true,
			message: "Aspek berhasil diperbarui",
			aspek: updatedAspek,
		});
	} catch (error: any) {
		console.error("[PATCH ASPEK]", error);
		return NextResponse.json(
			{ error: error.message || "Gagal memperbarui aspek" },
			{ status: 500 },
		);
	}
}

// ================= DELETE =================
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }, // 1. Gunakan Promise
) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params; // 2. Wajib di-await

		const aspek = await db.aspekPenilaian.findUnique({
			where: { id },
			include: { elemens: true },
		});

		if (!aspek) {
			return NextResponse.json(
				{ error: "Aspek tidak ditemukan" },
				{ status: 404 },
			);
		}

		// 🔐 Proteksi ADMIN_JURUSAN
		if (user.role === "ADMIN_JURUSAN") {
			const adminJurusan = await db.adminJurusan.findFirst({
				where: { userId: user.id },
			});

			if (!adminJurusan || aspek.jurusanId !== adminJurusan.jurusanId) {
				return NextResponse.json(
					{ error: "Tidak memiliki akses ke aspek ini" },
					{ status: 403 },
				);
			}
		}

		// Proteksi jika sudah dipakai penilaian
		const elemenIds = aspek.elemens.map((e) => e.id);
		if (elemenIds.length > 0) {
			const count = await db.penilaianAspek.count({
				where: { elemenId: { in: elemenIds } },
			});

			if (count > 0) {
				return NextResponse.json(
					{
						error: "Aspek tidak dapat dihapus karena sudah memiliki data nilai",
					},
					{ status: 400 },
				);
			}
		}

		await db.subElemenKompetensi.deleteMany({
			where: { elemenId: { in: elemenIds } },
		});
		await db.elemenKompetensi.deleteMany({ where: { aspekId: id } });
		await db.aspekPenilaian.delete({ where: { id } });

		return NextResponse.json({
			success: true,
			message: "Aspek berhasil dihapus",
		});
	} catch (error) {
		console.error("[DELETE ASPEK]", error);
		return NextResponse.json(
			{ error: "Gagal menghapus aspek" },
			{ status: 500 },
		);
	}
}
