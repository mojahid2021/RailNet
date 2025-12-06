"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Schedule, CreateScheduleRequest, ApiResponse } from "@/types";
import { toast } from "sonner";

export function useSchedules() {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data } = await api.get<any>("/train-schedules");
      
      // Handle wrapped response
      if (data.success && data.data) {
        return (Array.isArray(data.data) ? data.data : []) as Schedule[];
      }
      
      // Handle unwrapped response (direct array)
      if (Array.isArray(data)) {
        return data as Schedule[];
      }
      
      // Handle potential pagination wrapper or other structure
      if (data.schedules && Array.isArray(data.schedules)) {
        return data.schedules as Schedule[];
      }

      return [];
    },
  });
}

export function useSchedule(id: string) {
  return useQuery({
    queryKey: ["schedule", id],
    queryFn: async () => {
      const { data } = await api.get<any>(`/train-schedules/${id}`);
      // Handle wrapped response
      if (data.success && data.data) {
        return data.data as Schedule;
      }
      // Handle unwrapped response (direct object)
      if (data.id && data.trainId) {
        return data as Schedule;
      }
      throw new Error(data.error || "Failed to fetch schedule");
    },
    enabled: !!id,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSchedule: CreateScheduleRequest) => {
      const { data } = await api.post<ApiResponse<Schedule>>("/train-schedules", newSchedule);
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
