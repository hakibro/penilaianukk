"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Download,
	ChevronDown,
	ChevronRight,
	GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface PenilaianDetail {
	aspek: string;
	elemen: string;
	bobot: number;
	nilai: number;
	nilaiBobot: number;
	penilai: string;
}

interface LaporanData {
	siswa: {
		id: string;
		nama: string;
		kelasFormal: string;
		jurusan: string;
	};
	totalNilai: number;
	kriteria: string;
	details: PenilaianDetail[];
}

export default function LaporanPage() {
	const [laporans, setLaporans] = useState<LaporanData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

	useEffect(() => {
		fetchLaporan();
	}, []);

	const fetchLaporan = async () => {
		try {
			const response = await fetch("/api/admin/laporan");
			const data = await response.json();
			setLaporans(data.laporan || []);
		} catch (error) {
			toast.error("Gagal memuat data laporan");
		} finally {
			setIsLoading(false);
		}
	};

	const toggleRow = (id: string) => {
		setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const handleExport = () => {
		if (laporans.length === 0) {
			toast.warning("Tidak ada data untuk diexport");
			return;
		}

		const workbook = XLSX.utils.book_new();

		laporans.forEach((item) => {
			// Perbaikan Type Mismatch: Menggunakan String() untuk nilai angka agar TS tidak komplain
			const content: any[][] = [
				["LAPORAN HASIL PENILAIAN UKK " + item.siswa.jurusan],
				[],
				["INFORMASI SISWA"],
				["Nama", ": " + item.siswa.nama],
				["Kelas", ": " + item.siswa.kelasFormal],
				["Jurusan", ": " + item.siswa.jurusan],
				[],
				["RINCIAN PENILAIAN"],
				[
					"No",
					"Aspek",
					"Elemen",
					"Bobot",
					"Nilai Asli",
					"Nilai Berbobot",
					"Penilai",
				],
			];

			item.details.forEach((d, index) => {
				content.push([
					(index + 1).toString(),
					d.aspek,
					d.elemen,
					d.bobot.toString(),
					d.nilai.toString(),
					d.nilaiBobot.toString(),
					d.penilai,
				]);
			});

			content.push(
				[],
				["", "", "", "", "TOTAL NILAI AKHIR", item.totalNilai.toString()],
				["", "", "", "", "KRITERIA", item.kriteria],
			);

			const worksheet = XLSX.utils.aoa_to_sheet(content);
			const wscols = [
				{ wch: 5 },
				{ wch: 20 },
				{ wch: 35 },
				{ wch: 10 },
				{ wch: 10 },
				{ wch: 15 },
				{ wch: 20 },
			];
			worksheet["!cols"] = wscols;

			const sheetName = item.siswa.nama
				.substring(0, 31)
				.replace(/[\\*?:/[\]]/g, "");
			XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
		});

		const excelBuffer = XLSX.write(workbook, {
			bookType: "xlsx",
			type: "array",
		});
		const blob = new Blob([excelBuffer], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		saveAs(blob, `Laporan_UKK_${new Date().toISOString().slice(0, 10)}.xlsx`);
		toast.success("Excel berhasil dibuat!");
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Laporan Detail</h1>
					<p className="text-muted-foreground">
						Klik baris siswa untuk melihat rincian
					</p>
				</div>
				<Button onClick={handleExport} className="rounded-xl">
					<Download className="mr-2 h-4 w-4" /> Export Excel
				</Button>
			</div>

			<Card className="rounded-2xl">
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12"></TableHead>
								<TableHead>Nama Siswa</TableHead>
								<TableHead>Kelas/Jurusan</TableHead>
								<TableHead>Nilai Akhir</TableHead>
								<TableHead>Kriteria</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-10">
										Memuat data...
									</TableCell>
								</TableRow>
							) : laporans.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center py-10 text-muted-foreground">
										Belum ada data penilaian.
									</TableCell>
								</TableRow>
							) : (
								laporans.map((laporan) => (
									<React.Fragment key={laporan.siswa.id}>
										<TableRow
											className="cursor-pointer hover:bg-muted/50"
											onClick={() => toggleRow(laporan.siswa.id)}>
											<TableCell>
												{expandedRows[laporan.siswa.id] ? (
													<ChevronDown size={18} />
												) : (
													<ChevronRight size={18} />
												)}
											</TableCell>
											<TableCell className="font-bold">
												{laporan.siswa.nama}
											</TableCell>
											<TableCell>
												{laporan.siswa.kelasFormal} - {laporan.siswa.jurusan}
											</TableCell>
											<TableCell className="text-lg font-black text-primary">
												{laporan.totalNilai}
											</TableCell>
											<TableCell>
												<span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs">
													{laporan.kriteria}
												</span>
											</TableCell>
										</TableRow>

										{expandedRows[laporan.siswa.id] && (
											<TableRow className="bg-muted/30">
												<TableCell colSpan={5} className="p-4">
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
														{laporan.details.map((detail, idx) => (
															<div
																key={`${laporan.siswa.id}-${idx}`}
																className="bg-white p-3 rounded-lg border shadow-sm">
																<p className="text-[10px] uppercase text-muted-foreground font-bold">
																	{detail.aspek}
																</p>
																<h4 className="font-semibold text-sm">
																	{detail.elemen}
																</h4>
																<div className="flex justify-between mt-2 border-t pt-2 text-xs">
																	<span>
																		Nilai: <b>{detail.nilai}</b> (x
																		{detail.bobot})
																	</span>
																	<span className="text-primary font-bold">
																		Skor: {detail.nilaiBobot}
																	</span>
																</div>
															</div>
														))}
													</div>
												</TableCell>
											</TableRow>
										)}
									</React.Fragment>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
