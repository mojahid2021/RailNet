# RailNet API Documentation

## Overview

RailNet is a comprehensive train management system API built with Fastify, TypeScript, and Prisma. It provides endpoints for managing stations, train routes, compartments, trains, and schedules.

**Base URL:** `http://localhost:3000`

**Authentication:** JWT Bearer token required for most endpoints

## Authentication

### Register User

**POST** `/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "securepassword123"
}
```

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

Retrieve all train stations.

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

### Update Station (Admin Only)

**PUT** `/stations/{id}`

Update station information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Updated Central Station",
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Delete Station (Admin Only)

**DELETE** `/stations/{id}`

Delete a station.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (204):** No Content

## Train Routes

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
    "city": "New York"
  },
  "endStation": {
    "id": 2,
    "name": "South Station",
    "city": "Boston"
  },
  "routeStations": [
    {
      "id": 1,
      "currentStation": {
        "id": 1,
        "name": "Central Station",
        "city": "New York"
      },
      "distanceFromStart": 0
    }
  ],
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

### Get All Train Routes

**GET** `/train-routes`

Retrieve all train routes.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Get Train Route by ID

**GET** `/train-routes/{id}`

Retrieve a specific train route with all stations.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Update Train Route (Admin Only)

**PUT** `/train-routes/{id}`

Update train route information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Delete Train Route (Admin Only)

**DELETE** `/train-routes/{id}`

Delete a train route.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Compartments

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
  "seats": 50
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "First Class AC",
  "class": "First",
  "type": "AC",
  "price": 150.00,
  "seats": 50,
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

### Get Compartment by ID

**GET** `/compartments/{id}`

Retrieve a specific compartment type.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Update Compartment (Admin Only)

**PUT** `/compartments/{id}`

Update compartment information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Delete Compartment (Admin Only)

**DELETE** `/compartments/{id}`

