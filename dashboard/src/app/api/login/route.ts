import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const response = await fetch(`${apiUrl}/api/v1/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Login failed" },
        { status: response.status }
      );
    }

    if (data.success && data.data?.token) {
      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set("auth_token", data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: { admin: data.data.admin },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid response from server" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Login proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
