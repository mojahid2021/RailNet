# RailNet API Documentation

## Overview

RailNet is a comprehensive railway management system backend API built with Fastify, TypeScript, and Prisma. This API provides endpoints for user authentication, health monitoring, and railway operations management.

### Base URL

```
http://localhost:3000/api/v1
```

### API Versioning

All API endpoints are versioned under `/api/v1/`. The API follows semantic versioning principles.

### Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

The system supports three user roles:

- **ADMIN**: System administrators with full access
- **STAFF**: Railway staff (checkers) with operational access
- **PASSENGER**: Regular users for booking and travel

### Response Format

All responses follow a consistent JSON structure:

**Success Response:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Authentication Endpoints

### Register User

Register a new user account in the system.

**Endpoint:** `POST /auth/register`

**Request Body:**

```json
{
  "email": "passenger@example.com",
  "password": "StrongPass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "passenger@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PASSENGER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Validation Rules:**

- Email: Must be valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- First Name: 1-50 characters
- Last Name: 1-50 characters

**Error Responses:**

- `400` - Validation error or user already exists
- `409` - Email already registered

### Register Admin User

Register a new admin account in the system (separate endpoint for administrators).

**Endpoint:** `POST /auth/admin/register`

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "StrongAdminPass123!",
  "firstName": "Admin",
  "lastName": "User"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "user": {
      "id": "admin-uuid",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Validation Rules:**

- Email: Must be valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- First Name: 1-50 characters
- Last Name: 1-50 characters

**Error Responses:**

- `400` - Validation error or admin already exists
- `409` - Email already registered

### Register Staff User

Register a new staff account (admin only - requires authentication).

**Endpoint:** `POST /auth/admin/register-staff`

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**

```json
{
  "email": "staff@example.com",
  "password": "StrongStaffPass123!",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Staff registered successfully",
  "data": {
    "user": {
      "id": "staff-uuid",
      "email": "staff@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "STAFF"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Validation Rules:**

- Email: Must be valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- First Name: 1-50 characters
- Last Name: 1-50 characters

**Error Responses:**

- `400` - Validation error or staff already exists
- `403` - Forbidden (only admins can register staff)
- `409` - Email already registered

### Login Passenger User

Authenticate passenger user credentials and receive access token.

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PASSENGER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

- `400` - Invalid request format
- `401` - Invalid credentials

### Login Admin User

Authenticate admin user credentials and receive access token.

**Endpoint:** `POST /auth/admin/login`

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "StrongAdminPass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "id": "admin-uuid",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

- `400` - Invalid request format
- `401` - Invalid credentials

### Login Staff User

Authenticate staff user credentials and receive access token.

**Endpoint:** `POST /auth/staff/login`

**Request Body:**

```json
{
  "email": "staff@example.com",
  "password": "StrongStaffPass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Staff login successful",
  "data": {
    "user": {
      "id": "staff-uuid",
      "email": "staff@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "STAFF"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

- `400` - Invalid request format
- `401` - Invalid credentials

### Get User Profile

Retrieve current authenticated user's profile information.

**Endpoint:** `GET /auth/profile`

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PASSENGER",
    "isActive": true,
    "createdAt": "2025-11-18T10:00:00.000Z",
    "updatedAt": "2025-11-18T10:00:00.000Z"
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

- `401` - Authentication required or invalid token

### Refresh Token

Refresh access token using refresh token (future implementation).

**Endpoint:** `POST /auth/refresh`

**Status:** Not implemented (returns 501)

---

## Health Check Endpoints

### Basic Health Check

Simple health check endpoint for load balancers and monitoring systems.

**Endpoint:** `GET /health`

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "database": "connected"
  },
  "responseTime": "15ms"
}
```

**Response (503):**

```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "checks": {
    "database": "disconnected"
  },
  "error": "Database connection failed",
  "responseTime": "1500ms"
}
```

### Detailed Health Check

Comprehensive health check with system information and detailed service status.

**Endpoint:** `GET /health/detailed`

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "latency": "12ms",
      "timestamp": "2025-11-18T10:30:00.000Z"
    },
    "system": {
      "status": "healthy",
      "memory": {
        "rss": "85MB",
        "heapUsed": "65MB",
        "heapTotal": "120MB",
        "external": "2MB"
      },
      "platform": "linux",
      "nodeVersion": "v22.21.1",
      "timestamp": "2025-11-18T10:30:00.000Z"
    }
  },
  "responseTime": "25ms"
}
```

### Readiness Check

Kubernetes-style readiness probe for container orchestration.

**Endpoint:** `GET /health/ready`

**Response (200):**

```json
{
  "status": "ready",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Response (503):**

```json
{
  "status": "not ready",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "reason": "Database connection failed"
}
```

---

## Station Management Endpoints

RailNet provides comprehensive station management capabilities for railway infrastructure administration.

### Station Data Model

```typescript
interface Station {
  id: string;           // Unique identifier
  name: string;         // Station name (required)
  code: string;         // Auto-generated code (e.g., "CENTRAL")
  city: string;         // City name
  state: string;        // State/Province
  country: string;      // Country (default: "India")
  latitude?: number;    // GPS latitude (-90 to 90)
  longitude?: number;   // GPS longitude (-180 to 180)
  isActive: boolean;    // Active status
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

### Station Code Generation

Station codes are automatically generated from the station name:

- "Central Station" → "CENTRA"
- "Grand Central Terminal" → "GRANDC"
- "New York Penn Station" → "NEWWYO"

### Create Station

Create a new railway station (admin only).

**Endpoint:** `POST /stations/admin/stations`

**Headers:**

```text
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**

```json
{
  "name": "Central Station",
  "city": "Central Station",
  "state": "",
  "country": "India",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Station created successfully",
  "data": {
    "station": {
      "id": "station-uuid",
      "name": "Central Station",
      "code": "CENTRA",
      "city": "Central Station",
      "state": "",
      "country": "India",
      "latitude": 40.7128,
      "longitude": -74.006,
      "isActive": true,
      "createdAt": "2025-11-18T10:30:00.000Z",
      "updatedAt": "2025-11-18T10:30:00.000Z"
    }
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Validation Rules:**

- Name: Required, 1-100 characters
- Latitude: Optional, -90 to 90
- Longitude: Optional, -180 to 180

**Error Responses:**

- `400` - Validation error
- `403` - Forbidden (admin access required)
- `409` - Station with this name already exists

### Get All Stations

Retrieve all active railway stations (public access).

**Endpoint:** `GET /stations/stations`

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "station-uuid-1",
      "name": "Central Station",
      "code": "CENTRA",
      "city": "Central Station",
      "state": "",
      "country": "India",
      "latitude": 40.7128,
      "longitude": -74.006,
      "isActive": true,
      "createdAt": "2025-11-18T10:00:00.000Z",
      "updatedAt": "2025-11-18T10:00:00.000Z"
    },
    {
      "id": "station-uuid-2",
      "name": "Grand Central Station",
      "code": "GRANDC",
      "city": "Grand Central Station",
      "state": "",
      "country": "India",
      "latitude": 40.7527,
      "longitude": -73.9772,
      "isActive": true,
      "createdAt": "2025-11-18T10:15:00.000Z",
      "updatedAt": "2025-11-18T10:15:00.000Z"
    }
  ],
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### Get Station by ID

Retrieve a specific station by its unique identifier (public access).

**Endpoint:** `GET /stations/stations/{id}`

**Parameters:**

- `id` (path): Station UUID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "station-uuid",
    "name": "Central Station",
    "code": "CENTRA",
    "city": "Central Station",
    "state": "",
    "country": "India",
    "latitude": 40.7128,
    "longitude": -74.006,
    "isActive": true,
    "createdAt": "2025-11-18T10:00:00.000Z",
    "updatedAt": "2025-11-18T10:00:00.000Z"
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

- `404` - Station not found

### Search Stations

Search stations by name, code, or city (public access).

**Endpoint:** `GET /stations/stations/search/{query}`

**Parameters:**

- `query` (path): Search term (minimum 1 character)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "station-uuid",
      "name": "Central Station",
      "code": "CENTRA",
      "city": "Central Station",
      "state": "",
      "country": "India",
      "latitude": 40.7128,
      "longitude": -74.006,
      "isActive": true,
      "createdAt": "2025-11-18T10:00:00.000Z",
      "updatedAt": "2025-11-18T10:00:00.000Z"
    }
  ],
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### Update Station

Update station information (admin only).

**Endpoint:** `PUT /stations/admin/stations/{id}`

**Headers:**

```text
Authorization: Bearer <admin-jwt-token>
```

**Parameters:**

- `id` (path): Station UUID

**Request Body:**

```json
{
  "name": "Updated Central Station",
  "latitude": 40.7130,
  "longitude": -74.0065
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Station updated successfully",
  "data": {
    "station": {
      "id": "station-uuid",
      "name": "Updated Central Station",
      "code": "UPDATED",
      "city": "Updated Central Station",
      "state": "",
      "country": "India",
      "latitude": 40.7130,
      "longitude": -74.0065,
      "isActive": true,
      "createdAt": "2025-11-18T10:00:00.000Z",
      "updatedAt": "2025-11-18T10:30:00.000Z"
    }
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Validation Rules:**

- Name: Optional, 1-100 characters if provided
- Latitude: Optional, -90 to 90 if provided
- Longitude: Optional, -180 to 180 if provided

**Error Responses:**

- `400` - Validation error
- `403` - Forbidden (admin access required)
- `404` - Station not found

### Deactivate Station

Deactivate a station (admin only - soft delete).

**Endpoint:** `DELETE /stations/admin/stations/{id}`

**Headers:**

```text
Authorization: Bearer <admin-jwt-token>
```

**Parameters:**

- `id` (path): Station UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Station deactivated successfully",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

- `403` - Forbidden (admin access required)
- `404` - Station not found

---

## Coach Type Management Endpoints

RailNet provides comprehensive coach type management for railway class of travel administration. Coach types define different service classes with varying pricing structures.

### Coach Type Data Model

```typescript
interface CoachType {
  id: string;           // Unique identifier
  name: string;         // Coach type name (e.g., "AC Berth")
  code: string;         // Auto-generated code (e.g., "ACBERTH")
  description?: string; // Optional description
  ratePerKm: number;    // Rate per kilometer in INR
  isActive: boolean;    // Active status
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

### Default Coach Types

The system includes these predefined coach types with different pricing tiers:

| Coach Type | Code | Rate per Km (INR) | Description |
|------------|------|-------------------|-------------|
| Shovan | SHOVAN | 0.5 | Lowest cost general class |
| Shovan Chair | SHOVAN1 | 0.75 | Chair car in Shovan class |
| First Class Seat / Berth | FIRSTC | 2.0 | First class accommodation with seats and berths |
| Snigdha | SNIGDH | 1.25 | Premium non-AC class |
| AC Seat | ACSEAT | 1.5 | Air-conditioned seating |
| AC Berth | ACBERT | 2.5 | Air-conditioned berth accommodation |
| AC Cabin | ACCABI | 3.0 | Highest cost air-conditioned cabin |

### Coach Type Code Generation

Coach type codes are automatically generated from the name:

- "AC Berth" → "ACBERTH"
- "First Class Seat" → "FIRSTCL"
- "Shovan Chair" → "SHOVANC"

### Create Coach Type

Create a new coach type (admin only).

**Endpoint:** `POST /coach-types/admin`

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**

```json
{
  "name": "Business Class",
  "description": "Premium business class seating",
  "ratePerKm": 5.0
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Coach type created successfully",
  "data": {
    "coachType": {
      "id": "coach-type-uuid",
      "name": "Business Class",
      "code": "BUSINES",
      "description": "Premium business class seating",
      "ratePerKm": 5.0,
      "isActive": true,
      "createdAt": "2025-11-18T10:30:00.000Z",
      "updatedAt": "2025-11-18T10:30:00.000Z"
    }
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Validation Rules:**

- Name: Required, 1-100 characters
- Description: Optional, max 500 characters
- Rate per Km: Required, 0-100 INR

**Error Responses:**

- `400` - Validation error
- `403` - Forbidden (admin access required)
- `409` - Coach type with this name already exists

### Get All Coach Types

Retrieve all active coach types (public access).

**Endpoint:** `GET /coach-types`

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "coach-type-uuid-1",
      "name": "Shovan",
      "code": "SHOVAN",
      "description": "Lowest cost general class",
      "ratePerKm": 0.5,
      "isActive": true,
      "createdAt": "2025-11-18T10:00:00.000Z",
      "updatedAt": "2025-11-18T10:00:00.000Z"
    },
    {
      "id": "coach-type-uuid-2",
      "name": "AC Berth",
      "code": "ACBERTH",
      "description": "Air-conditioned sleeping berth",
      "ratePerKm": 3.0,
      "isActive": true,
      "createdAt": "2025-11-18T10:15:00.000Z",
      "updatedAt": "2025-11-18T10:15:00.000Z"
    }
  ],
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### Get Coach Type by ID

Retrieve a specific coach type by its unique identifier (public access).

**Endpoint:** `GET /coach-types/{id}`

**Parameters:**

- `id` (path): Coach type UUID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "coach-type-uuid",
    "name": "AC Berth",
    "code": "ACBERTH",
    "description": "Air-conditioned sleeping berth",
    "ratePerKm": 3.0,
    "isActive": true,
    "createdAt": "2025-11-18T10:00:00.000Z",
    "updatedAt": "2025-11-18T10:00:00.000Z"
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

- `404` - Coach type not found

### Search Coach Types

Search coach types by name, code, or description (public access).

**Endpoint:** `GET /coach-types/search/{query}`

**Parameters:**

- `query` (path): Search term (minimum 1 character)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "coach-type-uuid",
      "name": "AC Berth",
      "code": "ACBERTH",
      "description": "Air-conditioned sleeping berth",
      "ratePerKm": 3.0,
      "isActive": true,
      "createdAt": "2025-11-18T10:00:00.000Z",
      "updatedAt": "2025-11-18T10:00:00.000Z"
    }
  ],
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### Update Coach Type

Update coach type information (admin only).

**Endpoint:** `PUT /coach-types/admin/{id}`

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Parameters:**

- `id` (path): Coach type UUID

**Request Body:**

```json
{
  "name": "Premium AC Berth",
  "ratePerKm": 3.5
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Coach type updated successfully",
  "data": {
    "coachType": {
      "id": "coach-type-uuid",
      "name": "Premium AC Berth",
      "code": "PREMIUM",
      "description": "Air-conditioned sleeping berth",
      "ratePerKm": 3.5,
      "isActive": true,
      "createdAt": "2025-11-18T10:00:00.000Z",
      "updatedAt": "2025-11-18T10:30:00.000Z"
    }
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Validation Rules:**

- Name: Optional, 1-100 characters if provided
- Description: Optional, max 500 characters if provided
- Rate per Km: Optional, 0-100 INR if provided

**Error Responses:**

- `400` - Validation error
- `403` - Forbidden (admin access required)
- `404` - Coach type not found

### Deactivate Coach Type

Deactivate a coach type (admin only - soft delete).

**Endpoint:** `DELETE /coach-types/admin/{id}`

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Parameters:**

- `id` (path): Coach type UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Coach type deactivated successfully",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

- `403` - Forbidden (admin access required)
- `404` - Coach type not found

### Initialize Default Coach Types

Initialize the system with default coach types (admin only).

**Endpoint:** `POST /coach-types/admin/initialize`

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Default coach types initialized successfully",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

- `403` - Forbidden (admin access required)

---

## Coach Management Endpoints

RailNet provides comprehensive coach management for train configuration. Coaches are assigned to trains with specific coach types, numbers, and seating capacities.

### Coach Data Model

```typescript
interface Coach {
  id: string;           // Unique identifier
  trainId: string;      // Reference to train
  coachTypeId: string;  // Reference to coach type
  coachNumber: string;  // Coach number (e.g., "A1", "B2")
  totalSeats: number;   // Total number of seats/berths
  isActive: boolean;    // Active status
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
  coachType: {          // Coach type details
    id: string;
    name: string;
    code: string;
    description?: string;
    ratePerKm: number;
  };
  train: {              // Train details
    id: string;
    name: string;
    number: string;
  };
}
```

### Coach Number Format

Coach numbers follow a standard format:
- **Letter prefix**: Indicates coach class (A, B, C, etc.)
- **Number suffix**: Sequential number within the class
- Examples: `A1`, `B2`, `S1`, `AC1`

### Create Coach

Create a new coach for a train (admin only).

**Endpoint:** `POST /coaches/admin`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "trainId": "train-uuid",
  "coachTypeId": "coach-type-uuid",
  "coachNumber": "A1",
  "totalSeats": 72
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Coach created successfully",
  "data": {
    "coach": {
      "id": "coach-uuid",
      "trainId": "train-uuid",
      "coachTypeId": "coach-type-uuid",
      "coachNumber": "A1",
      "totalSeats": 72,
      "isActive": true,
      "createdAt": "2025-11-20T10:30:00.000Z",
      "updatedAt": "2025-11-20T10:30:00.000Z",
      "coachType": {
        "id": "coach-type-uuid",
        "name": "AC Berth",
        "code": "ACBERT",
        "description": "Air-conditioned berth accommodation",
        "ratePerKm": 2.5
      },
      "train": {
        "id": "train-uuid",
        "name": "Rajdhani Express",
        "number": "12951"
      }
    }
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Validation Rules:**
- trainId: Required, valid train UUID
- coachTypeId: Required, valid coach type UUID
- coachNumber: Required, 1-10 characters, unique per train
- totalSeats: Required, 1-200 seats

**Error Responses:**
- `400` - Validation error
- `403` - Forbidden (admin access required)
- `404` - Train or coach type not found

### Get Coaches by Train

Retrieve all coaches for a specific train (public access).

**Endpoint:** `GET /trains/{trainId}/coaches`

**Parameters:**
- `trainId` (path): Train UUID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "coach-uuid-1",
      "trainId": "train-uuid",
      "coachTypeId": "coach-type-uuid-1",
      "coachNumber": "A1",
      "totalSeats": 72,
      "isActive": true,
      "createdAt": "2025-11-20T10:00:00.000Z",
      "updatedAt": "2025-11-20T10:00:00.000Z",
      "coachType": {
        "id": "coach-type-uuid-1",
        "name": "AC Berth",
        "code": "ACBERT",
        "description": "Air-conditioned berth accommodation",
        "ratePerKm": 2.5
      },
      "train": {
        "id": "train-uuid",
        "name": "Rajdhani Express",
        "number": "12951"
      }
    },
    {
      "id": "coach-uuid-2",
      "trainId": "train-uuid",
      "coachTypeId": "coach-type-uuid-2",
      "coachNumber": "B1",
      "totalSeats": 64,
      "isActive": true,
      "createdAt": "2025-11-20T10:15:00.000Z",
      "updatedAt": "2025-11-20T10:15:00.000Z",
      "coachType": {
        "id": "coach-type-uuid-2",
        "name": "AC Seat",
        "code": "ACSEAT",
        "description": "Air-conditioned seating",
        "ratePerKm": 1.5
      },
      "train": {
        "id": "train-uuid",
        "name": "Rajdhani Express",
        "number": "12951"
      }
    }
  ],
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

### Get Coach by ID

Retrieve a specific coach by its unique identifier (public access).

**Endpoint:** `GET /coaches/{id}`

**Parameters:**
- `id` (path): Coach UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "coach": {
      "id": "coach-uuid",
      "trainId": "train-uuid",
      "coachTypeId": "coach-type-uuid",
      "coachNumber": "A1",
      "totalSeats": 72,
      "isActive": true,
      "createdAt": "2025-11-20T10:00:00.000Z",
      "updatedAt": "2025-11-20T10:00:00.000Z",
      "coachType": {
        "id": "coach-type-uuid",
        "name": "AC Berth",
        "code": "ACBERT",
        "description": "Air-conditioned berth accommodation",
        "ratePerKm": 2.5
      },
      "train": {
        "id": "train-uuid",
        "name": "Rajdhani Express",
        "number": "12951"
      }
    }
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Error Responses:**
- `404` - Coach not found

### Update Coach

Update coach information (admin only).

**Endpoint:** `PUT /coaches/admin/{id}`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Parameters:**
- `id` (path): Coach UUID

**Request Body:**
```json
{
  "coachTypeId": "new-coach-type-uuid",
  "coachNumber": "A2",
  "totalSeats": 80
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Coach updated successfully",
  "data": {
    "coach": {
      "id": "coach-uuid",
      "trainId": "train-uuid",
      "coachTypeId": "new-coach-type-uuid",
      "coachNumber": "A2",
      "totalSeats": 80,
      "isActive": true,
      "createdAt": "2025-11-20T10:00:00.000Z",
      "updatedAt": "2025-11-20T10:30:00.000Z",
      "coachType": {
        "id": "new-coach-type-uuid",
        "name": "First Class Berth",
        "code": "FIRSTC",
        "description": "First class accommodation with seats and berths",
        "ratePerKm": 2.0
      },
      "train": {
        "id": "train-uuid",
        "name": "Rajdhani Express",
        "number": "12951"
      }
    }
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Validation Rules:**
- coachTypeId: Optional, valid coach type UUID if provided
- coachNumber: Optional, 1-10 characters, unique per train if provided
- totalSeats: Optional, 1-200 seats if provided

**Error Responses:**
- `400` - Validation error
- `403` - Forbidden (admin access required)
- `404` - Coach not found

### Delete Coach

Deactivate a coach (admin only - soft delete).

**Endpoint:** `DELETE /coaches/admin/{id}`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Parameters:**
- `id` (path): Coach UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Coach deleted successfully",
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Error Responses:**
- `403` - Forbidden (admin access required)
- `404` - Coach not found

### Get All Coaches

Retrieve all coaches across all trains (admin only).

**Endpoint:** `GET /coaches/admin`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "coach-uuid-1",
      "trainId": "train-uuid-1",
      "coachTypeId": "coach-type-uuid-1",
      "coachNumber": "A1",
      "totalSeats": 72,
      "isActive": true,
      "createdAt": "2025-11-20T10:00:00.000Z",
      "updatedAt": "2025-11-20T10:00:00.000Z",
      "coachType": {
        "id": "coach-type-uuid-1",
        "name": "AC Berth",
        "code": "ACBERT",
        "description": "Air-conditioned berth accommodation",
        "ratePerKm": 2.5
      },
      "train": {
        "id": "train-uuid-1",
        "name": "Rajdhani Express",
        "number": "12951"
      }
    }
  ],
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Error Responses:**
- `403` - Forbidden (admin access required)

---

## Train Management Endpoints

RailNet provides comprehensive train management for railway operations. Trains are created with automatic coach assignment and seat calculation based on coach type configurations.

### Train Data Model

```typescript
interface Train {
  id: string;              // Unique identifier
  name: string;            // Train name (e.g., "Rajdhani Express")
  number: string;          // Train number (e.g., "12951")
  type: TrainType;         // Train type enum
  routeId?: string;        // Optional route assignment
  totalSeats: number;      // Total seats calculated from coaches
  isActive: boolean;       // Active status
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp

  // Relations
  route?: Route;           // Associated route
  coaches: Coach[];        // Train coaches
}

type TrainType = 'EXPRESS' | 'SUPERFAST' | 'MAIL' | 'PASSENGER' | 'SHATABDI' | 'RAJDHANI';
```

### Coach Configuration

When creating trains, coaches are specified using coach type codes and counts:

```typescript
interface CoachConfig {
  coachTypeCode: string;   // Coach type code (e.g., "ACBERT")
  count: number;           // Number of coaches of this type
}
```

### Create Train

Create a new train with automatic coach assignment and seat calculation (admin only).

**Endpoint:** `POST /trains/admin`

**Headers:**

```http
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Delhi Mumbai Express",
  "number": "12951",
  "type": "EXPRESS",
  "routeId": "route-uuid",
  "coaches": [
    {
      "coachTypeCode": "ACBERT",
      "count": 2
    },
    {
      "coachTypeCode": "ACSEAT",
      "count": 3
    },
    {
      "coachTypeCode": "SNIGDH",
      "count": 4
    }
  ]
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Train created successfully",
  "data": {
    "id": "train-uuid",
    "name": "Delhi Mumbai Express",
    "number": "12951",
    "type": "EXPRESS",
    "routeId": "route-uuid",
    "totalSeats": 1012,
    "isActive": true,
    "createdAt": "2025-11-20T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:00:00.000Z",
    "coaches": [
      {
        "id": "coach-uuid-1",
        "coachNumber": "ACBERT01",
        "totalSeats": 54,
        "coachType": {
          "code": "ACBERT",
          "name": "AC Berth",
          "totalSeats": 54
        }
      },
      {
        "id": "coach-uuid-2",
        "coachNumber": "ACBERT02",
        "totalSeats": 54,
        "coachType": {
          "code": "ACBERT",
          "name": "AC Berth",
          "totalSeats": 54
        }
      }
    ]
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Validation Rules:**

- `name`: Required, 1-100 characters
- `number`: Required, 1-10 characters, unique
- `type`: Required, must be valid train type
- `routeId`: Optional, must be valid UUID if provided
- `coaches`: Required, array of coach configurations
- `coachTypeCode`: Required, must exist in coach types
- `count`: Required, 1-50 coaches per type

**Error Responses:**

- `400` - Validation error (invalid data)
- `401` - Authentication required
- `403` - Admin access required
- `404` - Coach type not found
- `409` - Train number already exists

### Get All Trains

Retrieve all trains with optional filtering (public access).

**Endpoint:** `GET /trains`

**Query Parameters:**
- `type` (optional): Filter by train type
- `routeId` (optional): Filter by route
- `active` (optional): Filter by active status (true/false)
- `limit` (optional): Limit results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "train-uuid-1",
      "name": "Rajdhani Express",
      "number": "12951",
      "type": "RAJDHANI",
      "routeId": "route-uuid",
      "totalSeats": 1012,
      "isActive": true,
      "createdAt": "2025-11-20T10:00:00.000Z",
      "updatedAt": "2025-11-20T10:00:00.000Z",
      "route": {
        "id": "route-uuid",
        "name": "Delhi to Mumbai Route",
        "code": "DEL-MUM"
      },
      "_count": {
        "coaches": 15
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

### Get Train by ID

Retrieve detailed information about a specific train (public access).

**Endpoint:** `GET /trains/{id}`

**Parameters:**
- `id` (path): Train UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "train-uuid",
    "name": "Rajdhani Express",
    "number": "12951",
    "type": "RAJDHANI",
    "routeId": "route-uuid",
    "totalSeats": 1012,
    "isActive": true,
    "createdAt": "2025-11-20T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:00:00.000Z",
    "route": {
      "id": "route-uuid",
      "name": "Delhi to Mumbai Route",
      "code": "DEL-MUM",
      "distance": 1384,
      "duration": 420
    },
    "coaches": [
      {
        "id": "coach-uuid-1",
        "coachNumber": "ACBERT01",
        "totalSeats": 54,
        "coachType": {
          "id": "coach-type-uuid",
          "name": "AC Berth",
          "code": "ACBERT",
          "totalSeats": 54
        }
      }
    ]
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Error Responses:**
- `404` - Train not found

### Get Train by Number

Retrieve train information by train number (public access).

**Endpoint:** `GET /trains/number/{number}`

**Parameters:**
- `number` (path): Train number

**Response (200):** Same as Get Train by ID

### Get Trains by Route

Retrieve all trains assigned to a specific route (public access).

**Endpoint:** `GET /trains/route/{routeId}`

**Parameters:**
- `routeId` (path): Route UUID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "train-uuid-1",
      "name": "Rajdhani Express",
      "number": "12951",
      "type": "RAJDHANI",
      "totalSeats": 1012,
      "isActive": true,
      "createdAt": "2025-11-20T10:00:00.000Z",
      "updatedAt": "2025-11-20T10:00:00.000Z"
    }
  ],
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

### Update Train

Update train information (admin only).

**Endpoint:** `PUT /trains/admin/{id}`

**Headers:**

```http
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Parameters:**

- `id` (path): Train UUID

**Request Body:**

```json
{
  "name": "Updated Train Name",
  "type": "SUPERFAST",
  "routeId": "new-route-uuid",
  "isActive": true
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Train updated successfully",
  "data": {
    "id": "train-uuid",
    "name": "Updated Train Name",
    "number": "12951",
    "type": "SUPERFAST",
    "routeId": "new-route-uuid",
    "totalSeats": 1012,
    "isActive": true,
    "updatedAt": "2025-11-20T11:00:00.000Z"
  },
  "timestamp": "2025-11-20T11:00:00.000Z"
}
```

**Error Responses:**

- `400` - Validation error
- `401` - Authentication required
- `403` - Admin access required
- `404` - Train not found
- `409` - Train number conflict

### Delete Train

Deactivate a train (admin only). Note: Trains are soft-deleted by setting isActive to false.

**Endpoint:** `DELETE /trains/admin/{id}`

**Headers:**

```http
Authorization: Bearer <admin-jwt-token>
```

**Parameters:**

- `id` (path): Train UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Train deactivated successfully",
  "timestamp": "2025-11-20T11:00:00.000Z"
}
```

**Error Responses:**

- `401` - Authentication required
- `403` - Admin access required
- `404` - Train not found

---

## Error Codes

### Authentication Errors

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `TOKEN_EXPIRED` - JWT token has expired
- `INVALID_TOKEN` - Invalid or malformed JWT token
- `AUTHENTICATION_ERROR` - Invalid credentials

### Validation Errors

- `VALIDATION_ERROR` - Input validation failed
- `INVALID_INPUT` - Invalid request data
- `MISSING_REQUIRED_FIELD` - Required field is missing

### Resource Errors

- `NOT_FOUND` - Requested resource not found
- `ALREADY_EXISTS` - Resource already exists
- `CONFLICT` - Operation conflicts with current state

### System Errors

- `INTERNAL_ERROR` - Unexpected server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `DATABASE_ERROR` - Database operation failed

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default Limit:** 100 requests per 15 minutes per IP
- **Headers:** Rate limit information is included in response headers
- **Status:** 429 Too Many Requests when limit exceeded

---

## Security Features

### CORS

Cross-Origin Resource Sharing is configured based on environment settings.

### Helmet

Security headers are automatically applied to all responses.

### Input Validation

All input data is validated using Zod schemas with detailed error messages.

### JWT Security

- Tokens expire after 24 hours by default
- Tokens include issuer, audience, and expiration claims
- Secure token storage recommended on client side

---

## SDKs and Examples

### JavaScript/TypeScript Example

```javascript
const API_BASE = 'http://localhost:3000/api/v1';

