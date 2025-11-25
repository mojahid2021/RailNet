"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Schedule, CreateScheduleRequest, ApiResponse } from "@/types";
import { toast } from "sonner";

export function useSchedules() {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Schedule[]>>("/schedules");
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch schedules");
      }
      // Handle potential pagination wrapper
      if (data.data && "schedules" in data.data && Array.isArray((data.data as any).schedules)) {
        return (data.data as any).schedules as Schedule[];
      }
      return (data.data as Schedule[]) || [];
    },
  });
}

export function useSchedule(id: string) {
  return useQuery({
    queryKey: ["schedule", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Schedule>>(`/schedules/${id}`);
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch schedule");
      }
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSchedule: CreateScheduleRequest) => {
      const { data } = await api.post<ApiResponse<Schedule>>("/schedules", newSchedule);
      if (!data.success) {
        throw new Error(data.error || "Failed to create schedule");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
