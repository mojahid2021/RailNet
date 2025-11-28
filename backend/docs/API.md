# RailNet API Documentation

## Overview

RailNet is a comprehensive train management system API built with Fastify, TypeScript, and Prisma. It provides endpoints for managing stations, train routes, compartments, trains, schedules, and ticket booking.

**Base URL:** `http://localhost:3000`

**Interactive Documentation:** `http://localhost:3000/documentation` (Swagger UI)

**Authentication:** JWT Bearer token required for most endpoints

## Authentication

All endpoints except `/register` and `/login` require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Register User

**POST** `/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 6 characters |
| firstName | string | No | User's first name |
| lastName | string | No | User's last name |
| role | string | No | `user` or `admin` (defaults to `user`) |

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

**POST** `/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email address |
| password | string | Yes | User's password |

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Stations

Endpoints for managing railway stations.

### Create Station (Admin Only)

**POST** `/stations`

Create a new train station.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Central Station",
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Station name (must be unique) |
| city | string | Yes | City where station is located |
| latitude | number | Yes | Geographic latitude |
| longitude | number | Yes | Geographic longitude |

**Response (201):**
```json
{
  "id": 1,
  "name": "Central Station",
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

### Get All Stations

**GET** `/stations`

Retrieve all train stations (ordered by creation date, descending).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Central Station",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "createdAt": "2025-11-29T10:00:00.000Z",
    "updatedAt": "2025-11-29T10:00:00.000Z"
  }
]
```

### Get Station by ID

**GET** `/stations/{id}`

Retrieve a specific station by ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Central Station",
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

## Train Routes

Endpoints for managing train routes (Admin only for all operations).

### Create Train Route (Admin Only)

**POST** `/train-routes`

