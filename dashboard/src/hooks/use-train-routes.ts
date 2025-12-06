"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TrainRoute, CreateTrainRouteRequest, UpdateTrainRouteRequest, ApiResponse } from "@/types";
import { toast } from "sonner";

export function useTrainRoutes() {
  return useQuery({
    queryKey: ["trainRoutes"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TrainRoute[]>>("/train-routes");
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch train routes");
      }
      return data.data || [];
    },
  });
}

export function useTrainRoute(id: string) {
  return useQuery({
    queryKey: ["trainRoute", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TrainRoute>>(`/train-routes/${id}`);
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch train route");
      }
      return data.data;
    },
    enabled: !!id,
  });
}

// Helper for imperative fetching (e.g. in event handlers)
export async function fetchTrainRoute(id: string): Promise<TrainRoute | null> {
  try {
    const { data } = await api.get<any>(`/train-routes/${id}`);
    
    // Handle wrapped response
    if (data.success && data.data) {
      return data.data as TrainRoute;
    }
    
    // Handle unwrapped response (direct object)
    // Relaxed check to include name or startStationId in case id is somehow missing or 0
    if (data && (data.id || data.name || data.startStationId)) {
      return data as TrainRoute;
    }

    return null;
  } catch (error) {
    console.error("Error fetching train route:", error);
    return null;
  }
}

export function useCreateTrainRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeData: CreateTrainRouteRequest) => {
      const { data } = await api.post<ApiResponse<TrainRoute>>("/train-routes", routeData);
      if (!data.success) {
        throw new Error(data.error || "Failed to create train route");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainRoutes"] });
      toast.success("Train route created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTrainRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: routeData }: { id: string; data: UpdateTrainRouteRequest }) => {
      const { data } = await api.put<ApiResponse<TrainRoute>>(`/train-routes/${id}`, routeData);
      if (!data.success) {
        throw new Error(data.error || "Failed to update train route");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainRoutes"] });
      toast.success("Train route updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTrainRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<null>>(`/train-routes/${id}`);
      if (!data.success) {
        throw new Error(data.error || "Failed to delete train route");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainRoutes"] });
      toast.success("Train route deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
