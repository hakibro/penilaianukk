// API Route for managing penilai (evaluators)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const jurusanId = searchParams.get("jurusanId");

		console.log("🔍 [PENILAI API] GET request received");
		console.log("🔍 [PENILAI API] Filter jurusanId:", jurusanId);

		const whereClause = jurusanId ? { jurusanId } : undefined;
		console.log("🔍 [PENILAI API] Where clause:", whereClause);

		const penilais = await db.penilai.findMany({
			where: whereClause,
			include: {
				jurusan: true,
				user: true,
			},
			orderBy: { createdAt: "desc" },
		});

		console.log(
			"📊 [PENILAI API] Found",
			penilais.length,
			"penilais with jurusan filter:",
			jurusanId,
		);
		console.log(
			"📊 [PENILAI API] Penilai list:",
			penilais.map((p) => ({
				id: p.id,
				nama: p.nama,
				jurusanKode: p.jurusan?.kode,
				jurusanId: p.jurusanId,
			})),
		);

		return NextResponse.json({
			success: true,
			penilais,
			total: penilais.length,
		});
	} catch (error) {
		console.error("Error fetching penilais:", error);
		return NextResponse.json(
			{ error: "Gagal mengambil data penilai" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { nama, jenis, instansi, password, email, jurusanId } =
			await request.json();

		if (!nama || !jenis || !jurusanId) {
			return NextResponse.json(
				{ error: "Nama, jenis, dan jurusan diperlukan" },
				{ status: 400 },
			);
		}

		// Email and password required for both INTERNAL and EKSTERNAL
		if (!email || !email.trim()) {
			return NextResponse.json(
				{ error: "Email diperlukan untuk penilai" },
				{ status: 400 },
			);
		}

		if (!password || !password.trim()) {
			return NextResponse.json(
				{ error: "Password diperlukan untuk penilai" },
				{ status: 400 },
			);
		}

		if (jenis === "EKSTERNAL" && !instansi) {
			return NextResponse.json(
				{ error: "Instansi diperlukan untuk penilai eksternal" },
				{ status: 400 },
			);
		}

		// Check if email already exists
		const existingUser = await db.user.findUnique({
			where: { email: email.trim() },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "Email sudah terdaftar" },
				{ status: 400 },
			);
		}

		let userId: string | null = null;

		console.log("📝 [PENILAI API] Creating user for penilai:", {
			nama,
			jenis,
			email,
			hasPassword: !!password,
		});

		try {
			const user = await db.user.create({
				data: {
					name: nama,
					email: email.trim(),
					password: await bcrypt.hash(password, 10),
					role: "PENILAI",
				},
			});
			userId = user.id;
			console.log("✅ [PENILAI API] User created successfully:", userId);
		} catch (error: any) {
			console.error("❌ [PENILAI API] Error creating user:", error);
			return NextResponse.json(
				{ error: "Gagal membuat user untuk penilai" },
				{ status: 500 },
			);
		}

		const penilai = await db.penilai.create({
			data: {
				nama,
				jenis,
				instansi: jenis === "EKSTERNAL" ? instansi : null,
				jurusanId,
				userId: userId,
			},
			include: {
				jurusan: true,
				user: true,
			},
		});

		console.log("✅ [PENILAI API] Penilai created successfully:", penilai.id);

		return NextResponse.json({
			success: true,
			penilai,
		});
	} catch (error) {
		console.error("Error creating penilai:", error);
		return NextResponse.json(
			{ error: "Gagal membuat penilai baru" },
			{ status: 500 },
		);
	}
}
