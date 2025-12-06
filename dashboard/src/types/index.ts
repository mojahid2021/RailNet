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
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStationRequest {
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface UpdateStationRequest {
  name?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

// Train Route Types
export interface Compartment {
  id: string;
  name: string;
  class: string;
  type: string;
  price: number;
  totalSeats: number;
}

export interface CreateCompartmentRequest {
  name: string;
  class: string;
  type: string;
  price: number;
  totalSeats: number;
}

export interface UpdateCompartmentRequest {
  name?: string;
  class?: string;
  type?: string;
  price?: number;
  totalSeats?: number;
}

export interface TrainCompartment {
  id: number;
  compartment: Compartment;
  quantity: number;
}

export interface Train {
  id: number;
  name: string;
  number: string;
  trainRouteId?: number;
  trainRoute?: {
    id: number;
    name: string;
    startStation?: {
      id: string;
      name: string;
      city: string;
    };
    endStation?: {
      id: string;
      name: string;
      city: string;
    };
  };
  compartments: TrainCompartment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainRequest {
  name: string;
  number: string;
  trainRouteId: number;
  compartments: {
    compartmentId: number;
    quantity: number;
  }[];
}

export interface UpdateTrainRequest {
  name?: string;
  number?: string;
  trainRouteId?: number;
  compartments?: {
    compartmentId: number;
    quantity: number;
  }[];
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
  id: number;
  name: string;
  startStationId: string;
  endStationId: string;
  startStation?: Station;
  endStation?: Station;
  routeStations: RouteStation[];
  // Adding stations alias if the API returns it, or we map it
  stations?: RouteStation[]; 
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
  stations: {
    stationId: number;
    distance: number;
  }[];
}

export interface UpdateTrainRouteRequest {
  name?: string;
  totalDistance?: number;
  startStationId?: string;
  endStationId?: string;
}

// Schedule Types
export interface StationTime {
  id: number;
  trainScheduleId: number;
  stationId: number;
  station: Station;
  arrivalTime: string;
  departureTime: string;
  sequence: number;
}

export interface Schedule {
  id: number;
  trainId: number;
  trainRouteId: number;
  date: string;
  time: string;
  train?: Train;
  trainRoute?: TrainRoute; // Note: API response has trainRoute nested in train as well, but also at top level
  stationTimes: StationTime[];
  status?: string; // API response doesn't show status, but UI uses it. Keeping optional.
  departureTime?: string; // API has 'time' and 'date', but UI uses departureTime. Might need to derive or check if API provides it.
  // Actually, looking at the response, 'time' is "02:56" and 'date' is ISO.
  // The UI currently expects 'departureTime'. I might need to map it or update UI.
  // For now, I'll keep the type flexible to avoid breaking existing code too much, 
  // but I should probably map 'date' + 'time' to 'departureTime' or update UI to use 'date'/'time'.
  // Let's stick to the response structure for the main fields.
}

export interface CreateStationScheduleRequest {
  stationId: string;
  estimatedArrival: string;
  estimatedDeparture: string;
  platformNumber: string;
  remarks: string;
}

export interface CreateScheduleRequest {
  trainId: number;
  date: string;
  time: string;
  stationTimes: {
    stationId: number;
    arrivalTime: string;
    departureTime: string;
  }[];
}
