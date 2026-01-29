import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		const adminJurusan = await db.adminJurusan.findUnique({
			where: { id },
			include: { user: true },
		});

		if (!adminJurusan) {
			return NextResponse.json(
				{ error: "Admin tidak ditemukan" },
				{ status: 404 },
			);
		}

		// Delete admin jurusan relation
		await db.adminJurusan.delete({
			where: { id },
		});

		// Also delete the user
		await db.user.delete({
			where: { id: adminJurusan.userId },
		});

		return NextResponse.json({
			success: true,
			message: "Admin jurusan berhasil dihapus",
		});
	} catch (error: any) {
		console.error("Error deleting admin:", error);

		return NextResponse.json(
			{ error: "Gagal menghapus admin jurusan" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const { name, email, password, jurusanId } = await request.json();

		const adminJurusan = await db.adminJurusan.findUnique({
			where: { id },
		});

		if (!adminJurusan) {
			return NextResponse.json(
				{ error: "Admin tidak ditemukan" },
				{ status: 404 },
			);
		}

		// Update User dan AdminJurusan dalam satu transaksi
		await db.$transaction(async (tx) => {
			const userData: any = { name, email };

			// Hanya update password jika diisi
			if (password && password.trim() !== "") {
				userData.password = password;
			}

			await tx.user.update({
				where: { id: adminJurusan.userId },
				data: userData,
			});

			await tx.adminJurusan.update({
				where: { id },
				data: { jurusanId },
			});
		});

		return NextResponse.json({
			success: true,
			message: "Admin berhasil diperbarui",
		});
	} catch (error: any) {
		console.error("Error updating admin:", error);
		if (error.code === "P2002") {
			return NextResponse.json(
				{ error: "Email sudah digunakan" },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: "Gagal memperbarui admin" },
			{ status: 500 },
		);
	}
}
