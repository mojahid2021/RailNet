"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Train, CreateTrainRequest, UpdateTrainRequest, ApiResponse } from "@/types";
import { toast } from "sonner";

export function useTrains() {
  return useQuery({
    queryKey: ["trains"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Train[]>>("/trains");
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch trains");
      }
      return data.data || [];
    },
  });
}

export function useCreateTrain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTrain: CreateTrainRequest) => {
      const { data } = await api.post<ApiResponse<Train>>("/trains", newTrain);
      if (!data.success) {
        throw new Error(data.error || "Failed to create train");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trains"] });
      toast.success("Train created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTrain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: UpdateTrainRequest }) => {
      const { data } = await api.put<ApiResponse<Train>>(`/trains/${id}`, updateData);
      if (!data.success) {
        throw new Error(data.error || "Failed to update train");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trains"] });
      toast.success("Train updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTrain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<null>>(`/trains/${id}`);
      if (!data.success) {
        throw new Error(data.error || "Failed to delete train");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trains"] });
      toast.success("Train deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
