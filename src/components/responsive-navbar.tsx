"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	LayoutDashboard,
	GraduationCap,
	Users,
	ClipboardList,
	FileText,
	Settings,
	LogOut,
	Menu,
	Shield,
	UserCheck,
	ChevronRight,
	BookOpen,
	ClipboardCheck,
	Power,
} from "lucide-react";

interface NavbarProps {
	user?: {
		name: string;
		email: string;
		role: "SUPERADMIN" | "ADMIN_JURUSAN" | "PENILAI";
	};
}

const menuItems = {
	SUPERADMIN: [
		{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
		{ title: "Jurusan", href: "/dashboard/jurusan", icon: GraduationCap },
		{
			title: "Admin Jurusan",
			href: "/dashboard/admin-jurusan",
			icon: UserCheck,
		},
		{
			title: "Kriteria Penilaian",
			href: "/dashboard/kriteria",
			icon: ClipboardList,
		},
		{ title: "Data Siswa", href: "/dashboard/siswa", icon: Users },
	],
	ADMIN_JURUSAN: [
		{ title: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
		{ title: "Penilai", href: "/dashboard/admin/penilai", icon: Users },
		{
			title: "Aspek Penilaian",
			href: "/dashboard/admin/aspek",
			icon: BookOpen,
		},
		{
			title: "Laporan Ujian",
			href: "/dashboard/admin/laporan",
			icon: FileText,
		},
	],
	PENILAI: [
		{ title: "Dashboard", href: "/dashboard/penilai", icon: LayoutDashboard },
		{
			title: "Penilaian",
			href: "/dashboard/penilai/penilaian",
			icon: ClipboardCheck,
		},
	],
};

export function ResponsiveNavbar({ user }: NavbarProps) {
	const [isMobile, setIsMobile] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const handleLogout = () => {
		// Create a request to clear the cookie
		fetch("/api/auth/force-logout", {
			method: "POST",
			body: JSON.stringify({}),
		})
			.then(() => {
				// Use window.location.replace to avoid browser history
				window.location.replace("/login");
			})
			.catch(() => {
				window.location.replace("/login");
			});
	};

	const handleForceLogout = () => {
		window.location.replace("/force-logout");
	};

	const items = user ? menuItems[user.role] : [];

	// Desktop Sidebar
	if (!isMobile) {
		return (
			<div className="flex h-screen w-64 flex-col border-r bg-background">
				<div className="flex h-16 items-center border-b px-6">
					<img src="/logo.png" className="w-12 h-12" />
					<span className="ml-4 text-xl font-bold">Sistem UKK</span>
				</div>

				<div className="flex-1 overflow-y-auto py-4 px-3">
					<nav className="space-y-1">
						{items.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;

							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={() => setIsOpen(false)}
									className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
										isActive
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}>
									<Icon className="mr-3 h-5 w-5" />
									{item.title}
								</Link>
							);
						})}
					</nav>
				</div>

				<div className="border-t p-4">
					<div className="mb-3 rounded-lg bg-muted p-3">
						<p className="text-sm font-medium">{user?.name}</p>
						<p className="text-xs text-muted-foreground">{user?.email}</p>
						<Badge variant="secondary" className="mt-2 text-xs">
							{user?.role?.replace("_", " ")}
						</Badge>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								className="w-full justify-start"
								suppressHydrationWarning>
								<LogOut className="mr-2 h-4 w-4" />
								Logout
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-56"
							suppressHydrationWarning>
							<DropdownMenuItem onClick={handleLogout} suppressHydrationWarning>
								<LogOut className="mr-2 h-4 w-4" />
								Logout Biasa
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={handleForceLogout}
								className="text-destructive"
								suppressHydrationWarning>
								<Power className="mr-2 h-4 w-4" />
								Force Logout
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		);
	}

	// Mobile Bottom Navigation
	return (
		<>
			{/* Mobile Top Bar */}
			<div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
				<div className="flex items-center">
					<img src="/logo.png" className="w-11 h-11" />
					<span className="ml-4 text-lg font-bold">Sistem UKK</span>
				</div>
				<Sheet open={isOpen} onOpenChange={setIsOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon" suppressHydrationWarning>
							<Menu className="h-5 w-5" />
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-72">
						<div className="flex flex-col h-full py-4">
							<div className="px-4 py-2">
								<div className="flex items-center mb-4">
									<img src="/logo.png" className="w-11 h-11" />
									<span className="ml-4 text-lg font-bold">Sistem UKK</span>
								</div>
								<div className="mb-4 rounded-lg bg-muted p-3">
									<p className="text-sm font-medium">{user?.name}</p>
									<p className="text-xs text-muted-foreground">{user?.email}</p>
									<Badge variant="secondary" className="mt-2 text-xs">
										{user?.role?.replace("_", " ")}
									</Badge>
								</div>
							</div>

							<nav className="flex-1 space-y-1 px-4">
								{items.map((item) => {
									const Icon = item.icon;
									const isActive = pathname === item.href;

									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setIsOpen(false)}
											className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
												isActive
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:bg-muted hover:text-foreground"
											}`}>
											<Icon className="mr-3 h-5 w-5" />
											{item.title}
											<ChevronRight className="ml-auto h-4 w-4" />
										</Link>
									);
								})}
							</nav>

							<div className="border-t px-4 pt-4">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start"
											suppressHydrationWarning>
											<LogOut className="mr-2 h-4 w-4" />
											Logout
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="w-56"
										suppressHydrationWarning>
										<DropdownMenuItem
											onClick={handleLogout}
											suppressHydrationWarning>
											<LogOut className="mr-2 h-4 w-4" />
											Logout Biasa
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleForceLogout}
											className="text-destructive"
											suppressHydrationWarning>
											<Power className="mr-2 h-4 w-4" />
											Force Logout
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</SheetContent>
				</Sheet>
			</div>

			{/* Mobile Bottom Navigation */}
			<nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe md:hidden">
				<div className="grid grid-cols-4 h-16">
					{items.slice(0, 4).map((item, index) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;

						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex flex-col items-center justify-center gap-1 transition-colors ${
									isActive ? "text-primary" : "text-muted-foreground"
								}`}>
								<Icon className="h-5 w-5" />
								<span className="text-[10px] font-medium leading-tight">
									{item.title}
								</span>
							</Link>
						);
					})}
				</div>
			</nav>
		</>
	);
}
