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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	UserCheck,
	Plus,
	Pencil,
	Trash2,
	Search,
	GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

interface Jurusan {
	id: string;
	nama: string;
	kode: string;
}

interface AdminJurusan {
	id: string;
	user: {
		name: string;
		email: string;
	};
	jurusan: {
		nama: string;
		kode: string;
	};
}

export default function AdminJurusanPage() {
	const [admins, setAdmins] = useState<AdminJurusan[]>([]);
	const [jurusans, setJurusans] = useState<Jurusan[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// State tambahan untuk Edit
	const [isEditMode, setIsEditMode] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		jurusanId: "",
	});

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const [adminsRes, jurusansRes] = await Promise.all([
				fetch("/api/admin-jurusan"),
				fetch("/api/jurusan"),
			]);
			const adminsData = await adminsRes.json();
			const jurusansData = await jurusansRes.json();
			setAdmins(adminsData.admins || []);
			setJurusans(jurusansData.jurusans || []);
		} catch (error) {
			toast.error("Gagal memuat data");
		} finally {
			setIsLoading(false);
		}
	};

	// Fungsi untuk membuka dialog edit
	const handleEditOpen = (admin: AdminJurusan) => {
		setIsEditMode(true);
		setSelectedId(admin.id);
		setFormData({
			name: admin.user.name,
			email: admin.user.email,
			password: "", // Password dikosongkan saat edit
			jurusanId:
				(admin as any).jurusanId ||
				jurusans.find((j) => j.nama === admin.jurusan.nama)?.id ||
				"",
		});
		setIsDialogOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const url = isEditMode
			? `/api/admin-jurusan/${selectedId}`
			: "/api/admin-jurusan";
		const method = isEditMode ? "PATCH" : "POST";

		try {
			const response = await fetch(url, {
				method: method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Gagal menyimpan data");

			toast.success(isEditMode ? "Admin diperbarui" : "Admin ditambahkan");
			setIsDialogOpen(false);
			resetForm();
			fetchData();
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	const resetForm = () => {
		setIsEditMode(false);
		setSelectedId(null);
		setFormData({ name: "", email: "", password: "", jurusanId: "" });
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Hapus admin ini?")) return;
		try {
			const response = await fetch(`/api/admin-jurusan/${id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("Gagal menghapus");
			toast.success("Admin dihapus");
			fetchData();
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Kelola Admin Jurusan</h1>
					<p className="text-muted-foreground">
						Tambah dan kelola admin untuk setiap jurusan
					</p>
				</div>

				<Dialog
					open={isDialogOpen}
					onOpenChange={(open) => {
						setIsDialogOpen(open);
						if (!open) resetForm();
					}}>
					<DialogTrigger asChild>
						<Button className="rounded-xl" onClick={resetForm}>
							<Plus className="mr-2 h-4 w-4" /> Tambah Admin
						</Button>
					</DialogTrigger>
					<DialogContent className="rounded-2xl">
						<DialogHeader>
							<DialogTitle>
								{isEditMode ? "Edit Admin Jurusan" : "Tambah Admin Jurusan"}
							</DialogTitle>
							<DialogDescription>
								{isEditMode
									? "Perbarui informasi akun admin"
									: "Buat akun admin untuk jurusan tertentu"}
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit}>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label>Nama Lengkap</Label>
									<Input
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label>Email</Label>
									<Input
										type="email"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label>
										Password{" "}
										{isEditMode && (
											<span className="text-xs text-muted-foreground">
												(Kosongkan jika tidak ingin diubah)
											</span>
										)}
									</Label>
									<Input
										type="password"
										value={formData.password}
										onChange={(e) =>
											setFormData({ ...formData, password: e.target.value })
										}
										required={!isEditMode}
									/>
								</div>
								<div className="space-y-2">
									<Label>Jurusan</Label>
									<Select
										value={formData.jurusanId}
										onValueChange={(v) =>
											setFormData({ ...formData, jurusanId: v })
										}
										required>
										<SelectTrigger>
											<SelectValue placeholder="Pilih jurusan" />
										</SelectTrigger>
										<SelectContent>
											{jurusans.map((j) => (
												<SelectItem key={j.id} value={j.id}>
													{j.nama}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button type="submit" className="rounded-xl">
									{isEditMode ? "Simpan Perubahan" : "Tambah Admin"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="rounded-2xl">
				<CardContent className="pt-6">
					<div className="rounded-xl border overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nama</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Jurusan</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{admins.map((admin) => (
									<TableRow key={admin.id}>
										<TableCell className="font-medium">
											{admin.user.name}
										</TableCell>
										<TableCell>{admin.user.email}</TableCell>
										<TableCell>{admin.jurusan.nama}</TableCell>
										<TableCell className="text-right space-x-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEditOpen(admin)}>
												<Pencil className="h-4 w-4 text-blue-500" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(admin.id)}>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
