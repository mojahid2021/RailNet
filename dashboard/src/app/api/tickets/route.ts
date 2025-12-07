import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_CONFIG } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const userId = searchParams.get("userId");
    const trainId = searchParams.get("trainId");
    const ticketId = searchParams.get("ticketId");
    const passengerName = searchParams.get("passengerName");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const travelStartDate = searchParams.get("travelStartDate");
    const travelEndDate = searchParams.get("travelEndDate");

    // Build query string for backend API
    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page);
    if (limit) queryParams.append("limit", limit);
    if (status) queryParams.append("status", status);
    if (paymentStatus) queryParams.append("paymentStatus", paymentStatus);
    if (userId) queryParams.append("userId", userId);
    if (trainId) queryParams.append("trainId", trainId);
    if (ticketId) queryParams.append("ticketId", ticketId);
    if (passengerName) queryParams.append("passengerName", passengerName);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (travelStartDate) queryParams.append("travelStartDate", travelStartDate);
    if (travelEndDate) queryParams.append("travelEndDate", travelEndDate);

    const queryString = queryParams.toString();
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TICKETS}${queryString ? `?${queryString}` : ""}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.message || "Failed to fetch tickets" },
          { status: response.status }
        );
      }

      // Return the data from backend
      return NextResponse.json({ success: true, data: data });
    } catch (error) {
      console.error("Tickets fetch error:", error);
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
