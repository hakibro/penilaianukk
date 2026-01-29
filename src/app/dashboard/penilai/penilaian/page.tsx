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

	const [scores, setScores] = useState<Record<string, number>>({});
	const [checkedKriterias, setCheckedKriterias] = useState<
		Record<string, string>
	>({});
	const [assessmentMode, setAssessmentMode] = useState<"number" | "kriteria">(
		"kriteria",
	);

	useEffect(() => {
		fetchData();

		// Check if siswaId is in query params
		const urlParams = new URLSearchParams(window.location.search);
		const siswaId = urlParams.get("siswaId");
		if (siswaId) {
			setSelectedSiswa(siswaId);
		}
	}, []);

	// When a student is selected, set the jurusan
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
					setScores(data.scores || {});
					setIsAlreadyAssessed(true);
					toast.info("Siswa ini sudah pernah dinilai. Menampilkan nilai.");
				} else {
					setScores({});
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

	const handleScoreChange = (elemenId: string, value: number) => {
		setScores({ ...scores, [elemenId]: value });

		const kriteria = getKriteriaFromScore(value);

		if (kriteria) {
			setCheckedKriterias({
				...checkedKriterias,
				[elemenId]: kriteria.id,
			});
		} else {
			const next = { ...checkedKriterias };
			delete next[elemenId];
			setCheckedKriterias(next);
		}
	};

	const getScoreFromKriteria = (k: Kriteria) => {
		// ambil nilai tengah dari range kriteria
		return Math.round((k.nilaiMin + k.nilaiMax) / 2);
	};

	const getKriteriaFromScore = (value: number) => {
		return kriterias.find((k) => value >= k.nilaiMin && value <= k.nilaiMax);
	};

	const handleKriteriaCheck = (elemenId: string, kriteriaId: string) => {
		if (isAlreadyAssessed) return;

		const current = checkedKriterias[elemenId];

		// toggle
		if (current === kriteriaId) {
			const next = { ...checkedKriterias };
			delete next[elemenId];
			setCheckedKriterias(next);
			return;
		}

		const kriteria = kriterias.find((k) => k.id === kriteriaId);
		if (!kriteria) return;

		setCheckedKriterias({
			...checkedKriterias,
			[elemenId]: kriteriaId,
		});

		setScores({
			...scores,
			[elemenId]: getScoreFromKriteria(kriteria),
		});
	};

	const calculateTotalScore = () => {
		let total = 0;
		let totalBobot = 0;

		aspeks.forEach((aspek) => {
			aspek.elemens.forEach((elemen) => {
				const score = scores[elemen.id] || 0;
				total += score * elemen.bobot;
				totalBobot += elemen.bobot;
			});
		});

		return totalBobot > 0 ? total / totalBobot : 0;
	};

	const handleSave = async () => {
		if (!selectedSiswa) {
			toast.error("Silakan pilih siswa terlebih dahulu");
			return;
		}

		setIsSaving(true);

		try {
			const response = await fetch("/api/penilai/penilaian", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					siswaId: selectedSiswa,
					scores,
					totalNilai: calculateTotalScore(),
				}),
			});

			if (!response.ok) {
				throw new Error("Gagal menyimpan penilaian");
			}

			toast.success("Penilaian berhasil disimpan");

			// Reset form
			setScores({});
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
					Beri penilaian untuk siswa yang ujian
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
					{/* STICKY HEADER */}
					<div
						className="
        sticky top-0 z-10
        bg-background/95 backdrop-blur
        border-b
        py-4
      ">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							{/* Info Siswa */}
							<div>
								<h2 className="text-2xl font-bold">{selectedSiswaData.nama}</h2>
							</div>

							<div className="rounded-xl border bg-muted/30 p-3 text-sm">
								<p className="font-medium mb-2">Kriteria Penilaian</p>

								<div className="flex items-center justify-between flex-wrap">
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
								Belum ada aspek penilaian untuk jurusan ini. Silakan hubungi
								admin jurusan.
							</AlertDescription>
						</Alert>
					) : (
						<div className="space-y-6">
							{aspeks.map((aspek) => (
								<Card key={aspek.id} className="rounded-2xl">
									<CardHeader>
										<CardTitle>{aspek.nama}</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{aspek.elemens.map((elemen) => (
											<Card key={elemen.id} className="rounded-xl">
												{/* ===== HEADER ===== */}
												<CardHeader className="pb-4 space-y-2">
													{/* Title row */}
													<div className="flex items-start justify-between gap-4">
														<CardTitle className="text-base sm:text-lg leading-tight">
															{elemen.nama}
														</CardTitle>

														<span className="text-sm text-muted-foreground whitespace-nowrap">
															Bobot {elemen.bobot}%
														</span>
													</div>

													{/* Description: Sub Elements */}
													{elemen.subElemens.length > 0 && (
														<CardDescription className="space-y-1">
															{elemen.subElemens.map((subElemen) => (
																<div
																	key={subElemen.id}
																	className="flex items-center gap-2">
																	<CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
																	<span className="text-sm">
																		{subElemen.nama}
																	</span>
																</div>
															))}
														</CardDescription>
													)}
												</CardHeader>

												{/* ===== CONTENT ===== */}
												<CardContent>
													<div
														className="grid grid-cols-1
      grid-cols-[1fr_120px]
      gap-6
      items-stretch">
														{/* KIRI: Kriteria */}
														<div className="space-y-3">
															{assessmentMode === "kriteria" && (
																<div className="space-y-2">
																	<Label className="text-sm font-medium text-muted-foreground">
																		Pilih Kriteria
																	</Label>

																	<div className="grid sm:grid-cols-2 gap-2">
																		{kriterias.map((kriteria) => {
																			const active =
																				checkedKriterias[elemen.id] ===
																				kriteria.id;

																			return (
																				<button
																					key={kriteria.id}
																					type="button"
																					disabled={isAlreadyAssessed}
																					onClick={() =>
																						handleKriteriaCheck(
																							elemen.id,
																							kriteria.id,
																						)
																					}
																					className={`
                    rounded-xl border px-3 py-2 text-sm
                    flex items-center justify-between
                    transition
                    ${
											active
												? "border-primary bg-primary/10 text-primary"
												: "hover:bg-muted/50"
										}
                  `}>
																					<span>{kriteria.nama}</span>
																					{active && (
																						<CheckCircle className="h-4 w-4" />
																					)}
																				</button>
																			);
																		})}
																	</div>
																</div>
															)}
														</div>

														{/* KANAN: Input Nilai */}
														<div className="flex h-full flex-col items-center justify-center gap-1 ">
															<p className="text-sm font-semibold text-muted-foreground mb-2">
																Input Nilai
															</p>
															<Input
																type="number"
																min={0}
																max={100}
																value={scores[elemen.id] ?? ""}
																disabled={isAlreadyAssessed}
																onChange={(e) =>
																	handleScoreChange(
																		elemen.id,
																		Number(e.target.value) || 0,
																	)
																}
																className={`
          w-24 sm:w-28 text-center text-4xl font-bold h-20 rounded-2xl border-2 transition 
          ${
						checkedKriterias[elemen.id]
							? "border-blue ring-2 ring-blue/30"
							: "border-blue-300"
					}
        `}
															/>

															{checkedKriterias[elemen.id] && (
																<p className="text-[11px] text-muted-foreground">
																	Otomatis dari kriteria
																</p>
															)}
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</CardContent>
								</Card>
							))}
						</div>
					)}

					<Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
						<CardHeader>
							<CardTitle>Total Nilai</CardTitle>
							<CardDescription>Nilai akhir penilaian UKK</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-6 items-center">
								{/* TOTAL NILAI */}
								<div className="text-6xl font-bold text-primary leading-none">
									{calculateTotalScore().toFixed(2)}
								</div>

								{/* AKSI */}
								<Button
									onClick={handleSave}
									disabled={
										isSaving || isAlreadyAssessed || isCheckingAssessment
									}
									className="
      h-20
      rounded-2xl
      text-lg font-semibold
      flex items-center justify-center gap-3
      focus:scale-105 focus:ring-4
    ">
									{isAlreadyAssessed ? (
										<>
											<CheckCircle className="h-6 w-6" />
											Sudah Dinilai
										</>
									) : isSaving ? (
										<>
											<RefreshCw className="h-6 w-6 animate-spin" />
											Menyimpan...
										</>
									) : (
										<>
											<Save className="h-6 w-6" />
											Simpan Penilaian
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
