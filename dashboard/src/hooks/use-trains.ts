"use client";

import { useState, useCallback, useEffect } from "react";
import { Train, CreateTrainRequest, UpdateTrainRequest, ApiResponse } from "@/types";

export function useTrains() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrains = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trains");
      const data: ApiResponse<Train[]> = await res.json();

      if (data.success && data.data) {
        setTrains(data.data);
      } else {
        setError(data.error || "Failed to fetch trains");
      }
    } catch (err) {
      setError("Network error occurred while fetching trains");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTrain = async (data: CreateTrainRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData: ApiResponse<Train> = await res.json();

      if (responseData.success && responseData.data) {
        setTrains((prev) => [responseData.data!, ...prev]);
        return true;
      } else {
        setError(responseData.error || "Failed to create train");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while creating train");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateTrain = async (id: string, data: UpdateTrainRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trains/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData: ApiResponse<Train> = await res.json();

      if (responseData.success && responseData.data) {
        setTrains((prev) =>
          prev.map((item) => (item.id === id ? responseData.data! : item))
        );
        return true;
      } else {
        setError(responseData.error || "Failed to update train");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while updating train");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTrain = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trains/${id}`, {
        method: "DELETE",
      });
      const responseData: ApiResponse<null> = await res.json();

      if (responseData.success) {
        setTrains((prev) => prev.filter((item) => item.id !== id));
        return true;
      } else {
        setError(responseData.error || "Failed to delete train");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while deleting train");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrains();
  }, [fetchTrains]);

  return {
    trains,
    loading,
    error,
    fetchTrains,
    createTrain,
    updateTrain,
    deleteTrain,
  };
}