// Register user
const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  return response.json();
};

// Login user
const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (data.success) {
    // Store token securely
    localStorage.setItem('token', data.data.token);
  }

  return data;
};

// Authenticated request
const getUserProfile = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
};

// Health check
const checkHealth = async () => {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
};
```

### cURL Examples

```bash
# Register passenger
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "passenger@example.com",
    "password": "StrongPass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Register admin
curl -X POST http://localhost:3000/api/v1/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongAdminPass123!",
    "firstName": "Admin",
    "lastName": "User"
  }'

# Admin login
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongAdminPass123!"
  }'

# Register staff (requires admin token)
curl -X POST http://localhost:3000/api/v1/auth/admin/register-staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "email": "staff@example.com",
    "password": "StrongStaffPass123!",
    "firstName": "Jane",
    "lastName": "Smith"
  }'

# Staff login
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@example.com",
    "password": "StrongStaffPass123!"
  }'

# Passenger login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "passenger@example.com",
    "password": "StrongPass123!"
  }'

# Get profile (authenticated)
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Health check
curl http://localhost:3000/api/v1/health
```

---

## Development and Testing

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure database and JWT settings
3. Run `npm install`
4. Run `npm run db:migrate`
5. Start development server: `npm run dev`

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

### API Documentation Access

When running the server, API documentation is available at:

```http
http://localhost:3000/api/v1/documentation
```

---

## Route Management Endpoints

RailNet provides comprehensive route management for railway network administration. Routes define the paths trains take between stations with detailed stop information.

### Route Data Models

```typescript
interface RouteStop {
  id: string;                    // Unique identifier
  routeId: string;               // Parent route ID
  stationId: string;             // Station ID
  stopOrder: number;             // Order in route sequence
  arrivalTime: string | null;    // Arrival time (HH:MM format)
  departureTime: string | null;  // Departure time (HH:MM format)
  distance: number;              // Distance from previous stop (km)
  distanceFromStart: number;     // Cumulative distance from start (km)
  platform: string | null;       // Platform number/name
  isActive: boolean;             // Active status
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  station: Station;              // Station details
}

