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
import { Slider } from "@/components/ui/slider";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardList, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Kriteria {
	id: string;
	nama: string;
	nilaiMin: number;
	nilaiMax: number;
	keterangan: string;
}

export default function KriteriaPage() {
	const [kriterias, setKriterias] = useState<Kriteria[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingKriteria, setEditingKriteria] = useState<Kriteria | null>(null);
	const [formData, setFormData] = useState({
		nama: "",
		nilaiMin: 0,
		nilaiMax: 100,
		keterangan: "",
	});

	useEffect(() => {
		fetchKriterias();
	}, []);

	const fetchKriterias = async () => {
		try {
			const response = await fetch("/api/kriteria");
			const data = await response.json();
			setKriterias(data.kriterias || []);
		} catch (error) {
			console.error("Failed to fetch kriterias:", error);
			toast.error("Gagal memuat data kriteria");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const url = editingKriteria
				? `/api/kriteria/${editingKriteria.id}`
				: "/api/kriteria";

			const method = editingKriteria ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				throw new Error("Gagal menyimpan kriteria");
			}

			toast.success(
				editingKriteria
					? "Kriteria berhasil diperbarui"
					: "Kriteria berhasil ditambahkan",
			);
			setIsDialogOpen(false);
			setEditingKriteria(null);
			setFormData({ nama: "", nilaiMin: 0, nilaiMax: 100, keterangan: "" });
			fetchKriterias();
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	const handleEdit = (kriteria: Kriteria) => {
		setEditingKriteria(kriteria);
		setFormData({
			nama: kriteria.nama,
			nilaiMin: kriteria.nilaiMin,
			nilaiMax: kriteria.nilaiMax,
			keterangan: kriteria.keterangan,
		});
		setIsDialogOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Apakah Anda yakin ingin menghapus kriteria ini?")) {
			return;
		}

		try {
			const response = await fetch(`/api/kriteria/${id}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Gagal menghapus kriteria");
			}

			toast.success("Kriteria berhasil dihapus");
			fetchKriterias();
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Kriteria Penilaian
					</h1>
					<p className="text-muted-foreground">
						Atur kriteria penilaian untuk UKK
					</p>
				</div>

				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button
							className="rounded-xl"
							onClick={() => {
								setEditingKriteria(null);
								setFormData({
									nama: "",
									nilaiMin: 0,
									nilaiMax: 100,
									keterangan: "",
								});
							}}>
							<Plus className="mr-2 h-4 w-4" />
							Tambah Kriteria
						</Button>
					</DialogTrigger>
					<DialogContent className="rounded-2xl">
						<DialogHeader>
							<DialogTitle>
								{editingKriteria ? "Edit Kriteria" : "Tambah Kriteria"}
							</DialogTitle>
							<DialogDescription>
								Atur kriteria penilaian berdasarkan rentang nilai
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit}>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="nama">Nama Kriteria</Label>
									<Input
										id="nama"
										placeholder="Contoh: Sangat Baik"
										value={formData.nama}
										onChange={(e) =>
											setFormData({ ...formData, nama: e.target.value })
										}
										required
									/>
								</div>

								<div className="space-y-4">
									<div>
										<Label>
											Range Nilai: {formData.nilaiMin} - {formData.nilaiMax}
										</Label>
										<div className="pt-4">
											<Slider
												value={[formData.nilaiMin, formData.nilaiMax]}
												onValueChange={([min, max]) =>
													setFormData({
														...formData,
														nilaiMin: min,
														nilaiMax: max,
													})
												}
												min={0}
												max={100}
												step={1}
												className="w-full"
											/>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="keterangan">Keterangan</Label>
									<Input
										id="keterangan"
										placeholder="Contoh: Memenuhi semua kriteria dengan sempurna"
										value={formData.keterangan}
										onChange={(e) =>
											setFormData({ ...formData, keterangan: e.target.value })
										}
										required
									/>
								</div>
							</div>
							<DialogFooter>
								<Button type="submit" className="rounded-xl">
									{editingKriteria ? "Simpan Perubahan" : "Tambah Kriteria"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>Daftar Kriteria</CardTitle>
					<CardDescription>
						Total {kriterias.length} kriteria penilaian terdaftar
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-12 rounded-lg bg-muted animate-pulse"
								/>
							))}
						</div>
					) : kriterias.length === 0 ? (
						<Alert>
							<ClipboardList className="h-4 w-4" />
							<AlertDescription>
								Belum ada kriteria penilaian yang ditambahkan
							</AlertDescription>
						</Alert>
					) : (
						<div className="rounded-xl border overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nama Kriteria</TableHead>
										<TableHead>Range Nilai</TableHead>
										<TableHead>Keterangan</TableHead>
										<TableHead className="text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{kriterias.map((kriteria) => (
										<TableRow key={kriteria.id}>
											<TableCell className="font-medium">
												{kriteria.nama}
											</TableCell>
											<TableCell>
												<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
													{kriteria.nilaiMin} - {kriteria.nilaiMax}
												</span>
											</TableCell>
											<TableCell className="max-w-md truncate">
												{kriteria.keterangan}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleEdit(kriteria)}>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleDelete(kriteria.id)}>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
