"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();

        if (data.success && data.user) {
          setUser(data.user);
        } else if (res.status === 503) {
          // Backend unavailable - silently fail and show fallback UI
          console.warn("Backend API unavailable. Using fallback user display.");
        }
      } catch (error) {
        // Network error or other issue - silently fail
        console.warn("Unable to fetch user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return { user, loading, logout };
}
