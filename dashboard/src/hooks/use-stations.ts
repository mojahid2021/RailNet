"use client";

import { useState, useCallback } from "react";
import { Station, CreateStationRequest, UpdateStationRequest, ApiResponse } from "@/types";
import { API_CONFIG } from "@/lib/constants";

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stations");
      const data: ApiResponse<Station[]> = await res.json();

      if (data.success && data.data) {
        setStations(data.data);
      } else {
        setError(data.error || "Failed to fetch stations");
      }
    } catch (err) {
      setError("Network error occurred while fetching stations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createStation = async (stationData: CreateStationRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stationData),
      });
      const data: ApiResponse<Station> = await res.json();

      if (data.success && data.data) {
        setStations((prev) => [data.data!, ...prev]);
        return true;
      } else {
        setError(data.error || "Failed to create station");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while creating station");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateStation = async (id: string, stationData: UpdateStationRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stationData),
      });
      const data: ApiResponse<Station> = await res.json();

      if (data.success && data.data) {
        setStations((prev) =>
          prev.map((station) => (station.id === id ? data.data! : station))
        );
        return true;
      } else {
        setError(data.error || "Failed to update station");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while updating station");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteStation = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: "DELETE",
      });
      const data: ApiResponse<null> = await res.json();

      if (data.success) {
        setStations((prev) => prev.filter((station) => station.id !== id));
        return true;
      } else {
        setError(data.error || "Failed to delete station");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while deleting station");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    stations,
    loading,
    error,
    fetchStations,
    createStation,
    updateStation,
    deleteStation,
  };
}
