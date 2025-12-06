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
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMPARTMENTS}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.message || "Failed to fetch compartments" },
          { status: response.status }
        );
      }

      // The backend returns an array of compartments directly
      // We want to return { success: true, data: Compartment[] } to the frontend
      return NextResponse.json({ success: true, data: data });
    } catch (error) {
      console.error("Compartments fetch error:", error);
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

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMPARTMENTS}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.message || "Failed to create compartment" },
          { status: response.status }
        );
      }

      // The backend returns the created compartment directly
      // We want to return { success: true, data: Compartment } to the frontend
      return NextResponse.json({ success: true, data: data });
    } catch (error) {
      console.error("Compartment creation error:", error);
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