Delete a compartment type.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Trains

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
      "compartmentId": 1
    },
    {
      "compartmentId": 2
    }
  ]
}
```

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
    "startStation": {
      "id": 1,
      "name": "Central Station"
    },
    "endStation": {
      "id": 2,
      "name": "South Station"
    }
  },
  "compartments": [
    {
      "id": 1,
      "compartmentId": 1,
      "compartment": {
        "id": 1,
        "name": "First Class AC",
        "class": "First",
        "price": 150.00,
        "seats": 50
      }
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

### Get Train by ID

**GET** `/trains/{id}`

Retrieve a specific train with full details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Update Train (Admin Only)

**PUT** `/trains/{id}`

Update train information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Delete Train (Admin Only)

**DELETE** `/trains/{id}`

Delete a train.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Train Schedules

### Create Train Schedule (Admin Only)

**POST** `/train-schedules`

Create a new train schedule for a specific date and time.

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
    "number": "EXP101"
  },
  "trainRoute": {
    "id": 1,
    "name": "NYC to Boston Express"
  },
  "stationTimes": [
    {
      "id": 1,
      "stationId": 1,
      "station": {
        "id": 1,
        "name": "Central Station",
        "city": "New York"
      },
      "arrivalTime": "2025-11-30T08:00:00.000Z",
      "departureTime": "2025-11-30T08:05:00.000Z",
      "sequence": 1
    },
    {
      "id": 2,
      "stationId": 3,
      "station": {
        "id": 3,
        "name": "Intermediate Station",
        "city": "New Haven"
      },
      "arrivalTime": "2025-11-30T08:50:00.000Z",
      "departureTime": "2025-11-30T08:55:00.000Z",
      "sequence": 2
    },
    {
      "id": 3,
      "stationId": 2,
      "station": {
        "id": 2,
        "name": "South Station",
        "city": "Boston"
      },
      "arrivalTime": "2025-11-30T09:40:00.000Z",
      "departureTime": null,
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

**Example:** `GET /train-schedules/date/2025-11-30`

### Get Schedules by Route

**GET** `/train-schedules/route/{routeId}`

Retrieve all train schedules for a specific route.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Example:** `GET /train-schedules/route/1`

### Search Trains Between Stations

**GET** `/train-schedules/search?fromStationId={id}&toStationId={id}&date={date}`

Search for trains between two stations on a specific date.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `fromStationId`: Departure station ID
- `toStationId`: Arrival station ID
- `date`: Date in YYYY-MM-DD format

**Example:** `GET /train-schedules/search?fromStationId=1&toStationId=2&date=2025-11-30`

**Response (200):**
```json
[
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
        "startStation": {
          "id": 1,
          "name": "Central Station",
          "city": "New York"
        },
        "endStation": {
          "id": 2,
          "name": "South Station",
          "city": "Boston"
        },
        "routeStations": [
          {
            "id": 1,
            "currentStation": {
              "id": 1,
              "name": "Central Station",
              "city": "New York"
            },
            "distanceFromStart": 0
          },
          {
            "id": 2,
            "currentStation": {
              "id": 3,
              "name": "Intermediate Station",
              "city": "New Haven"
            },
            "distanceFromStart": 50
          },
          {
            "id": 3,
            "currentStation": {
              "id": 2,
              "name": "South Station",
              "city": "Boston"
            },
            "distanceFromStart": 100
          }
        ]
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
            "seats": 50
          }
        }
      ]
    },
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
      },
      "routeStations": [
        {
          "id": 1,
          "currentStation": {
            "id": 1,
            "name": "Central Station",
            "city": "New York"
          },
          "distanceFromStart": 0
        }
      ]
    },
    "stationTimes": [
      {
        "id": 1,
        "stationId": 1,
        "station": {
          "id": 1,
          "name": "Central Station",
          "city": "New York"
        },
        "arrivalTime": "2025-11-30T08:00:00.000Z",
        "departureTime": "2025-11-30T08:05:00.000Z",
        "sequence": 1
      },
      {
        "id": 2,
        "stationId": 3,
        "station": {
          "id": 3,
          "name": "Intermediate Station",
          "city": "New Haven"
        },
        "arrivalTime": "2025-11-30T08:50:00.000Z",
        "departureTime": "2025-11-30T08:55:00.000Z",
        "sequence": 2
      },
      {
        "id": 3,
        "stationId": 2,
        "station": {
          "id": 2,
          "name": "South Station",
          "city": "Boston"
        },
        "arrivalTime": "2025-11-30T09:40:00.000Z",
        "departureTime": null,
        "sequence": 3
      }
    ],
    "createdAt": "2025-11-29T10:00:00.000Z",
    "updatedAt": "2025-11-29T10:00:00.000Z"
  }
]
```

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
  "firstName": "string",
  "lastName": "string",
  "role": "string"
}
```

### Station
```json
{
  "id": "number",
  "name": "string",
  "city": "string",
  "latitude": "number",
  "longitude": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### TrainRoute
```json
{
  "id": "number",
  "name": "string",
  "startStationId": "number",
  "endStationId": "number",
  "startStation": "Station",
  "endStation": "Station",
  "routeStations": "RouteStation[]",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Compartment
```json
{
  "id": "number",
  "name": "string",
  "class": "string",
  "type": "string",
  "price": "number",
  "seats": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Train
```json
{
  "id": "number",
  "name": "string",
  "number": "string",
  "trainRouteId": "number",
  "trainRoute": "TrainRoute",
  "compartments": "TrainCompartment[]",
  "createdAt": "string",
  "updatedAt": "string"
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
  "date": "string",
  "time": "string",
  "stationTimes": "ScheduleStation[]",
  "createdAt": "string",
  "updatedAt": "string"
}
```

## Getting Started

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Access API documentation:**
   Visit `http://localhost:3000/documentation`

3. **Register an admin user** (first user is automatically admin)

4. **Create stations, routes, compartments, and trains**

5. **Create train schedules** for specific dates and times

6. **Search for trains** between stations using the search endpoint

## Notes

- All dates should be in ISO format (YYYY-MM-DD)
- Times should be in HH:MM format (24-hour)
- JWT tokens are required for authenticated endpoints
- Admin role is required for create/update/delete operations
- The search endpoint validates that the "to" station comes after the "from" station in the route
- Schedule times are automatically calculated based on route distances (1 minute per km)