Create a new train route with stations.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "NYC to Boston Express",
  "stations": [
    {
      "stationId": 1,
      "distance": 0
    },
    {
      "stationId": 3,
      "distance": 50
    },
    {
      "stationId": 2,
      "distance": 50
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Route name (must be unique) |
| stations | array | Yes | Array of station objects (minimum 2 required) |
| stations[].stationId | number | Yes | ID of the station |
| stations[].distance | number | Yes | Distance to next station (0 for first station) |

**Note:** 
- The first and last stations in the array automatically become the start and end stations of the route
- The `distance` field in the request represents the distance from the previous station (used to calculate `distanceFromStart`)
- In the response, the `distance` field in RouteStation represents the stored input value (set to `null` for the last station since there's no next station)
- The `distanceFromStart` is calculated as a cumulative sum of all input distances

**Response (201):**
```json
{
  "id": 1,
  "name": "NYC to Boston Express",
  "startStationId": 1,
  "endStationId": 2,
  "startStation": {
    "id": 1,
    "name": "Central Station",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "endStation": {
    "id": 2,
    "name": "South Station",
    "city": "Boston",
    "latitude": 42.3601,
    "longitude": -71.0589
  },
  "routeStations": [
    {
      "id": 1,
      "previousStationId": null,
      "currentStationId": 1,
      "nextStationId": 3,
      "distance": 0,
      "distanceFromStart": 0
    },
    {
      "id": 2,
      "previousStationId": 1,
      "currentStationId": 3,
      "nextStationId": 2,
      "distance": 50,
      "distanceFromStart": 50
    },
    {
      "id": 3,
      "previousStationId": 3,
      "currentStationId": 2,
      "nextStationId": null,
      "distance": null,
      "distanceFromStart": 100
    }
  ],
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

### Get All Train Routes (Admin Only)

**GET** `/train-routes`

Retrieve all train routes with full station details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "NYC to Boston Express",
    "startStationId": 1,
    "endStationId": 2,
    "startStation": {
      "id": 1,
      "name": "Central Station",
      "city": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "endStation": {
      "id": 2,
      "name": "South Station",
      "city": "Boston",
      "latitude": 42.3601,
      "longitude": -71.0589
    },
    "routeStations": [
      {
        "id": 1,
        "previousStationId": null,
        "currentStationId": 1,
        "nextStationId": 3,
        "distance": 0,
        "distanceFromStart": 0,
        "currentStation": {
          "id": 1,
          "name": "Central Station",
          "city": "New York",
          "latitude": 40.7128,
          "longitude": -74.0060
        }
      }
    ],
    "createdAt": "2025-11-29T10:00:00.000Z",
    "updatedAt": "2025-11-29T10:00:00.000Z"
  }
]
```

### Get Train Route by ID (Admin Only)

**GET** `/train-routes/{id}`

Retrieve a specific train route with all stations.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
Same as Get All Train Routes (single object)

## Compartments

Endpoints for managing train compartment types.

### Create Compartment (Admin Only)

**POST** `/compartments`

Create a new train compartment type.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "First Class AC",
  "class": "First",
  "type": "AC",
  "price": 150.00,
  "totalSeats": 50
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Compartment name |
| class | string | Yes | Compartment class (e.g., "First", "Second", "Third") |
| type | string | Yes | Compartment type (e.g., "AC", "Non-AC", "Sleeper") |
| price | number | Yes | Base price per ticket (minimum 0) |
| totalSeats | number | Yes | Total number of seats (minimum 1) |

**Response (201):**
```json
{
  "id": 1,
  "name": "First Class AC",
  "class": "First",
  "type": "AC",
  "price": 150.00,
  "totalSeats": 50,
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

### Get All Compartments

**GET** `/compartments`

Retrieve all compartment types.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "First Class AC",
    "class": "First",
    "type": "AC",
    "price": 150.00,
    "totalSeats": 50,
    "createdAt": "2025-11-29T10:00:00.000Z",
    "updatedAt": "2025-11-29T10:00:00.000Z"
  }
]
```

### Get Compartment by ID

**GET** `/compartments/{id}`

Retrieve a specific compartment type.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "First Class AC",
  "class": "First",
  "type": "AC",
  "price": 150.00,
  "totalSeats": 50,
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

## Trains

Endpoints for creating and managing trains by combining routes and compartments.

### Create Train (Admin Only)

**POST** `/trains`

Create a new train with route and compartments.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Express Train 101",
  "number": "EXP101",
  "trainRouteId": 1,
  "compartments": [
    {
      "compartmentId": 1,
      "quantity": 2
    },
    {
      "compartmentId": 2,
      "quantity": 3
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Train name |
| number | string | Yes | Train number (must be unique) |
| trainRouteId | number | Yes | ID of the train route |
| compartments | array | Yes | Array of compartment assignments (minimum 1) |
| compartments[].compartmentId | number | Yes | ID of the compartment type |
| compartments[].quantity | number | No | Number of this compartment type (defaults to 1) |

**Response (201):**
```json
{
  "id": 1,
  "name": "Express Train 101",
  "number": "EXP101",
  "trainRouteId": 1,
  "trainRoute": {
    "id": 1,
    "name": "NYC to Boston Express",
    "startStationId": 1,
    "endStationId": 2,
    "startStation": {
      "id": 1,
      "name": "Central Station",
      "city": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "endStation": {
      "id": 2,
      "name": "South Station",
      "city": "Boston",
      "latitude": 42.3601,
      "longitude": -71.0589
    }
  },
  "compartments": [
    {
      "id": 1,
      "trainId": 1,
      "compartmentId": 1,
      "quantity": 2,
      "compartment": {
        "id": 1,
        "name": "First Class AC",
        "class": "First",
        "type": "AC",
        "price": 150.00,
        "totalSeats": 50
      },
      "createdAt": "2025-11-29T10:00:00.000Z",
      "updatedAt": "2025-11-29T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

### Get All Trains

**GET** `/trains`

Retrieve all trains with their routes and compartments.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Express Train 101",
    "number": "EXP101",
    "trainRouteId": 1,
    "trainRoute": {
      "id": 1,
      "name": "NYC to Boston Express",
      "startStation": {
        "id": 1,
        "name": "Central Station",
        "city": "New York"
      },
      "endStation": {
        "id": 2,
        "name": "South Station",
        "city": "Boston"
      }
    },
    "compartments": [
      {
        "id": 1,
        "compartmentId": 1,
        "quantity": 2,
        "compartment": {
          "id": 1,
          "name": "First Class AC",
          "class": "First",
          "type": "AC",
          "price": 150.00,
          "totalSeats": 50
        }
      }
    ],
    "createdAt": "2025-11-29T10:00:00.000Z",
    "updatedAt": "2025-11-29T10:00:00.000Z"
  }
]
```

### Get Train by ID

**GET** `/trains/{id}`

Retrieve a specific train with full details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
Same structure as Get All Trains (single object)

## Train Schedules

Endpoints for creating and searching train schedules.

### Create Train Schedule (Admin Only)

**POST** `/train-schedules`

Create a new train schedule for a specific date and time. Station times are automatically calculated based on route distances (1 minute per km with 5-minute stop at each station).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "trainId": 1,
  "date": "2025-11-30",
  "time": "08:00"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| trainId | number | Yes | ID of the train |
| date | string | Yes | Schedule date (YYYY-MM-DD format) |
| time | string | Yes | Departure time (HH:MM format, 24-hour) |

**Response (201):**
```json
{
  "id": 1,
  "trainId": 1,
  "trainRouteId": 1,
  "date": "2025-11-30T08:00:00.000Z",
  "time": "08:00",
  "train": {
    "id": 1,
    "name": "Express Train 101",
    "number": "EXP101",
    "trainRoute": {
      "id": 1,
      "name": "NYC to Boston Express",
      "startStation": { "id": 1, "name": "Central Station", "city": "New York" },
      "endStation": { "id": 2, "name": "South Station", "city": "Boston" }
    },
    "compartments": [
      {
        "id": 1,
        "compartmentId": 1,
        "compartment": {
          "id": 1,
          "name": "First Class AC",
          "class": "First",
          "type": "AC",
          "price": 150.00,
          "totalSeats": 50
        }
      }
    ]
  },
  "trainRoute": {
    "id": 1,
    "name": "NYC to Boston Express",
    "startStation": { "id": 1, "name": "Central Station" },
    "endStation": { "id": 2, "name": "South Station" }
  },
  "stationTimes": [
    {
      "id": 1,
      "stationId": 1,
      "station": { "id": 1, "name": "Central Station", "city": "New York" },
      "arrivalTime": "2025-11-30T08:00:00.000Z",
      "departureTime": "2025-11-30T08:05:00.000Z",
      "sequence": 1
    },
    {
      "id": 2,
      "stationId": 3,
      "station": { "id": 3, "name": "Intermediate Station", "city": "New Haven" },
      "arrivalTime": "2025-11-30T08:55:00.000Z",
      "departureTime": "2025-11-30T09:00:00.000Z",
      "sequence": 2
    },
    {
      "id": 3,
      "stationId": 2,
      "station": { "id": 2, "name": "South Station", "city": "Boston" },
      "arrivalTime": "2025-11-30T10:00:00.000Z",
      "departureTime": "2025-11-30T10:05:00.000Z",
      "sequence": 3
    }
  ],
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

### Get All Train Schedules

**GET** `/train-schedules`

Retrieve all train schedules with complete information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Get Train Schedule by ID

**GET** `/train-schedules/{id}`

Retrieve a specific train schedule by ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Get Schedules by Date

**GET** `/train-schedules/date/{date}`

Retrieve all train schedules for a specific date.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| date | string | Date in YYYY-MM-DD format |

**Example:** `GET /train-schedules/date/2025-11-30`

### Get Schedules by Route

**GET** `/train-schedules/route/{routeId}`

Retrieve all train schedules for a specific route.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| routeId | number | Route ID |

**Example:** `GET /train-schedules/route/1`

### Search Trains Between Stations

**GET** `/train-schedules/search`

Search for trains between two stations on a specific date. Only returns schedules where the "from" station comes before the "to" station in the route.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fromStationId | number | Yes | Departure station ID |
| toStationId | number | Yes | Arrival station ID |
| date | string | Yes | Date in YYYY-MM-DD format |

**Example:** `GET /train-schedules/search?fromStationId=1&toStationId=2&date=2025-11-30`

**Response (200):**
Returns an array of train schedules matching the search criteria (same structure as Get All Train Schedules).

### Get Seat Availability for Schedule

**GET** `/train-schedules/{id}/seats`

Get seat availability for a specific train schedule with all compartment and seat details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "scheduleId": 1,
  "trainName": "Express Train 101",
  "trainNumber": "EXP101",
  "date": "2025-11-30",
  "time": "08:00",
  "compartments": [
    {
      "compartmentId": 1,
      "compartmentName": "First Class AC",
      "class": "First",
      "type": "AC",
      "totalSeats": 50,
      "availableSeats": 48,
      "seats": [
        {
          "seatId": 1,
          "seatNumber": "1A",
          "seatType": "Window",
          "row": 1,
          "column": "A",
          "isAvailable": false,
          "passengerName": "John Doe",
          "passengerAge": 30,
          "passengerGender": "Male"
        },
        {
          "seatId": null,
          "seatNumber": "Seat-3",
          "seatType": "Standard",
          "row": 1,
          "column": "A",
          "isAvailable": true,
          "passengerName": null,
          "passengerAge": null,
          "passengerGender": null
        }
      ]
    }
  ]
}
```

### Get Available Seats for Journey Segment

**GET** `/train-schedules/{id}/available-seats`

Get available seats for a specific journey segment within a train schedule. This endpoint checks for overlapping journeys to ensure accurate availability.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fromStationId | number | Yes | Departure station ID |
| toStationId | number | Yes | Arrival station ID |

**Example:** `GET /train-schedules/1/available-seats?fromStationId=1&toStationId=2`

**Response (200):**
```json
{
  "scheduleId": 1,
  "trainName": "Express Train 101",
  "trainNumber": "EXP101",
  "date": "2025-11-30",
  "time": "08:00",
  "journeySegment": {
    "fromStation": "Central Station",
    "toStation": "South Station"
  },
  "compartments": [
    {
      "compartmentId": 1,
      "compartmentName": "First Class AC",
      "class": "First",
      "type": "AC",
      "price": 150.00,
      "totalSeats": 50,
      "bookedSeats": 2,
      "availableSeats": 48
    }
  ]
}
```

## Tickets

Endpoints for booking and managing train tickets.

### Book Ticket

**POST** `/tickets`

Book a train ticket. Users must provide their own seat number from the available seats.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "trainScheduleId": 1,
  "fromStationId": 1,
  "toStationId": 2,
  "compartmentId": 1,
  "seatNumber": "1A",
  "passengerName": "John Doe",
  "passengerAge": 30,
  "passengerGender": "Male"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| trainScheduleId | number | Yes | ID of the train schedule |
| fromStationId | number | Yes | Departure station ID |
| toStationId | number | Yes | Arrival station ID |
| compartmentId | number | Yes | ID of the compartment type |
| seatNumber | string | Yes | Seat number (e.g., "1A", "2B") |
| passengerName | string | Yes | Passenger's full name |
| passengerAge | number | Yes | Passenger's age (1-120) |
| passengerGender | string | Yes | One of: "Male", "Female", "Other" |

**Features:**
- Validates that the journey segment is valid for the route
- Checks that seat number isn't already booked for this train/date
- Uses database transactions to prevent race conditions
- Price is calculated based on compartment pricing

**Response (201):**
```json
{
  "id": 1,
  "userId": 1,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "trainScheduleId": 1,
  "trainSchedule": {
    "id": 1,
    "trainId": 1,
    "date": "2025-11-30T08:00:00.000Z",
    "time": "08:00",
    "train": {
      "id": 1,
      "name": "Express Train 101",
      "number": "EXP101"
    }
  },
  "fromStationId": 1,
  "fromStation": {
    "id": 1,
    "name": "Central Station",
    "city": "New York"
  },
  "toStationId": 2,
  "toStation": {
    "id": 2,
    "name": "South Station",
    "city": "Boston"
  },
  "seatId": 1,
  "trainCompartmentId": 1,
  "seatNumber": "1A",
  "seat": {
    "id": 1,
    "seatNumber": "1A",
    "seatType": "Standard",
    "row": 1,
    "column": "A",
    "trainCompartment": {
      "id": 1,
      "compartment": {
        "id": 1,
        "name": "First Class AC",
        "class": "First",
        "type": "AC",
        "price": 150.00,
        "totalSeats": 50
      }
    }
  },
  "passengerName": "John Doe",
  "passengerAge": 30,
  "passengerGender": "Male",
  "price": 150.00,
  "status": "booked",
  "bookedAt": "2025-11-29T10:00:00.000Z",
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

### Get User's Tickets

**GET** `/tickets`

Retrieve all tickets for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
Returns an array of tickets (same structure as Book Ticket response).

### Get Ticket by ID

**GET** `/tickets/{id}`

Retrieve a specific ticket by ID. Users can only view their own tickets.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
Same structure as Book Ticket response.

### Cancel Ticket

**PUT** `/tickets/{id}/cancel`

Cancel a booked ticket. Tickets can only be cancelled up to 2 hours before departure.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
Returns the cancelled ticket with `status: "cancelled"`.

**Error Responses:**
- `400` - Ticket already cancelled or within 2 hours of departure
- `403` - Not authorized to cancel this ticket
- `404` - Ticket not found

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "Error message describing what went wrong"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Admin access required"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**409 Conflict:**
```json
{
  "error": "Resource already exists"
}
```

## Data Models

### User
```json
{
  "id": "number",
  "email": "string",
  "firstName": "string (nullable)",
  "lastName": "string (nullable)",
  "role": "string (user | admin)",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### Station
```json
{
  "id": "number",
  "name": "string (unique)",
  "city": "string",
  "latitude": "number",
  "longitude": "number",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### RouteStation
```json
{
  "id": "number",
  "trainRouteId": "number",
  "previousStationId": "number (nullable)",
  "currentStationId": "number",
  "nextStationId": "number (nullable)",
  "distance": "number (nullable) - distance to next station",
  "distanceFromStart": "number - cumulative distance from route start",
  "currentStation": "Station",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### TrainRoute
```json
{
  "id": "number",
  "name": "string (unique)",
  "startStationId": "number",
  "endStationId": "number",
  "startStation": "Station",
  "endStation": "Station",
  "routeStations": "RouteStation[]",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### Compartment
```json
{
  "id": "number",
  "name": "string",
  "class": "string (First | Second | Third)",
  "type": "string (AC | Non-AC | Sleeper)",
  "price": "number",
  "totalSeats": "number",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### TrainCompartment
```json
{
  "id": "number",
  "trainId": "number",
  "compartmentId": "number",
  "quantity": "number - number of this compartment type in the train",
  "compartment": "Compartment",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### Train
```json
{
  "id": "number",
  "name": "string",
  "number": "string (unique)",
  "trainRouteId": "number",
  "trainRoute": "TrainRoute",
  "compartments": "TrainCompartment[]",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### ScheduleStation
```json
{
  "id": "number",
  "trainScheduleId": "number",
  "stationId": "number",
  "station": "Station",
  "arrivalTime": "string (nullable)",
  "departureTime": "string (nullable)",
  "sequence": "number - order in the schedule",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### TrainSchedule
```json
{
  "id": "number",
  "trainId": "number",
  "trainRouteId": "number",
  "train": "Train",
  "trainRoute": "TrainRoute",
  "date": "string (ISO 8601)",
  "time": "string (HH:MM)",
  "stationTimes": "ScheduleStation[]",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### Seat
```json
{
  "id": "number",
  "trainCompartmentId": "number",
  "seatNumber": "string (e.g., 1A, 2B)",
  "seatType": "string (Window | Aisle | Middle)",
  "row": "number",
  "column": "string (A, B, C, etc.)",
  "isAvailable": "boolean",
  "trainCompartment": "TrainCompartment",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### Ticket
```json
{
  "id": "number",
  "userId": "number",
  "user": "User",
  "trainScheduleId": "number",
  "trainSchedule": "TrainSchedule",
  "fromStationId": "number",
  "fromStation": "Station",
  "toStationId": "number",
  "toStation": "Station",
  "seatId": "number",
  "seat": "Seat",
  "trainCompartmentId": "number",
  "seatNumber": "string",
  "passengerName": "string",
  "passengerAge": "number",
  "passengerGender": "string (Male | Female | Other)",
  "price": "number",
  "status": "string (booked | cancelled | used)",
  "bookedAt": "string (ISO 8601)",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

## Getting Started

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL connection and JWT secret
   ```

3. **Set up database:**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access API documentation:**
   Visit `http://localhost:3000/documentation` for interactive Swagger UI

6. **Register an admin user:**
   Use the `/register` endpoint with `"role": "admin"`

7. **Create resources (as admin):**
   - Create stations → Create routes → Create compartments → Create trains → Create schedules

8. **Book tickets (as user):**
   - Search for trains → Check available seats → Book ticket

## Notes

- **Authentication**: All endpoints except `/register` and `/login` require a valid JWT token
- **Admin Access**: Create/Update/Delete operations on stations, routes, compartments, trains, and schedules require admin role
- **Date Format**: All dates should be in ISO format (YYYY-MM-DD)
- **Time Format**: Times should be in HH:MM format (24-hour)
- **Unique Constraints**: Station names, train numbers, and route names must be unique
- **Route Validation**: The search endpoint validates that the "to" station comes after the "from" station in the route
- **Booking Validation**: Seat numbers are validated to prevent double bookings
- **Cancellation Policy**: Tickets can only be cancelled up to 2 hours before departure
- **Schedule Calculation**: Station times are automatically calculated based on route distances (1 minute per km + 5 minute stop)
- **Rate Limiting**: API is rate-limited to 100 requests per minute per IP