"use client";

import { useState, useCallback } from "react";
import { TrainRoute, CreateTrainRouteRequest, UpdateTrainRouteRequest, ApiResponse } from "@/types";

export function useTrainRoutes() {
  const [trainRoutes, setTrainRoutes] = useState<TrainRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/train-routes");
      const data: ApiResponse<TrainRoute[]> = await res.json();

      if (data.success && data.data) {
        setTrainRoutes(data.data);
      } else {
        setError(data.error || "Failed to fetch train routes");
      }
    } catch (err) {
      setError("Network error occurred while fetching train routes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTrainRoute = async (routeData: CreateTrainRouteRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/train-routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(routeData),
      });
      const data: ApiResponse<TrainRoute> = await res.json();

      if (data.success && data.data) {
        setTrainRoutes((prev) => [data.data!, ...prev]);
        return true;
      } else {
        setError(data.error || "Failed to create train route");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while creating train route");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateTrainRoute = async (id: string, routeData: UpdateTrainRouteRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/train-routes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(routeData),
      });
      const data: ApiResponse<TrainRoute> = await res.json();

      if (data.success && data.data) {
        setTrainRoutes((prev) =>
          prev.map((route) => (route.id === id ? data.data! : route))
        );
        return true;
      } else {
        setError(data.error || "Failed to update train route");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while updating train route");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTrainRoute = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/train-routes/${id}`, {
        method: "DELETE",
      });
      const data: ApiResponse<null> = await res.json();

      if (data.success) {
        setTrainRoutes((prev) => prev.filter((route) => route.id !== id));
        return true;
      } else {
        setError(data.error || "Failed to delete train route");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while deleting train route");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    trainRoutes,
    loading,
    error,
    fetchTrainRoutes,
    createTrainRoute,
    updateTrainRoute,
    deleteTrainRoute,
  };
}
