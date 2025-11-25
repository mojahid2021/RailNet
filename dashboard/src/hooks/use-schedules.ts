"use client";

import { useState, useCallback, useEffect } from "react";
import { Schedule, CreateScheduleRequest, ApiResponse } from "@/types";

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedules");
      const data: ApiResponse<Schedule[]> = await res.json();

      if (data.success && data.data) {
        // Handle paginated response
        if ('schedules' in data.data && Array.isArray((data.data as any).schedules)) {
            setSchedules((data.data as any).schedules);
        } else if (Array.isArray(data.data)) {
            setSchedules(data.data);
        } else {
            setSchedules([]);
            console.error("Unexpected response format:", data.data);
        }
      } else {
        setError(data.error || "Failed to fetch schedules");
      }
    } catch (err) {
      setError("Network error occurred while fetching schedules");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = async (data: CreateScheduleRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData: ApiResponse<Schedule> = await res.json();

      if (responseData.success && responseData.data) {
        setSchedules((prev) => [responseData.data!, ...prev]);
        return true;
      } else {
        setError(responseData.error || "Failed to create schedule");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while creating schedule");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update and Delete are not fully specified in the prompt requirements for UI, 
  // but good to have placeholders or implementation if needed. 
  // For now, I'll stick to what's needed for the checklist (Create/List).

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    createSchedule,
  };
}
