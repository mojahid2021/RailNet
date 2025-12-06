import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_CONFIG } from "@/lib/constants";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROFILE}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Backend API returned non-JSON response. Is the backend server running?");
        return NextResponse.json(
          { error: "Backend API unavailable" },
          { status: 503 }
        );
      }

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.message || "Failed to fetch profile" },
          { status: response.status }
        );
      }

      // The backend returns the user profile directly
      // We want to return { success: true, user: { ...profile } } to the frontend
      return NextResponse.json({ success: true, user: data });
    } catch (error) {
      console.error("Profile fetch error:", error);
      return NextResponse.json(
        { error: "Backend API unavailable or network error" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Cookie error:", error);
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 }
    );
  }
}
