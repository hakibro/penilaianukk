"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const isSubmitting = useRef(false);
	const isRedirecting = useRef(false);
	const isLoadingRef = useRef(false);

	const handleLogin = async (e: React.FormEvent | null = null) => {
		if (e) {
			e.preventDefault();
		}

		if (isLoading) return;

		setError("");
		setIsLoading(true);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Login failed");
			}

			toast.success("Login berhasil!", {
				description: `Selamat datang, ${data.user.name}`,
			});

			// Redirect using router to trigger full page refresh
			setTimeout(() => {
				switch (data.user.role) {
					case "SUPERADMIN":
						router.push("/dashboard");
						return;
					case "ADMIN_JURUSAN":
						router.push("/dashboard/admin");
						return;
					case "PENILAI":
						router.push("/dashboard/penilai");
						return;
					default:
						router.push("/dashboard");
				}
			}, 100);
		} catch (err: any) {
			setError(err.message || "Terjadi kesalahan saat login");
			toast.error("Login gagal", {
				description: err.message || "Terjadi kesalahan saat login",
			});
		} finally {
			setIsLoading(false);
			isSubmitting.current = false;
			isLoadingRef.current = false;
			isRedirecting.current = false;
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
			<Card className="w-full max-w-md shadow-2xl">
				<CardHeader className="space-y-1 text-center">
					<div className="flex justify-center mb-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<Shield className="h-8 w-8 text-primary" />
						</div>
					</div>
					<CardTitle className="text-2xl font-bold">Sistem UKK</CardTitle>
					<CardDescription>
						Masuk ke sistem penilaian Ujian Kompetensi Kejuruan
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4" id="login-form">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="nama@sekolah.id"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Masukkan password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={isLoading || isSubmitting.current}>
							{isLoading ? "Masuk..." : "Masuk"}
						</Button>
					</form>
				</CardContent>
				<CardFooter className="flex flex-col space-y-2">
					<Link
						href="/force-logout"
						className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors">
						Masalah login? Klik Force Logout
					</Link>
					<p className="text-xs text-center text-muted-foreground">
						© 2024 Sistem UKK. All rights reserved.
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
