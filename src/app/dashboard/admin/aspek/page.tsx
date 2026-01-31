"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	BookOpen,
	Plus,
	Trash2,
	ChevronRight,
	X,
	Upload,
	Download,
	Pencil,
} from "lucide-react";
import { toast } from "sonner";

// --- INTERFACES ---
interface Jurusan {
	id: string;
	nama: string;
	kode: string;
}

interface AdminJurusan {
	id: string;
	userId: string;
	jurusanId: string;
	jurusan: Jurusan;
}

interface SubElemen {
	id: string;
	nama: string;
	elemenId: string;
}

interface Elemen {
	id: string;
	nama: string;
	aspekId: string;
	subElemens?: SubElemen[];
}

interface Aspek {
	id: string;
	nama: string;
	jurusanId: string;
	jurusan: Jurusan;
	elemens: Elemen[];
}

interface ElemenForm {
	id: string;
	nama: string;
	subElemens: string[];
}

export default function AspekPage() {
	const [aspeks, setAspeks] = useState<Aspek[]>([]);
	const [jurusans, setJurusans] = useState<Jurusan[]>([]);
	const [adminJurusan, setAdminJurusan] = useState<AdminJurusan | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [importFile, setImportFile] = useState<File | null>(null);

	// --- STATE BARU UNTUK EDIT ---
	const [editingId, setEditingId] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		nama: "",
		jurusanId: "",
	});

	const [elemens, setElemens] = useState<ElemenForm[]>([
		{ id: "1", nama: "", subElemens: [] },
	]);

	useEffect(() => {
		if (adminJurusan) {
			setFormData((prev) => ({ ...prev, jurusanId: adminJurusan.jurusanId }));
		}
	}, [adminJurusan]);

	useEffect(() => {
		const initPage = async () => {
			setIsLoading(true);
			await fetchAdminJurusan();
			await fetchJurusans();
		};
		initPage();
	}, []);

	useEffect(() => {
		fetchAspeks();
	}, [adminJurusan]);

	const fetchAdminJurusan = async () => {
		try {
			const response = await fetch("/api/admin/jurusan-mine");
			if (response.ok) {
				const data = await response.json();
				setAdminJurusan(data);
				setFormData((prev) => ({ ...prev, jurusanId: data.jurusanId }));
			} else {
				setAdminJurusan(null);
			}
		} catch (error) {
			console.error("Failed to fetch admin jurusan:", error);
			setAdminJurusan(null);
		}
	};

	const fetchAspeks = async () => {
		setIsLoading(true);
		try {
			let url = "/api/admin/aspek";
			if (adminJurusan?.jurusanId) {
				url += `?jurusanId=${adminJurusan.jurusanId}`;
			}

			const response = await fetch(url);
			const data = await response.json();
			setAspeks(data.aspeks || []);
		} catch (error) {
			toast.error("Gagal memuat data aspek");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchJurusans = async () => {
		try {
			const response = await fetch("/api/jurusan");
			const data = await response.json();
			setJurusans(data.jurusans || []);
		} catch (error) {
			toast.error("Gagal memuat data jurusan");
		}
	};

	// --- LOGIKA EDIT ---
	const handleEdit = (aspek: Aspek) => {
		setEditingId(aspek.id);
		setFormData({
			nama: aspek.nama,
			// Jika Admin Jurusan, paksa ID sesuai session. Jika Superadmin, pakai ID aspek.
			jurusanId: adminJurusan?.jurusanId || aspek.jurusanId,
		});

		const mappedElemens = aspek.elemens.map((e) => ({
			id: e.id,
			nama: e.nama,
			subElemens: e.subElemens?.map((se) => se.nama) || [],
		}));

		setElemens(mappedElemens);
		setIsDialogOpen(true);
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const addElemen = () => {
		setElemens((prev) => [
			...prev,
			{ id: Date.now().toString(), nama: "", subElemens: [] },
		]);
	};

	const removeElemen = (id: string) => {
		if (elemens.length === 1) {
			toast.error("Minimal satu elemen harus ada");
			return;
		}
		setElemens((prev) => prev.filter((e) => e.id !== id));
	};

	const updateElemen = (id: string, field: keyof ElemenForm, value: string) => {
		setElemens((prev) =>
			prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
		);
	};

	const addSubElemen = (elemenId: string) => {
		setElemens((prev) =>
			prev.map((e) =>
				e.id === elemenId ? { ...e, subElemens: [...e.subElemens, ""] } : e,
			),
		);
	};

	const removeSubElemen = (elemenId: string, index: number) => {
		setElemens((prev) =>
			prev.map((e) =>
				e.id === elemenId
					? { ...e, subElemens: e.subElemens.filter((_, i) => i !== index) }
					: e,
			),
		);
	};

	const updateSubElemen = (elemenId: string, index: number, value: string) => {
		setElemens((prev) =>
			prev.map((e) =>
				e.id === elemenId
					? {
							...e,
							subElemens: e.subElemens.map((se, i) =>
								i === index ? value : se,
							),
						}
					: e,
			),
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const submitJurusanId = adminJurusan?.jurusanId || formData.jurusanId;

		if (!formData.nama || !submitJurusanId) {
			toast.error("Nama aspek dan jurusan harus diisi");
			return;
		}

		setIsSubmitting(true);

		try {
			const url = editingId
				? `/api/admin/aspek/${editingId}`
				: "/api/admin/aspek";
			const method = editingId ? "PATCH" : "POST";

			const response = await fetch(url, {
				method: method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nama: formData.nama,
					jurusanId: submitJurusanId,
					elemens: elemens.map((e) => ({
						nama: e.nama,
						subElemens: e.subElemens
							.filter((se) => se.trim())
							.map((se) => ({ nama: se })),
					})),
				}),
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Gagal menyimpan aspek");

			toast.success(
				editingId ? "Aspek berhasil diperbarui" : "Aspek berhasil ditambahkan",
			);
			setIsDialogOpen(false);
			resetForm();
			fetchAspeks();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan aspek");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Apakah Anda yakin ingin menghapus aspek penilaian ini?"))
			return;

		try {
			const response = await fetch(`/api/admin/aspek/${id}`, {
				method: "DELETE",
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Gagal menghapus aspek");

			toast.success("Aspek penilaian berhasil dihapus");
			fetchAspeks();
		} catch (error: any) {
			toast.error(error.message || "Gagal menghapus aspek");
		}
	};

	const resetForm = () => {
		setEditingId(null);
		setFormData({
			nama: "",
			jurusanId: adminJurusan?.jurusanId || "",
		});
		setElemens([{ id: "1", nama: "", subElemens: [] }]);
	};

	const handleDialogOpenChange = (open: boolean) => {
		if (!open) resetForm();
		setIsDialogOpen(open);
	};

	const handleDownloadTemplate = async () => {
		try {
			const response = await fetch("/api/admin/aspek/template");
			if (!response.ok) throw new Error("Gagal mengunduh template");
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "template-aspek-penilaian.xlsx";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error: any) {
			toast.error(error.message || "Gagal mengunduh template");
		}
	};

	const handleImport = async () => {
		if (!importFile) return;
		setIsImporting(true);
		try {
			const formData = new FormData();
			formData.append("file", importFile);
			const response = await fetch("/api/admin/aspek/import", {
				method: "POST",
				body: formData,
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Gagal mengimpor data");
			toast.success(data.message);
			setIsImportDialogOpen(false);
			fetchAspeks();
		} catch (error: any) {
			toast.error(error.message || "Gagal mengimpor data");
		} finally {
			setIsImporting(false);
		}
	};

	return (
		<div className="space-y-6">
			{adminJurusan && (
				<Alert className="bg-primary/10 border-primary/20">
					<BookOpen className="h-4 w-4" />
					<AlertDescription>
						Mode Jurusan: {adminJurusan.jurusan.nama} (
						{adminJurusan.jurusan.kode})
					</AlertDescription>
				</Alert>
			)}

			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Aspek Penilaian</h1>
					<p className="text-muted-foreground">
						Kelola aspek penilaian tanpa bobot
					</p>
				</div>

				<div className="flex gap-2">
					<Dialog
						open={isImportDialogOpen}
						onOpenChange={setIsImportDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="outline" className="rounded-xl">
								<Upload className="mr-2 h-4 w-4" /> Impor XLSX
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Impor Aspek Penilaian</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<Button
									variant="outline"
									onClick={handleDownloadTemplate}
									className="w-full">
									<Download className="mr-2 h-4 w-4" /> Download Template
								</Button>
								<div className="space-y-2">
									<Label>File XLSX</Label>
									<Input
										type="file"
										accept=".xlsx,.xls"
										onChange={(e) => setImportFile(e.target.files?.[0] || null)}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={handleImport}
									disabled={!importFile || isImporting}>
									{isImporting ? "Mengimpor..." : "Impor"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
						<DialogTrigger asChild>
							<Button className="rounded-xl" onClick={() => resetForm()}>
								<Plus className="mr-2 h-4 w-4" /> Tambah Aspek
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>
									{editingId
										? "Edit Aspek Penilaian"
										: "Tambah Aspek Penilaian"}
								</DialogTitle>
							</DialogHeader>

							<form onSubmit={handleSubmit}>
								<div className="space-y-6 py-4">
									{/* Nama Aspek */}
									<div className="grid gap-2">
										<Label htmlFor="nama">Nama Aspek</Label>
										<Input
											id="nama"
											name="nama"
											value={formData.nama}
											onChange={handleInputChange}
											required
										/>
									</div>

									{/* Jurusan Selection (LOCKED OR OPEN) */}
									<div className="grid gap-2">
										<Label htmlFor="jurusanId">Jurusan</Label>

										{adminJurusan ? (
											// STATE: LOCKED (Admin Jurusan)
											<Input
												id="jurusanId"
												value={adminJurusan.jurusan.nama}
												disabled
												className="bg-muted text-muted-foreground cursor-not-allowed"
											/>
										) : (
											// STATE: OPEN (Superadmin)
											<select
												id="jurusanId"
												name="jurusanId"
												value={formData.jurusanId}
												onChange={handleInputChange}
												className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
												required>
												<option value="">Pilih Jurusan</option>
												{jurusans.map((j) => (
													<option key={j.id} value={j.id}>
														{j.nama}
													</option>
												))}
											</select>
										)}
									</div>

									{/* Elemen Form */}
									<div className="space-y-4">
										<Label>Elemen Kompetensi</Label>
										{elemens.map((elemen, index) => (
											<Card key={elemen.id} className="p-4">
												<div className="space-y-4">
													<div className="flex gap-4">
														<div className="flex-1">
															<Label>Nama Elemen {index + 1}</Label>
															<Input
																value={elemen.nama}
																onChange={(e) =>
																	updateElemen(
																		elemen.id,
																		"nama",
																		e.target.value,
																	)
																}
																required
															/>
														</div>
														{elemens.length > 1 && (
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="mt-6"
																onClick={() => removeElemen(elemen.id)}>
																<Trash2 className="h-4 w-4 text-destructive" />
															</Button>
														)}
													</div>

													<div className="space-y-2">
														<div className="flex items-center justify-between">
															<Label className="text-sm text-muted-foreground">
																Sub-Elemen (Opsional)
															</Label>
															<Button
																type="button"
																variant="outline"
																size="sm"
																onClick={() => addSubElemen(elemen.id)}>
																<Plus className="mr-1 h-3 w-3" /> Tambah Sub
															</Button>
														</div>
														{elemen.subElemens.map((sub, subIndex) => (
															<div key={subIndex} className="flex gap-2">
																<Input
																	value={sub}
																	onChange={(e) =>
																		updateSubElemen(
																			elemen.id,
																			subIndex,
																			e.target.value,
																		)
																	}
																	className="flex-1"
																/>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={() =>
																		removeSubElemen(elemen.id, subIndex)
																	}>
																	<X className="h-4 w-4" />
																</Button>
															</div>
														))}
													</div>
												</div>
											</Card>
										))}
										<Button
											type="button"
											variant="outline"
											className="w-full"
											onClick={addElemen}>
											<Plus className="mr-2 h-4 w-4" /> Tambah Elemen
										</Button>
									</div>
								</div>

								<DialogFooter>
									<Button type="submit" disabled={isSubmitting}>
										{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>Daftar Aspek Penilaian</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2 animate-pulse">
							{[1, 2, 3].map((i) => (
								<div key={i} className="h-16 rounded-lg bg-muted" />
							))}
						</div>
					) : aspeks.length === 0 ? (
						<Alert>
							<AlertDescription>Belum ada aspek penilaian</AlertDescription>
						</Alert>
					) : (
						<div className="space-y-4">
							{aspeks.map((aspek) => (
								<Card key={aspek.id} className="rounded-xl overflow-hidden">
									<CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/30">
										<div>
											<CardTitle className="text-lg">{aspek.nama}</CardTitle>
										</div>
										<div className="flex gap-2">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
												onClick={() => handleEdit(aspek)}>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive hover:bg-destructive/10"
												onClick={() => handleDelete(aspek.id)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardHeader>
									<CardContent className="pt-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
											{aspek.elemens.map((elemen) => (
												<div
													key={elemen.id}
													className="flex items-start gap-2 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/20 transition-all">
													<ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
													<div className="flex flex-col">
														<span className="text-sm font-medium">
															{elemen.nama}
														</span>
														{elemen.subElemens &&
															elemen.subElemens.length > 0 && (
																<div className="flex flex-col gap-1 mt-1">
																	{elemen.subElemens.map((sub, index) => (
																		<span
																			key={sub.id || index}
																			className="text-xs text-muted-foreground">
																			{sub.nama}
																		</span>
																	))}
																</div>
															)}
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