interface Route {
  id: string;           // Unique identifier
  name: string;         // Route name (required)
  code: string;         // Auto-generated route code (e.g., "DEL-MUM")
  distance: number;     // Total route distance (km)
  duration: number;     // Total travel duration (minutes)
  isActive: boolean;    // Active status
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
  stops: RouteStop[];   // Route stops with station details
  stations: Station[];  // All stations on route
  trainCount?: number;  // Number of trains using this route
  averageSpeed: number; // Average speed (km/h)
  stopCount: number;    // Number of stops on route
}
```

### Route Features

#### Auto-Generated Route Codes

Routes automatically generate unique codes based on the first and last station codes (e.g., "DEL-MUM" for Delhi to Mumbai). These codes are unique across the system and provide a quick identifier for routes.

#### Travel Validation

The system validates realistic travel times and distances:

- **Minimum Speed**: Routes must have an average speed of at least 30 km/h
- **Maximum Speed**: Routes cannot exceed 200 km/h average speed
- **Realistic Duration**: Travel time must be proportional to distance (allowing for stops and realistic speeds)

#### Computed Statistics

Routes automatically calculate:

- **Average Speed**: Distance divided by travel time (hours)
- **Stop Count**: Total number of stops on the route
- **Train Count**: Number of trains currently assigned to the route

#### Advanced Filtering

The route listing endpoint supports comprehensive filtering:

- Distance ranges (min/max)
- Duration ranges (min/max)
- Sorting by name, distance, duration, or creation date
- Text search in route names
- Station-based filtering

### Create Routes

Create one or more new railway routes (admin only).

**Endpoint:** `POST /admin/routes`

**Headers:**

```text
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**

