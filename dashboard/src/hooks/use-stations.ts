"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Station, CreateStationRequest, UpdateStationRequest, ApiResponse } from "@/types";
import { toast } from "sonner";

export function useStations() {
  return useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Station[]>>("/stations");
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch stations");
      }
      return data.data || [];
    },
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stationData: CreateStationRequest) => {
      const { data } = await api.post<ApiResponse<Station>>("/stations", stationData);
      if (!data.success) {
        throw new Error(data.error || "Failed to create station");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.success("Station created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: stationData }: { id: string; data: UpdateStationRequest }) => {
      const { data } = await api.put<ApiResponse<Station>>(`/stations/${id}`, stationData);
      if (!data.success) {
        throw new Error(data.error || "Failed to update station");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.success("Station updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<null>>(`/stations/${id}`);
      if (!data.success) {
        throw new Error(data.error || "Failed to delete station");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.success("Station deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
