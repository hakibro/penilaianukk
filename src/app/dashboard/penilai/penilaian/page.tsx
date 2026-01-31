"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	ClipboardCheck,
	Search,
	CheckCircle,
	Save,
	RefreshCw,
	AlertCircle,
	AlertTriangle,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

interface Siswa {
	id: string;
	idperson: string;
	nama: string;
	kelasFormal: string;
	jurusan: {
		id: string;
		nama: string;
	};
}

interface Aspek {
	id: string;
	nama: string;
	elemens: Elemen[];
}

interface Elemen {
	id: string;
	nama: string;
	bobot: number;
	subElemens: SubElemen[];
}

interface SubElemen {
	id: string;
	nama: string;
}

interface Kriteria {
	id: string;
	nama: string;
	nilaiMin: number;
	nilaiMax: number;
}

export default function PenilaianPage() {
	const router = useRouter();
	const [siswas, setSiswas] = useState<Siswa[]>([]);
	const [aspeks, setAspeks] = useState<Aspek[]>([]);
	const [kriterias, setKriterias] = useState<Kriteria[]>([]);
	const [selectedSiswa, setSelectedSiswa] = useState<string>("");
	const [selectedJurusan, setSelectedJurusan] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isAlreadyAssessed, setIsAlreadyAssessed] = useState(false);
	const [isCheckingAssessment, setIsCheckingAssessment] = useState(false);

	// State Nilai
	const [elementScores, setElementScores] = useState<Record<string, number>>(
		{},
	);
	const [aspectScores, setAspectScores] = useState<Record<string, number>>({});
	const [checkedKriterias, setCheckedKriterias] = useState<
		Record<string, string>
	>({});

	// State untuk Collapsible (Buka/Tutup Rincian Elemen)
	const [openAspects, setOpenAspects] = useState<Record<string, boolean>>({});

	const [assessmentMode, setAssessmentMode] = useState<"number" | "kriteria">(
		"kriteria",
	);

	// === LOGIKA VALIDASI: Cek apakah semua aspek sudah bernilai ===
	const incompleteCount = aspeks.filter(
		(aspek) => !aspectScores[aspek.id] || aspectScores[aspek.id] === 0,
	).length;
	const isAllFilled = incompleteCount === 0;

	// Handler Toggle Collapsible
	const toggleAspek = (aspekId: string) => {
		setOpenAspects((prev) => ({
			...prev,
			[aspekId]: !prev[aspekId],
		}));
	};

	useEffect(() => {
		fetchData();

		const urlParams = new URLSearchParams(window.location.search);
		const siswaId = urlParams.get("siswaId");
		if (siswaId) {
			setSelectedSiswa(siswaId);
		}
	}, []);

	useEffect(() => {
		if (selectedSiswa) {
			const siswa = siswas.find((s) => s.id === selectedSiswa);
			if (siswa) {
				setSelectedJurusan(siswa.jurusan.id);
			}
		}
	}, [selectedSiswa, siswas]);

	const fetchData = async () => {
		try {
			const [siswaRes, kriteriaRes] = await Promise.all([
				fetch("/api/siswa"),
				fetch("/api/kriteria"),
			]);

			const siswaData = await siswaRes.json();
			const kriteriaData = await kriteriaRes.json();

			setSiswas(siswaData.siswas || []);
			setKriterias(kriteriaData.kriterias || []);
		} catch (error) {
			console.error("Failed to fetch data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (selectedJurusan) {
			fetchAspeks();
		}
	}, [selectedJurusan]);

	useEffect(() => {
		if (!selectedSiswa) return;

		const checkExistingAssessment = async () => {
			setIsCheckingAssessment(true);
			try {
				const res = await fetch(
					`/api/penilai/penilaian?siswaId=${selectedSiswa}`,
				);
				const data = await res.json();

				if (data.exists) {
					setElementScores(data.scores || {});
					// aspectScores dan checkedKriterias akan dihitung otomatis via useEffect di bawah
					setAspectScores({});
					setCheckedKriterias({});
					setIsAlreadyAssessed(true);
					toast.info("Siswa ini sudah pernah dinilai. Menampilkan nilai.");
				} else {
					setElementScores({});
					setAspectScores({});
					setCheckedKriterias({});
					setIsAlreadyAssessed(false);
				}
			} catch (error) {
				console.error("Gagal cek penilaian:", error);
			} finally {
				setIsCheckingAssessment(false);
			}
		};

		checkExistingAssessment();
	}, [selectedSiswa]);

	// === PERBAIKAN: Hitung Ulang Aspek & Kriteria dari Nilai Elemen yang Sudah Ada ===
	useEffect(() => {
		// Hanya jalankan jika data siswa dinilai DAN data aspek sudah dimuat
		if (!isAlreadyAssessed || aspeks.length === 0) return;

		const newAspectScores: Record<string, number> = {};
		const newCheckedKriterias: Record<string, string> = {};

		aspeks.forEach((aspek) => {
			let sum = 0;
			let count = 0;

			// Hitung rata-rata sederhana dari elemen di aspek ini
			aspek.elemens.forEach((elemen) => {
				const val = elementScores[elemen.id];
				if (val !== undefined && val !== null) {
					sum += val;
					count++;
				}
			});

			if (count > 0) {
				const avg = sum / count;
				newAspectScores[aspek.id] = avg;

				// Tentukan kriteria berdasarkan nilai rata-rata
				const kriteria = getKriteriaFromScore(avg);
				if (kriteria) {
					newCheckedKriterias[aspek.id] = kriteria.id;
				}
			}
		});

		setAspectScores(newAspectScores);
		setCheckedKriterias(newCheckedKriterias);
	}, [isAlreadyAssessed, elementScores, aspeks, kriterias]);

	const fetchAspeks = async () => {
		try {
			const response = await fetch(
				`/api/admin/aspek?jurusanId=${selectedJurusan}`,
			);
			const data = await response.json();
			setAspeks(data.aspeks || []);
		} catch (error) {
			console.error("Failed to fetch aspeks:", error);
		}
	};

	const filteredSiswas = siswas.filter((siswa) => {
		const matchesSearch =
			siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			siswa.idperson.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesJurusan =
			!selectedJurusan || siswa.jurusan.id === selectedJurusan;

		return matchesSearch && matchesJurusan;
	});

	const handleAspectScoreChange = (aspekId: string, value: number) => {
		setAspectScores({ ...aspectScores, [aspekId]: value });

		const kriteria = getKriteriaFromScore(value);

		if (kriteria) {
			setCheckedKriterias({
				...checkedKriterias,
				[aspekId]: kriteria.id,
			});
		} else {
			const next = { ...checkedKriterias };
			delete next[aspekId];
			setCheckedKriterias(next);
		}

		// CASCADE: Update semua nilai elemen di dalam aspek ini
		const targetAspect = aspeks.find((a) => a.id === aspekId);
		if (targetAspect) {
			setElementScores((prevScores) => {
				const newScores = { ...prevScores };
				targetAspect.elemens.forEach((elemen) => {
					newScores[elemen.id] = value;
				});
				return newScores;
			});
		}
	};

	const handleKriteriaCheck = (aspekId: string, kriteriaId: string) => {
		if (isAlreadyAssessed) return;

		const current = checkedKriterias[aspekId];

		if (current === kriteriaId) {
			const next = { ...checkedKriterias };
			delete next[aspekId];
			setCheckedKriterias(next);
			handleAspectScoreChange(aspekId, 0);
			return;
		}

		const kriteria = kriterias.find((k) => k.id === kriteriaId);
		if (!kriteria) return;

		setCheckedKriterias({
			...checkedKriterias,
			[aspekId]: kriteria.id,
		});

		const score = getScoreFromKriteria(kriteria);
		handleAspectScoreChange(aspekId, score);
	};

	// === PERBAIKAN: Sinkronisasi Nilai Elemen ke Aspek (Two-Way Binding) ===
	const handleElementScoreChange = (elemenId: string, value: number) => {
		// 1. Update Nilai Elemen
		setElementScores((prev) => ({ ...prev, [elemenId]: value }));

		// 2. Cari Aspek yang memiliki elemen ini
		const parentAspek = aspeks.find((a) =>
			a.elemens.some((e) => e.id === elemenId),
		);

		if (parentAspek) {
			// 3. Hitung rata-rata baru untuk Aspek tersebut berdasarkan semua elemennya
			let sum = 0;
			let count = 0;

			parentAspek.elemens.forEach((e) => {
				// Gunakan nilai baru jika ini elemen yang sedang diedit, gunakan nilai lama jika elemen lain
				const score = e.id === elemenId ? value : elementScores[e.id] || 0;
				if (score !== undefined) {
					sum += score;
					count++;
				}
			});

			const newAvg = count > 0 ? sum / count : 0;

			// 4. Update State Aspek Global
			setAspectScores((prev) => ({ ...prev, [parentAspek.id]: newAvg }));

			// 5. Update Kriteria berdasarkan rata-rata baru
			const kriteria = getKriteriaFromScore(newAvg);
			if (kriteria) {
				setCheckedKriterias((prev) => ({
					...prev,
					[parentAspek.id]: kriteria.id,
				}));
			} else {
				setCheckedKriterias((prev) => {
					const next = { ...prev };
					delete next[parentAspek.id];
					return next;
				});
			}
		}
	};

	const getScoreFromKriteria = (k: Kriteria) => {
		return Math.round((k.nilaiMin + k.nilaiMax) / 2);
	};

	const getKriteriaFromScore = (value: number) => {
		return kriterias.find((k) => value >= k.nilaiMin && value <= k.nilaiMax);
	};

	// === PERUBAHAN: MENGHILANGKAN BOBOT (Rata-rata Sederhana) ===
	const calculateTotalScore = () => {
		let totalScore = 0;
		let elementCount = 0;

		aspeks.forEach((aspek) => {
			aspek.elemens.forEach((elemen) => {
				// Ambil skor elemen, default ke 0
				const score = elementScores[elemen.id] || 0;
				totalScore += score;
				elementCount++; // Hitung jumlah total elemen
			});
		});

		// Kembalikan rata-rata (total skor dibagi jumlah elemen)
		return elementCount > 0 ? totalScore / elementCount : 0;
	};

	const handleSave = async () => {
		if (!selectedSiswa) {
			toast.error("Silakan pilih siswa terlebih dahulu");
			return;
		}

		// 1. Cari aspek yang belum diisi
		const firstIncompleteAspek = aspeks.find(
			(aspek) => !aspectScores[aspek.id],
		);

		if (firstIncompleteAspek) {
			// 2. Beri peringatan
			const confirm = window.confirm(
				`Masih ada aspek yang belum dinilai. Tetap simpan penilaian ini?`,
			);

			if (!confirm) {
				// 3. Auto-scroll ke aspek tersebut jika user ingin mengisi kembali
				const element = document.getElementById(
					`aspek-${firstIncompleteAspek.id}`,
				);
				if (element) {
					element.scrollIntoView({ behavior: "smooth", block: "center" });
					// Tambahkan efek kilat (highlight) sementara agar user tahu yang mana
					element.classList.add("ring-2", "ring-amber-500");
					setTimeout(
						() => element.classList.remove("ring-2", "ring-amber-500"),
						2000,
					);
				}
				return;
			}
		}

		setIsSaving(true);

		try {
			const response = await fetch("/api/penilai/penilaian", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					siswaId: selectedSiswa,
					scores: elementScores,
					totalNilai: calculateTotalScore(),
				}),
			});

			if (!response.ok) {
				throw new Error("Gagal menyimpan penilaian");
			}

			toast.success("Penilaian berhasil disimpan");

			setElementScores({});
			setAspectScores({});
			setCheckedKriterias({});
			setSelectedSiswa("");
		} catch (error: any) {
			toast.error(error.message);
		} finally {
			setIsSaving(false);
		}
	};

	const selectedSiswaData = siswas.find((s) => s.id === selectedSiswa);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Penilaian UKK</h1>
				<p className="text-muted-foreground">
					Beri penilaian global untuk aspek dan detail per elemen
				</p>
			</div>

			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>Pilih Siswa</CardTitle>
					<CardDescription>Pilih siswa yang akan dinilai</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-2 md:flex-row">
						<div className="flex items-center gap-2 flex-1">
							<Search className="h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Cari siswa berdasarkan nama atau NIS..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>

					<div className="rounded-xl border max-h-64 overflow-y-auto">
						{isLoading ? (
							<div className="p-4 space-y-2">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="h-12 rounded-lg bg-muted animate-pulse"
									/>
								))}
							</div>
						) : filteredSiswas.length === 0 ? (
							<div className="p-8 text-center text-muted-foreground">
								Tidak ada siswa yang cocok
							</div>
						) : (
							filteredSiswas.map((siswa) => (
								<button
									key={siswa.id}
									onClick={() => setSelectedSiswa(siswa.id)}
									className={`w-full p-4 text-left border-b last:border-b-0 transition-colors hover:bg-muted/50 ${
										selectedSiswa === siswa.id
											? "bg-primary/10 border-l-4 border-l-primary"
											: ""
									}`}>
									<div className="font-medium">{siswa.nama}</div>
									<div className="text-sm text-muted-foreground">
										NIS: {siswa.idperson} | Kelas: {siswa.kelasFormal}
									</div>
								</button>
							))
						)}
					</div>
				</CardContent>
			</Card>

			{selectedSiswaData && (
				<>
					<div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b py-4">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div>
								<h2 className="text-2xl font-bold">{selectedSiswaData.nama}</h2>
							</div>

							<div className="rounded-xl border bg-muted/30 p-3 text-sm">
								<p className="font-medium mb-2">Rentang Kriteria</p>
								<div className="flex items-center justify-between flex-wrap gap-2">
									{kriterias.map((k) => (
										<div
											key={k.id}
											className="flex justify-between text-muted-foreground">
											<span>
												{k.nama} ({k.nilaiMin}–{k.nilaiMax})
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>

					{isAlreadyAssessed && (
						<Alert className="border-green-500 bg-green-500/10">
							<AlertDescription className="text-green-700">
								Siswa ini sudah dinilai oleh Anda. Data ditampilkan dalam mode
								baca.
							</AlertDescription>
						</Alert>
					)}

					{aspeks.length === 0 ? (
						<Alert>
							<AlertDescription>
								Belum ada aspek penilaian untuk jurusan ini.
							</AlertDescription>
						</Alert>
					) : (
						<div className="space-y-6">
							{aspeks.map((aspek) => {
								const isAspekOpen = openAspects[aspek.id] !== false; // Default Open
								return (
									<Card
										key={aspek.id}
										id={`aspek-${aspek.id}`}
										className="rounded-2xl">
										<CardHeader>
											<div className="flex items-center justify-between">
												<div className="flex flex-col items-start gap-2">
													<CardTitle className="text-xl">
														{aspek.nama}
													</CardTitle>
													{checkedKriterias[aspek.id] && (
														<CheckCircle className="h-5 w-5 text-primary" />
													)}
													<CardDescription>
														Penilaian Global Aspek & Rincian Elemen
													</CardDescription>
												</div>
												{/* Input Nilai */}
												<div className="flex flex-col items-center justify-center min-w-[140px] pl-6 md:border-l border-slate-200">
													<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
														Nilai Aspek
													</Label>
													<div className="relative group flex-shrink-0">
														<Input
															type="number"
															min={0}
															max={100}
															value={aspectScores[aspek.id] ?? ""}
															disabled={isAlreadyAssessed}
															onChange={(e) =>
																handleAspectScoreChange(
																	aspek.id,
																	Number(e.target.value) || 0,
																)
															}
															className="w-24 text-center text-3xl font-black h-20 border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl transition-all bg-white"
														/>
														<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
															0-100
														</div>
													</div>
												</div>
											</div>
										</CardHeader>
										<CardContent className="space-y-6">
											{/* === BAGIAN 1: PENILAIAN GLOBAL ASPEK === */}
											<div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
												{/* Kiri: Kriteria (Compact Grid) */}
												<div className="inline-flex justify-between gap-2 flex-wrap w-full">
													{kriterias.map((kriteria) => {
														const active =
															checkedKriterias[aspek.id] === kriteria.id;
														return (
															<button
																key={kriteria.id}
																type="button"
																disabled={isAlreadyAssessed}
																onClick={() =>
																	handleKriteriaCheck(aspek.id, kriteria.id)
																}
																className={`flex flex-1 items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all
                  ${
										active
											? "border-primary bg-primary text-primary-foreground"
											: "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
									}`}>
																<span className="truncate">
																	{kriteria.nama}
																</span>
																{active && (
																	<CheckCircle className="h-3 w-3 flex-shrink-0" />
																)}
															</button>
														);
													})}
												</div>
											</div>

											{/* === BAGIAN 2: COLLAPSIBLE PENILAIAN PER ELEMEN === */}
											<div className="space-y-3">
												{/* Header Toggle */}
												<button
													type="button"
													onClick={() => toggleAspek(aspek.id)}
													className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group">
													<span className="font-semibold text-slate-700 text-sm">
														Rincian Nilai Per Elemen
													</span>
													{isAspekOpen ? (
														<ChevronUp className="h-5 w-5 text-slate-500 group-hover:text-slate-700 transition-transform" />
													) : (
														<ChevronDown className="h-5 w-5 text-slate-500 group-hover:text-slate-700 transition-transform" />
													)}
												</button>

												{/* Content Collapsible */}
												{isAspekOpen && (
													<div className="space-y-3 pt-1">
														{aspek.elemens.map((elemen) => (
															<div
																key={elemen.id}
																className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors gap-3">
																<div className="flex-1 space-y-1">
																	<div className="flex items-center gap-2">
																		<span className="font-medium text-slate-800">
																			{elemen.nama}
																		</span>
																	</div>

																	{elemen.subElemens.length > 0 && (
																		<div className="text-xs text-muted-foreground pl-1 space-y-1">
																			{elemen.subElemens.map((sub) => (
																				<div key={sub.id}>• {sub.nama}</div>
																			))}
																		</div>
																	)}
																</div>

																<div className="inline-flex">
																	<Input
																		type="number"
																		min={0}
																		max={100}
																		value={elementScores[elemen.id] ?? ""}
																		disabled={isAlreadyAssessed}
																		onChange={(e) =>
																			handleElementScoreChange(
																				elemen.id,
																				Number(e.target.value) || 0,
																			)
																		}
																		className="text-center font-bold text-lg"
																		placeholder="0"
																	/>
																</div>
															</div>
														))}
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}

					<Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
						<CardHeader>
							<CardTitle>Total Nilai UKK</CardTitle>
							<CardDescription>
								Rata-rata sederhana dari seluruh nilai elemen
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
								{/* SISI KIRI: Tampilan Skor */}
								<div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
									<div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center shadow-lg">
										<ClipboardCheck className="h-8 w-8 text-white" />
									</div>
									<div>
										<p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
											Skor Akhir Siswa
										</p>
										<h3 className="text-4xl font-black text-primary tracking-tight">
											{calculateTotalScore().toFixed(2)}
										</h3>
									</div>
								</div>

								{/* SISI KANAN: Status & Aksi */}
								<div className="flex flex-col gap-3">
									{/* Peringatan jika belum lengkap */}
									{!isAlreadyAssessed && !isAllFilled && (
										<div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 animate-pulse">
											<AlertCircle className="h-5 w-5 flex-shrink-0" />
											<p className="text-xs font-medium leading-tight">
												Masih ada <strong>{incompleteCount} aspek</strong> yang
												belum dinilai.
											</p>
										</div>
									)}

									{/* Tombol Simpan */}
									<Button
										onClick={handleSave}
										disabled={
											isSaving || isAlreadyAssessed || isCheckingAssessment
										}
										className={`
                    h-16 rounded-xl text-md font-bold
                    flex items-center justify-center gap-3
                    transition-all duration-300
                    ${
											!isAllFilled && !isAlreadyAssessed && !isSaving
												? "bg-slate-400 hover:bg-slate-500"
												: "bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
										}
                    focus:scale-105 focus:ring-4
                `}>
										{isAlreadyAssessed ? (
											<>
												<CheckCircle className="h-5 w-5" /> Sudah Dinilai
											</>
										) : isSaving ? (
											<>
												<RefreshCw className="h-5 w-5 animate-spin" />{" "}
												Menyimpan...
											</>
										) : (
											<>
												{isAllFilled ? (
													<Save className="h-5 w-5" />
												) : (
													<AlertTriangle className="h-5 w-5" />
												)}
												{isAllFilled
													? "Simpan Penilaian"
													: "Simpan (Belum Lengkap)"}
											</>
										)}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
