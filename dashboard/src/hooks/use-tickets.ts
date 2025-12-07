"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SoldTicket, TicketsQueryParams, ApiResponse, PaginatedTicketsResponse } from "@/types";

export function useTickets(params?: TicketsQueryParams) {
  return useQuery({
    queryKey: ["tickets", params],
    queryFn: async () => {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.paymentStatus) queryParams.append("paymentStatus", params.paymentStatus);
      if (params?.userId) queryParams.append("userId", params.userId.toString());
      if (params?.trainId) queryParams.append("trainId", params.trainId.toString());
      if (params?.ticketId) queryParams.append("ticketId", params.ticketId);
      if (params?.passengerName) queryParams.append("passengerName", params.passengerName);
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);
      if (params?.travelStartDate) queryParams.append("travelStartDate", params.travelStartDate);
      if (params?.travelEndDate) queryParams.append("travelEndDate", params.travelEndDate);

      const queryString = queryParams.toString();
      const url = `/tickets${queryString ? `?${queryString}` : ""}`;

      const { data } = await api.get<ApiResponse<PaginatedTicketsResponse>>(url);
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch tickets");
      }
      // Return the data directly (pagination is at top level, not nested)
      return data.data;
    },
  });
}
