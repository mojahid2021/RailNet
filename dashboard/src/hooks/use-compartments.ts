"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Compartment, CreateCompartmentRequest, UpdateCompartmentRequest, ApiResponse } from "@/types";
import { toast } from "sonner";

export function useCompartments() {
  return useQuery({
    queryKey: ["compartments"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Compartment[]>>("/compartments");
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch compartments");
      }
      return data.data || [];
    },
  });
}

export function useCreateCompartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCompartmentRequest) => {
      const { data: response } = await api.post<ApiResponse<Compartment>>("/compartments", data);
      if (!response.success) {
        throw new Error(response.error || "Failed to create compartment");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compartments"] });
      toast.success("Compartment created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCompartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCompartmentRequest }) => {
      const { data: response } = await api.put<ApiResponse<Compartment>>(`/compartments/${id}`, data);
      if (!response.success) {
        throw new Error(response.error || "Failed to update compartment");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compartments"] });
      toast.success("Compartment updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCompartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<null>>(`/compartments/${id}`);
      if (!data.success) {
        throw new Error(data.error || "Failed to delete compartment");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compartments"] });
      toast.success("Compartment deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
