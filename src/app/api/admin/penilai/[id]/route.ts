import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * PUT endpoint to update an existing penilai
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const { nama, jenis, instansi, password, email, jurusanId } =
			await request.json();

		console.log("📝 [PENILAI API UPDATE] Updating penilai:", id);
		console.log("📝 [PENILAI API UPDATE] Data received:", {
			nama,
			jenis,
			instansi,
			email,
			hasPassword: !!password,
			jurusanId,
		});

		if (!nama || !jenis || !jurusanId) {
			return NextResponse.json(
				{ error: "Nama, jenis, dan jurusan diperlukan" },
				{ status: 400 },
			);
		}

		// Find existing penilai
		const penilai = await db.penilai.findUnique({
			where: { id },
			include: { user: true },
		});

		if (!penilai) {
			return NextResponse.json(
				{ error: "Penilai tidak ditemukan" },
				{ status: 404 },
			);
		}

		console.log("✅ [PENILAI API UPDATE] Penilai found:", penilai.id);

		// If email is provided and it's different from current email
		if (email && email.trim() && email.trim() !== penilai.user?.email) {
			// Check if new email already exists
			const existingUser = await db.user.findUnique({
				where: { email: email.trim() },
			});

			if (existingUser && existingUser.id !== penilai.userId) {
				return NextResponse.json(
					{ error: "Email sudah terdaftar" },
					{ status: 400 },
				);
			}
		}

		// Update penilai data
		const updateData: any = {
			nama,
			jenis,
			jurusanId,
		};

		// Update instansi if provided (for EKSTERNAL)
		if (jenis === "EKSTERNAL") {
			updateData.instansi = instansi;
		}

		// Update user data if penilai has a user
		if (penilai.userId) {
			const userData: any = {};

			if (email && email.trim()) {
				userData.email = email.trim();
			}

			if (password && password.trim() !== "") {
				userData.password = await bcrypt.hash(password, 10);
			}

			if (Object.keys(userData).length > 0) {
				console.log(
					"🔐 [PENILAI API UPDATE] Updating user data for:",
					penilai.userId,
				);
				await db.user.update({
					where: { id: penilai.userId },
					data: userData,
				});
				console.log("✅ [PENILAI API UPDATE] User data updated");
			}
		}

		// If penilai has no user but email is provided, create one
		if (!penilai.userId && email && email.trim() && password) {
			console.log("👤 [PENILAI API UPDATE] Creating new user for penilai:", id);

			const user = await db.user.create({
				data: {
					name: nama,
					email: email.trim(),
					password: await bcrypt.hash(password, 10),
					role: "PENILAI",
				},
			});

			// Link the user to penilai
			updateData.userId = user.id;
			console.log("✅ [PENILAI API UPDATE] User created and linked:", user.id);
		}

		console.log(
			"📝 [PENILAI API UPDATE] Updating penilai with data:",
			updateData,
		);

		await db.penilai.update({
			where: { id },
			data: updateData,
		});

		// Fetch updated penilai
		const updatedPenilai = await db.penilai.findUnique({
			where: { id },
			include: {
				jurusan: true,
				user: true,
			},
		});

		console.log("✅ [PENILAI API UPDATE] Penilai updated successfully:", id);

		return NextResponse.json({
			success: true,
			penilai: updatedPenilai,
		});
	} catch (error: any) {
		console.error("❌ [PENILAI API UPDATE] Error updating penilai:", error);
		return NextResponse.json(
			{ error: error.message || "Gagal mengupdate penilai" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const { searchParams } = new URL(request.url);
		const forceDelete = searchParams.get("force") === "true";

		// 1. Cek keberadaan penilai DAN ambil userId-nya
		const penilai = await db.penilai.findUnique({
			where: { id },
			select: {
				userId: true, // Kita butuh ini untuk hapus di tabel User
				_count: {
					select: { penilaianAspeks: true },
				},
			},
		});

		if (!penilai) {
			return NextResponse.json(
				{ error: "Penilai tidak ditemukan" },
				{ status: 404 },
			);
		}

		// 2. Validasi data penilaian
		if (penilai._count.penilaianAspeks > 0 && !forceDelete) {
			return NextResponse.json(
				{
					error: "HAS_DATA",
					message: `Penilai ini memiliki ${penilai._count.penilaianAspeks} data penilaian.`,
				},
				{ status: 400 },
			);
		}

		// 3. Eksekusi Penghapusan (Transaksi)
		await db.$transaction(async (tx) => {
			if (forceDelete) {
				// Hapus data detail penilaian
				await tx.penilaianKriteria.deleteMany({
					where: { penilaiId: id },
				});

				await tx.penilaianAspek.deleteMany({
					where: { penilaiId: id },
				});
			}

			// A. Hapus data utama Penilai
			await tx.penilai.delete({
				where: { id },
			});

			// B. Hapus data User jika penilai ini terhubung ke akun user
			if (penilai.userId) {
				await tx.user.delete({
					where: { id: penilai.userId },
				});
			}
		});

		return NextResponse.json({
			success: true,
			message: forceDelete
				? "Penilai, User, dan semua data terkait berhasil dihapus"
				: "Penilai dan akun User berhasil dihapus",
		});
	} catch (error: any) {
		console.error("Error deleting penilai:", error);
		return NextResponse.json(
			{ error: "Gagal menghapus data secara permanen" },
			{ status: 500 },
		);
	}
}
