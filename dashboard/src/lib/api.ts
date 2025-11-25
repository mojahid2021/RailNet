import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors here (e.g., logging, toast notifications)
    // We can also handle 401 redirects here if needed
    if (error.response?.status === 401) {
      // Optional: Redirect to login or clear state
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
