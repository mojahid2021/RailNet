import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_CONFIG } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Login failed" },
        { status: response.status }
      );
    }

    if (data.token && data.user) {
      if (data.user.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Access denied. Admin role required." },
          { status: 403 }
        );
      }

      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set("auth_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: { 
          token: data.token,
          user: data.user 
        },
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
