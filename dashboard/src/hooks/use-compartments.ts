import { useState, useCallback, useEffect } from "react";
import { Compartment, CreateCompartmentRequest, UpdateCompartmentRequest, ApiResponse } from "@/types";
import { API_CONFIG } from "@/lib/constants";

export function useCompartments() {
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compartments");
      const data: ApiResponse<Compartment[]> = await res.json();

      if (data.success && data.data) {
        setCompartments(data.data);
      } else {
        setError(data.error || "Failed to fetch compartments");
      }
    } catch (err) {
      setError("Network error occurred while fetching compartments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCompartment = async (data: CreateCompartmentRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compartments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData: ApiResponse<Compartment> = await res.json();

      if (responseData.success && responseData.data) {
        setCompartments((prev) => [responseData.data!, ...prev]);
        return true;
      } else {
        setError(responseData.error || "Failed to create compartment");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while creating compartment");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCompartment = async (id: string, data: UpdateCompartmentRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compartments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData: ApiResponse<Compartment> = await res.json();

      if (responseData.success && responseData.data) {
        setCompartments((prev) =>
          prev.map((item) => (item.id === id ? responseData.data! : item))
        );
        return true;
      } else {
        setError(responseData.error || "Failed to update compartment");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while updating compartment");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteCompartment = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compartments/${id}`, {
        method: "DELETE",
      });
      const responseData: ApiResponse<null> = await res.json();

      if (responseData.success) {
        setCompartments((prev) => prev.filter((item) => item.id !== id));
        return true;
      } else {
        setError(responseData.error || "Failed to delete compartment");
        return false;
      }
    } catch (err) {
      setError("Network error occurred while deleting compartment");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  // Note: We might want to control this from the component instead of auto-fetching here
  // but for now let's keep it consistent or just expose fetchCompartments
  // The previous implementation used useEffect. Let's keep useEffect for backward compatibility
  // but also expose fetchCompartments.
  
  // Actually, to avoid double fetching if we call fetchCompartments in component, 
  // let's remove the auto-fetch useEffect if we are going to call it manually.
  // But wait, existing code might rely on it.
  // Let's check if useCompartments was used elsewhere. 
  // It was used in TrainRouteForm.
  // In TrainRouteForm, we just called `const { compartments } = useCompartments()`.
  // So we should keep the useEffect for now, OR update TrainRouteForm to call fetchCompartments.
  // I'll keep useEffect but add dependency array check or just keep it simple.
  
  // Re-implementing useEffect to match previous behavior but using useCallback version
  // Wait, I can't use useEffect inside the replacement chunk easily if I'm replacing the whole body.
  // I will include it.

  useEffect(() => {
    fetchCompartments();
  }, [fetchCompartments]);

  return {
    compartments,
    loading,
    error,
    fetchCompartments,
    createCompartment,
    updateCompartment,
    deleteCompartment,
  };
}
