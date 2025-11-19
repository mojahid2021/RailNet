# RailNet API Documentation

## Overview

RailNet is a comprehensive railway management system backend API built with Fastify, TypeScript, and Prisma. This API provides endpoints for user authentication, health monitoring, and railway operations management.

### Base URL

```
http://localhost:3001/api/v1
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

| Coach Type | Rate per Km (INR) | Description |
|------------|-------------------|-------------|
| Shovan | 0.5 | Lowest cost general class |
| Shovan Chair | 0.75 | General class with assigned seating |
| First Class Seat | 1.5 | First class seating |
| First Class Berth | 2.0 | First class sleeping berth |
| Snigdha | 1.0 | Premium non-AC class |
| AC Seat | 2.5 | Air-conditioned seating |
| AC Berth | 3.0 | Air-conditioned sleeping berth |
| AC Cabin | 4.0 | Highest cost air-conditioned cabin |

### Coach Type Code Generation

Coach type codes are automatically generated from the name:

- "AC Berth" → "ACBERTH"
- "First Class Seat" → "FIRSTCL"
- "Shovan Chair" → "SHOVANC"

### Create Coach Type

Create a new coach type (admin only).

**Endpoint:** `POST /coach-types/admin/coach-types`

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

**Endpoint:** `GET /coach-types/coach-types`

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

**Endpoint:** `GET /coach-types/coach-types/{id}`

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

**Endpoint:** `GET /coach-types/coach-types/search/{query}`

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

**Endpoint:** `PUT /coach-types/admin/coach-types/{id}`

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

**Endpoint:** `DELETE /coach-types/admin/coach-types/{id}`

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

**Endpoint:** `POST /coach-types/admin/coach-types/initialize`

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

```
http://localhost:3000/api/v1/documentation
```

---

## Future Endpoints

The following endpoints are planned for future releases:

### User Management

- `GET /users` - List users (admin only)
- `PUT /auth/profile` - Update user profile
- `POST /auth/change-password` - Change password

### Railway Operations

- `GET /trains` - List available trains
- `POST /bookings` - Create train booking
- `GET /bookings` - List user bookings
- `DELETE /bookings/{id}` - Cancel booking

### Administrative

- `GET /admin/users` - User management
- `GET /admin/bookings` - Booking management
- `POST /admin/trains` - Add new trains

---

## Support

For API support or questions:

- Check the health endpoints for system status
- Review error messages for detailed information
- Ensure proper authentication for protected endpoints
- Validate request data against documented schemas

---

*Last updated: November 18, 2025*
*API Version: 1.0.0*</content>
<parameter name="filePath">/home/mojahid/VS-Code/RailNet/backend/docs/API_DOCUMENTATION.md
