"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ClipboardCheck, Users, CheckCircle } from "lucide-react";
import Link from "next/link";

type DashboardData = {
	siswaPerluDinilai: number;
	penilaianSelesai: number;
	totalPenilaian: number;
};

export default function PenilaiDashboard() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/penilai/dashboard")
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					setData(res.data);
				}
			})
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return <div className="text-muted-foreground">Memuat dashboard...</div>;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Dashboard Penilai</h1>
				<p className="text-muted-foreground">Selamat datang di panel penilai</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card className="rounded-2xl">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Siswa Perlu Dinilai
						</CardTitle>
						<div className="rounded-full p-2 bg-blue-500/10">
							<Users className="h-4 w-4 text-blue-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data?.siswaPerluDinilai ?? 0}
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Penilaian Selesai
						</CardTitle>
						<div className="rounded-full p-2 bg-green-500/10">
							<CheckCircle className="h-4 w-4 text-green-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data?.penilaianSelesai ?? 0}
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Total Penilaian
						</CardTitle>
						<div className="rounded-full p-2 bg-purple-500/10">
							<ClipboardCheck className="h-4 w-4 text-purple-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data?.totalPenilaian ?? 0}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>Mulai Menilai</CardTitle>
					<CardDescription>
						Klik tombol di bawah untuk memulai penilaian
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Link href="/dashboard/penilai/penilaian" className="block w-full">
						<button className="w-full rounded-xl bg-primary px-6 py-4 text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
							Mulai Penilaian
						</button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
