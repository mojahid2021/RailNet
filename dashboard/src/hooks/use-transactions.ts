"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PaymentTransaction, TransactionsQueryParams, ApiResponse, PaginatedTransactionsResponse } from "@/types";

export function useTransactions(params?: TransactionsQueryParams) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: async () => {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.userId) queryParams.append("userId", params.userId.toString());
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);

      const queryString = queryParams.toString();
      const url = `/payments/transactions${queryString ? `?${queryString}` : ""}`;

      const { data } = await api.get<ApiResponse<PaginatedTransactionsResponse>>(url);
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch transactions");
      }
      return data.data;
    },
  });
}
