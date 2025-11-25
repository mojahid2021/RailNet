"use client";

import { useState, useEffect } from "react";
import { Compartment, ApiResponse } from "@/types";
import { API_CONFIG } from "@/lib/constants";

export function useCompartments() {
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompartments = async () => {
      setLoading(true);
      try {
        // We'll assume a proxy route or direct call. 
        // Since we didn't create a proxy for compartments, let's try to use the direct endpoint 
        // via a new proxy route or just assume we need to create one?
        // Actually, for simplicity, let's just fetch from a new proxy route /api/compartments 
        // which I should create, OR just fetch directly if I can't create more files.
        // But I should create a proxy route for consistency.
        // For now, I will create a simple proxy route for compartments as well.
        const res = await fetch("/api/compartments");
        const data: ApiResponse<Compartment[]> = await res.json();

        if (data.success && data.data) {
          setCompartments(data.data);
        } else {
          setError(data.error || "Failed to fetch compartments");
        }
      } catch (err) {
        setError("Failed to load compartments");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompartments();
  }, []);

  return { compartments, loading, error };
}
