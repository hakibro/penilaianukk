import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs"; // 1. Import bcrypt

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email dan password diperlukan" },
				{ status: 400 },
			);
		}

		const user = await db.user.findUnique({
			where: { email },
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Email atau password salah" },
				{ status: 401 },
			);
		}

		// 2. Gunakan bcrypt.compare, jangan pakai "!=="
		const isPasswordMatch = await bcrypt.compare(password, user.password);

		if (!isPasswordMatch) {
			return NextResponse.json(
				{ error: "Email atau password salah" },
				{ status: 401 },
			);
		}

		const { password: _, ...userWithoutPassword } = user;

		const response = NextResponse.json({
			success: true,
			user: userWithoutPassword,
		});

		response.cookies.set("user", JSON.stringify(userWithoutPassword), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7,
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat login" },
			{ status: 500 },
		);
	}
}
