import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
	try {
		const admins = await db.adminJurusan.findMany({
			include: {
				user: true,
				jurusan: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({
			success: true,
			admins,
			total: admins.length,
		});
	} catch (error) {
		console.error("Error fetching admins:", error);
		return NextResponse.json(
			{ error: "Gagal mengambil data admin jurusan" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { name, email, password, jurusanId } = await request.json();

		if (!name || !email || !password || !jurusanId) {
			return NextResponse.json(
				{ error: "Semua field diperlukan" },
				{ status: 400 },
			);
		}
		// Create user with ADMIN_JURUSAN role
		const user = await db.user.create({
			data: {
				name,
				email,
				password: await bcrypt.hash(password, 10),
				role: "ADMIN_JURUSAN",
			},
		});

		// Create admin jurusan relation
		const adminJurusan = await db.adminJurusan.create({
			data: {
				userId: user.id,
				jurusanId,
			},
			include: {
				user: true,
				jurusan: true,
			},
		});

		return NextResponse.json({
			success: true,
			admin: adminJurusan,
		});
	} catch (error: any) {
		console.error("Error creating admin:", error);

		if (error.code === "P2002") {
			return NextResponse.json(
				{ error: "Email sudah terdaftar" },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Gagal membuat admin jurusan" },
			{ status: 500 },
		);
	}
}
