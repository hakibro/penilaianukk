import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const user = await getUser();

		if (!user || user.role !== "PENILAI") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const siswaId = searchParams.get("siswaId");

		if (!siswaId) {
			return NextResponse.json({ error: "siswaId wajib" }, { status: 400 });
		}

		// 🔥 Ambil penilai
		const penilai = await db.penilai.findFirst({
			where: { userId: user.id },
			select: { id: true },
		});

		if (!penilai) {
			return NextResponse.json(
				{ error: "Penilai tidak ditemukan" },
				{ status: 404 },
			);
		}

		// 🔍 Ambil penilaian yang sudah ada
		const penilaian = await db.penilaianAspek.findMany({
			where: {
				siswaId,
				penilaiId: penilai.id,
			},
			select: {
				elemenId: true,
				nilai: true,
			},
		});

		if (penilaian.length === 0) {
			return NextResponse.json({
				success: true,
				exists: false,
			});
		}

		// 🔁 Ubah ke bentuk { elemenId: nilai }
		const scores = Object.fromEntries(
			penilaian.map((p) => [p.elemenId, p.nilai]),
		);

		return NextResponse.json({
			success: true,
			exists: true,
			scores,
		});
	} catch (error) {
		console.error("Error fetching penilaian:", error);
		return NextResponse.json(
			{ error: "Gagal mengambil penilaian" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getUser();

		if (!user || user.role !== "PENILAI") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { siswaId, scores, totalNilai } = await request.json();

		if (!siswaId || !scores || typeof scores !== "object") {
			return NextResponse.json(
				{ error: "Data penilaian tidak lengkap" },
				{ status: 400 },
			);
		}

		// 🔥 Ambil penilai + jurusan
		const penilai = await db.penilai.findFirst({
			where: { userId: user.id },
			select: {
				id: true,
				jurusanId: true,
			},
		});

		if (!penilai?.jurusanId) {
			return NextResponse.json(
				{ error: "Penilai tidak memiliki jurusan" },
				{ status: 400 },
			);
		}

		// 🔥 Ambil siswa + jurusan
		const siswa = await db.siswa.findUnique({
			where: { id: siswaId },
			select: {
				id: true,
				jurusanId: true,
			},
		});

		if (!siswa) {
			return NextResponse.json(
				{ error: "Siswa tidak ditemukan" },
				{ status: 404 },
			);
		}

		// 🚫 VALIDASI JURUSAN
		if (siswa.jurusanId !== penilai.jurusanId) {
			return NextResponse.json(
				{ error: "Tidak boleh menilai siswa dari jurusan lain" },
				{ status: 403 },
			);
		}

		// 🔥 Simpan penilaian PER ELEMEN
		const penilaianData = Object.entries(scores).map(([elemenId, nilai]) => ({
			siswaId,
			penilaiId: penilai.id,
			elemenId,
			nilai: Number(nilai),
		}));

		// 🚫 CEK APAKAH SUDAH PERNAH DINILAI
		const alreadyExists = await db.penilaianAspek.findFirst({
			where: {
				siswaId,
				penilaiId: penilai.id,
			},
		});

		if (alreadyExists) {
			return NextResponse.json(
				{
					error: "Siswa ini sudah pernah dinilai oleh Anda",
					code: "ALREADY_ASSESSED",
				},
				{ status: 409 },
			);
		}

		await db.penilaianAspek.createMany({
			data: penilaianData,
		});

		return NextResponse.json({
			success: true,
			message: "Penilaian berhasil disimpan",
		});
	} catch (error) {
		console.error("Error saving penilaian:", error);
		return NextResponse.json(
			{ error: "Gagal menyimpan penilaian" },
			{ status: 500 },
		);
	}
}
