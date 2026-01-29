"use client";

import { usePathname } from "next/navigation";
import { ResponsiveNavbar } from "./responsive-navbar";

export function LayoutWrapper({
	children,
	requireAuth = true,
	user,
}: LayoutWrapperProps) {
	const pathname = usePathname();

	if (pathname === "/login") {
		return <>{children}</>;
	}

	return (
		<div className="flex h-screen bg-background">
			<ResponsiveNavbar user={user} />

			<main
				className="
          flex-1 overflow-y-auto
          pt-14 pb-16
          md:pt-0 md:pb-0
        ">
				<div className="container mx-auto p-4 md:p-6 lg:p-8">{children}</div>
			</main>
		</div>
	);
}
