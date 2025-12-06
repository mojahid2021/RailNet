import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_CONFIG } from "@/lib/constants";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCHEDULES}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json(
          { error: data.message || "Failed to fetch schedule" },
          { status: response.status }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Schedule fetch error:", error);
      return NextResponse.json(
        { error: "Backend API unavailable or network error" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
