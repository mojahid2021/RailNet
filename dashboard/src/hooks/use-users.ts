"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminUser, UsersQueryParams, ApiResponse, PaginatedUsersResponse } from "@/types";

export function useUsers(params?: UsersQueryParams) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.role) queryParams.append("role", params.role);
      if (params?.email) queryParams.append("email", params.email);
      if (params?.firstName) queryParams.append("firstName", params.firstName);
      if (params?.lastName) queryParams.append("lastName", params.lastName);
      if (params?.phone) queryParams.append("phone", params.phone);
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);

      const queryString = queryParams.toString();
      const url = `/users${queryString ? `?${queryString}` : ""}`;

      const { data } = await api.get<ApiResponse<PaginatedUsersResponse>>(url);
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch users");
      }
      return data.data;
    },
  });
}
