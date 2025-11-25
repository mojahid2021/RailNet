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

export interface CreateCompartmentRequest {
  name: string;
  type: string;
  price: number;
  totalSeat: number;
}

export interface UpdateCompartmentRequest {
  name?: string;
  type?: string;
  price?: number;
  totalSeat?: number;
}

export interface TrainCompartment {
  id: string;
  compartment: Compartment;
}

export interface Train {
  id: string;
  name: string;
  number: string;
  type: string;
  trainRouteId?: string;
  trainRoute?: {
    id: string;
    name: string;
  };
  compartments: TrainCompartment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainRequest {
  name: string;
  number: string;
  type: string;
  trainRouteId?: string;
  compartmentIds?: string[];
}

export interface UpdateTrainRequest {
  name?: string;
  number?: string;
  type?: string;
  trainRouteId?: string;
  compartmentIds?: string[];
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

// Schedule Types
export interface StationSchedule {
  id: string;
  stationId: string;
  sequenceOrder: number;
  estimatedArrival: string;
  estimatedDeparture: string;
  durationFromPrevious: number;
  waitingTime: number;
  status: string;
  platformNumber: string;
  remarks: string;
  station?: Station;
}

export interface Schedule {
  id: string;
  trainId: string;
  routeId: string;
  departureDate: string;
  status: string;
  train?: Train;
  route?: TrainRoute;
  stationSchedules: StationSchedule[];
}

export interface CreateStationScheduleRequest {
  stationId: string;
  estimatedArrival: string;
  estimatedDeparture: string;
  platformNumber: string;
  remarks: string;
}

export interface CreateScheduleRequest {
  trainId: string;
  departureDate: string;
  stationSchedules: CreateStationScheduleRequest[];
}
