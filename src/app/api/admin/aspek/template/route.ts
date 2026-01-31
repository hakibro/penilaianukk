import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
	try {
		// Get existing jurusans
		const jurusans = await db.jurusan.findMany({
			orderBy: { kode: "asc" },
		});

		// Update header dan sample data
		const templateData = [
			[
				"Nama Aspek Penilaian",
				"Nama Elemen Kompetensi",
				"Sub-Elemen (Opsional)",
			], // 'Bobot (%)' Dihapus
			[
				"Sikap Kerja",
				"Tanggung Jawab",
				"Selalu menyelesaikan tugas tepat waktu",
			],
			[
				"Sikap Kerja",
				"Tanggung Jawab",
				"Melaporkan hasil pekerjaan dengan jujur",
			],
		];

		// Create workbook
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.aoa_to_sheet(templateData);
		XLSX.utils.book_append_sheet(workbook, worksheet, "Aspek Penilaian");

		// Set column widths
		worksheet["!cols"] = [
			{ wch: 30 }, // Nama Aspek Penilaian
			{ wch: 30 }, // Nama Elemen Kompetensi
			{ wch: 50 }, // Sub-Elemen
		];

		// Generate buffer
		const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

		// Return as file
		return new NextResponse(buffer, {
			headers: {
				"Content-Type":
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition":
					'attachment; filename="template-aspek-penilaian.xlsx"',
			},
		});
	} catch (error) {
		console.error("Error generating template:", error);
		return NextResponse.json(
			{ error: "Gagal membuat template" },
			{ status: 500 },
		);
	}
}