```json
{
  "routes": [
    {
      "name": "Delhi to Mumbai Express Route",
      "distance": 1384,
      "duration": 960,
      "stops": [
        {
          "stationId": "station-uuid-1",
          "departureTime": "06:00",
          "distanceFromStart": 0,
          "platform": "1"
        },
        {
          "stationId": "station-uuid-2",
          "arrivalTime": "08:30",
          "departureTime": "08:45",
          "distanceFromStart": 200,
          "platform": "2"
        },
        {
          "stationId": "station-uuid-3",
          "arrivalTime": "18:00",
          "distanceFromStart": 1384
        }
      ]
    }
  ]
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "1 route(s) created successfully",
  "data": {
    "routes": [
      {
        "id": "route-uuid",
        "name": "Delhi to Mumbai Express Route",
        "code": "DEL-MUM",
        "distance": 1384,
        "duration": 960,
        "isActive": true,
        "createdAt": "2025-11-20T10:30:00.000Z",
        "updatedAt": "2025-11-20T10:30:00.000Z",
        "trainCount": 0,
        "averageSpeed": 86.25,
        "stopCount": 3,
        "stops": [
          {
            "id": "stop-uuid-1",
            "routeId": "route-uuid",
            "stationId": "station-uuid-1",
            "stopOrder": 1,
            "arrivalTime": null,
            "departureTime": "06:00",
            "distance": 0,
            "distanceFromStart": 0,
            "platform": "1",
            "isActive": true,
            "createdAt": "2025-11-20T10:30:00.000Z",
            "updatedAt": "2025-11-20T10:30:00.000Z",
            "station": {
              "id": "station-uuid-1",
              "name": "New Delhi Station",
              "code": "NDLS",
              "city": "New Delhi",
              "state": "Delhi",
              "country": "India",
              "latitude": 28.6139,
              "longitude": 77.2090,
              "isActive": true,
              "createdAt": "2025-11-20T09:00:00.000Z",
              "updatedAt": "2025-11-20T09:00:00.000Z"
            }
          }
        ],
        "stations": [
          {
            "id": "station-uuid-1",
            "name": "New Delhi Station",
            "code": "NDLS",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "isActive": true,
            "createdAt": "2025-11-20T09:00:00.000Z",
            "updatedAt": "2025-11-20T09:00:00.000Z"
          }
        ]
      }
    ]
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Validation Rules:**

- Routes array: Required, 1-50 routes
- Name: Required, 1-100 characters
- Distance: Required, 0-10000 km
- Duration: Required, 1-10000 minutes
- Stops: Required, 2-100 stops per route
- Station ID: Required, valid station UUID
- Arrival/Departure Time: Optional, HH:MM format (00:00-23:59)
- Distance from Start: Required, non-negative
- Platform: Optional, max 10 characters

**Error Responses:**

- `400` - Validation error
- `403` - Forbidden (admin access required)
- `404` - Station not found
- `409` - Route with this name already exists

### Get Routes

Retrieve routes with optional filtering (public access).

**Endpoint:** `GET /routes`

**Query Parameters:**

- `isActive` (boolean): Filter by active status (default: true)
- `search` (string): Search in route names
- `stationId` (string): Filter routes that include specific station
- `minDistance` (number): Minimum route distance in km
- `maxDistance` (number): Maximum route distance in km
- `minDuration` (number): Minimum travel duration in minutes
- `maxDuration` (number): Maximum travel duration in minutes
- `sortBy` (string): Sort field - `name`, `distance`, `duration`, `createdAt`
- `sortOrder` (string): Sort order - `asc` or `desc`

**Examples:**

```text
GET /routes
GET /routes?isActive=true
GET /routes?search=express
GET /routes?stationId=station-uuid
GET /routes?minDistance=500&maxDistance=1500
GET /routes?sortBy=distance&sortOrder=desc
```

**Response (200):**

```json
{
  "success": true,
  "message": "3 route(s) retrieved successfully",
  "data": {
    "routes": [
      {
        "id": "route-uuid",
        "name": "Delhi to Mumbai Express Route",
        "code": "DEL-MUM",
        "distance": 1384,
        "duration": 960,
        "isActive": true,
        "createdAt": "2025-11-20T10:30:00.000Z",
        "updatedAt": "2025-11-20T10:30:00.000Z",
        "trainCount": 2,
        "averageSpeed": 86.25,
        "stopCount": 3,
        "stops": [
          {
            "id": "stop-uuid-1",
            "routeId": "route-uuid",
            "stationId": "station-uuid-1",
            "stopOrder": 1,
            "arrivalTime": null,
            "departureTime": "06:00",
            "distance": 0,
            "distanceFromStart": 0,
            "platform": "1",
            "isActive": true,
            "createdAt": "2025-11-20T10:30:00.000Z",
            "updatedAt": "2025-11-20T10:30:00.000Z",
            "station": {
              "id": "station-uuid-1",
              "name": "New Delhi Station",
              "code": "NDLS",
              "city": "New Delhi",
              "state": "Delhi",
              "country": "India",
              "latitude": 28.6139,
              "longitude": 77.2090,
              "isActive": true,
              "createdAt": "2025-11-20T09:00:00.000Z",
              "updatedAt": "2025-11-20T09:00:00.000Z"
            }
          }
        ],
        "stations": [
          {
            "id": "station-uuid-1",
            "name": "New Delhi Station",
            "code": "NDLS",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "latitude": 28.6139,
              "longitude": 77.2090,
              "isActive": true,
              "createdAt": "2025-11-20T09:00:00.000Z",
              "updatedAt": "2025-11-20T09:00:00.000Z"
            }
          ]
        }
      }
    ]
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

### Get Route by ID

Retrieve a specific route by its ID (public access).

**Endpoint:** `GET /routes/{routeId}`

**Parameters:**

- `routeId` (path): Route UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Route retrieved successfully",
  "data": {
    "route": {
      "id": "route-uuid",
      "name": "Delhi to Mumbai Express Route",
      "code": "DEL-MUM",
      "distance": 1384,
      "duration": 960,
      "isActive": true,
      "createdAt": "2025-11-20T10:30:00.000Z",
      "updatedAt": "2025-11-20T10:30:00.000Z",
      "trainCount": 2,
      "averageSpeed": 86.25,
      "stopCount": 3,
      "stops": [...],
      "stations": [...]
    }
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Error Responses:**

- `404` - Route not found

### Get Routes by Station

Retrieve all routes that include a specific station (public access).

**Endpoint:** `GET /routes/station/{stationId}`

**Parameters:**

- `stationId` (path): Station UUID

**Response (200):**

```json
{
  "success": true,
  "message": "2 route(s) found for station",
  "data": {
    "routes": [
      {
        "id": "route-uuid-1",
        "name": "Delhi to Mumbai Express Route",
        "code": "DEL-MUM",
        "distance": 1384,
        "duration": 960,
        "isActive": true,
        "createdAt": "2025-11-20T10:30:00.000Z",
        "updatedAt": "2025-11-20T10:30:00.000Z",
        "trainCount": 2,
        "averageSpeed": 86.25,
        "stopCount": 3,
        "stops": [...],
        "stations": [...]
      },
      {
        "id": "route-uuid-2",
        "name": "Delhi to Kolkata Route",
        "code": "DEL-KOL",
        "distance": 1472,
        "duration": 1020,
        "isActive": true,
        "createdAt": "2025-11-20T11:00:00.000Z",
        "updatedAt": "2025-11-20T11:00:00.000Z",
        "trainCount": 1,
        "averageSpeed": 86.34,
        "stopCount": 4,
        "stops": [...],
        "stations": [...]
      }
    ]
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

**Error Responses:**

- `404` - Station not found

### Update Route

Update route information (admin only).

**Endpoint:** `PUT /admin/routes/{routeId}`

**Headers:**

```text
Authorization: Bearer <admin-jwt-token>
```

**Parameters:**

- `routeId` (path): Route UUID

**Request Body:**

```json
{
  "name": "Updated Delhi to Mumbai Express Route",
  "distance": 1400,
  "duration": 980,
  "isActive": true
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Route updated successfully",
  "data": {
    "route": {
      "id": "route-uuid",
      "name": "Updated Delhi to Mumbai Express Route",
      "distance": 1400,
      "duration": 980,
      "isActive": true,
      "createdAt": "2025-11-20T10:30:00.000Z",
      "updatedAt": "2025-11-20T10:45:00.000Z",
      "stops": [...],
      "stations": [...]
    }
  },
  "timestamp": "2025-11-20T10:45:00.000Z"
}
```

**Validation Rules:**

- Name: Optional, 1-100 characters if provided
- Distance: Optional, 0-10000 km if provided
- Duration: Optional, 1-10000 minutes if provided
- Is Active: Optional boolean

**Error Responses:**

- `400` - Validation error
- `403` - Forbidden (admin access required)
- `404` - Route not found

### Delete Route

Deactivate a route (admin only - soft delete).

**Endpoint:** `DELETE /admin/routes/{routeId}`

**Headers:**

```text
Authorization: Bearer <admin-jwt-token>
```

**Parameters:**

- `routeId` (path): Route UUID

**Response (200):**

```json
{
  "success": true,
  "message": "Route deactivated successfully",
  "timestamp": "2025-11-20T10:45:00.000Z"
}
```

**Error Responses:**

- `403` - Forbidden (admin access required)
- `404` - Route not found

---

## Future Endpoints

The following endpoints are planned for future releases:

### User Management

- `GET /users` - List users (admin only)
- `PUT /auth/profile` - Update user profile
- `POST /auth/change-password` - Change password

### Railway Operations

- `GET /routes` - List available routes ✅ **Implemented**
- `GET /routes/{id}` - Get route details ✅ **Implemented**
- `GET /routes/station/{stationId}` - Get routes by station ✅ **Implemented**
- `POST /admin/routes` - Create routes ✅ **Implemented**
- `PUT /admin/routes/{id}` - Update routes ✅ **Implemented**
- `DELETE /admin/routes/{id}` - Delete routes ✅ **Implemented**
- `GET /coach-types` - List coach types ✅ **Implemented**
- `POST /coaches/admin` - Create coaches ✅ **Implemented**
- `GET /trains/{trainId}/coaches` - Get coaches by train ✅ **Implemented**
- `PUT /coaches/admin/{id}` - Update coaches ✅ **Implemented**
- `DELETE /coaches/admin/{id}` - Delete coaches ✅ **Implemented**
- `GET /trains` - List available trains ✅ **Implemented**
- `POST /bookings` - Create train booking
- `GET /bookings` - List user bookings
- `DELETE /bookings/{id}` - Cancel booking

### Administrative

- `GET /admin/users` - User management
- `GET /admin/bookings` - Booking management
- `POST /admin/trains` - Add new trains ✅ **Implemented**

---

## Support

For API support or questions:

- Check the health endpoints for system status
- Review error messages for detailed information
- Ensure proper authentication for protected endpoints
- Validate request data against documented schemas

---

*Last updated: November 20, 2025*
*API Version: 1.0.0*
