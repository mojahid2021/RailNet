// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  ENDPOINTS: {
    LOGIN: "/login",
    PROFILE: "/profile",
    STATIONS: "/stations",
    TRAIN_ROUTES: "/train-routes",
    COMPARTMENTS: "/compartments",
    TRAINS: "/trains",
    SCHEDULES: "/schedules",
  },
} as const;

// Chart Colors (using CSS variables for theme compatibility)
export const CHART_COLORS = {
  PRIMARY: "var(--chart-1)",
  SECONDARY: "var(--chart-2)",
  TERTIARY: "var(--chart-3)",
  QUATERNARY: "var(--chart-4)",
  QUINARY: "var(--chart-5)",
} as const;

// Static Chart Data
export const ACTIVITY_DATA = [
  { time: "08:00", value: 12 },
  { time: "10:00", value: 18 },
  { time: "12:00", value: 25 },
  { time: "14:00", value: 20 },
  { time: "16:00", value: 32 },
  { time: "18:00", value: 28 },
];

export const TRAFFIC_DATA = [
  { name: "Mon", passengers: 4000 },
  { name: "Tue", passengers: 3000 },
  { name: "Wed", passengers: 2000 },
  { name: "Thu", passengers: 2780 },
  { name: "Fri", passengers: 1890 },
  { name: "Sat", passengers: 2390 },
  { name: "Sun", passengers: 3490 },
];

export const REVENUE_DATA = [
  { name: "Tickets", value: 400 },
  { name: "Cargo", value: 300 },
  { name: "Services", value: 300 },
  { name: "Ads", value: 200 },
];

export const PUNCTUALITY_DATA = [
  { name: "Line A", onTime: 90, delayed: 10 },
  { name: "Line B", onTime: 85, delayed: 15 },
  { name: "Line C", onTime: 95, delayed: 5 },
  { name: "Line D", onTime: 80, delayed: 20 },
];

// Sample User Data
export const SAMPLE_USERS = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" as const },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "Active" as const },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "User", status: "Inactive" as const },
  { id: 4, name: "Alice Brown", email: "alice@example.com", role: "Editor", status: "Active" as const },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", role: "User", status: "Active" as const },
];
