// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

//Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ActivityDataPoint {
  time: string;
  value: number;
}

// User List Types
export interface UserListItem {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
}

// Station Types
export interface Station {
  id: string;
  name: string;
  city: string;
  district: string;
  division: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStationRequest {
  name: string;
  city: string;
  district: string;
  division: string;
  latitude: number;
  longitude: number;
}

export interface UpdateStationRequest {
  name?: string;
  city?: string;
  district?: string;
  division?: string;
  latitude?: number;
  longitude?: number;
}

// Train Route Types
export interface Compartment {
  id: string;
  name: string;
  type: string;
  price: number;
  totalSeat: number;
}

export interface RouteStation {
  id: string;
  currentStationId: string;
  beforeStationId: string | null;
  nextStationId: string | null;
  distance: number;
  distanceFromStart: number;
  currentStation?: Station;
}

export interface TrainRoute {
  id: string;
  name: string;
  totalDistance: number;
  startStationId: string;
  endStationId: string;
  startStation?: Station;
  endStation?: Station;
  stations: RouteStation[];
  compartments: Compartment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRouteStationRequest {
  currentStationId: string;
  beforeStationId: string | null;
  nextStationId: string | null;
  distance: number;
  distanceFromStart: number;
}

export interface CreateTrainRouteRequest {
  name: string;
  totalDistance: number;
  startStationId: string;
  endStationId: string;
  stations: CreateRouteStationRequest[];
}

export interface UpdateTrainRouteRequest {
  name?: string;
  totalDistance?: number;
  startStationId?: string;
  endStationId?: string;
  compartmentIds?: string[];
}
