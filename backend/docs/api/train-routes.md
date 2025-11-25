# Train Routes API Documentation

The Train Routes API manages railway routes between stations, including detailed station sequences, distances, and associated compartments.

## Base URL
```
/api/v1/train-routes
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Endpoints

### 1. Create Train Route

Create a new train route with station sequence, distances, and compartment assignments.

**Endpoint:** `POST /api/v1/train-routes`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Dhaka to Chittagong Express Route",
  "totalDistance": 264.5,
  "startStationId": "station-uuid-1",
  "endStationId": "station-uuid-3",
  "stations": [
    {
      "currentStationId": "station-uuid-1",
      "beforeStationId": null,
      "nextStationId": "station-uuid-2",
      "distance": 0,
      "distanceFromStart": 0
    },
    {
      "currentStationId": "station-uuid-2",
      "beforeStationId": "station-uuid-1",
      "nextStationId": "station-uuid-3",
      "distance": 120.5,
      "distanceFromStart": 120.5
    },
    {
      "currentStationId": "station-uuid-3",
      "beforeStationId": "station-uuid-2",
      "nextStationId": null,
      "distance": 144.0,
      "distanceFromStart": 264.5
    }
  ]
}
```

**Request Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Route name |
| totalDistance | number | Yes | Total distance in kilometers |
| startStationId | string (UUID) | Yes | Starting station ID |
| endStationId | string (UUID) | Yes | Ending station ID |
| stations | array | Yes | Ordered list of stations in route |

**Station Object Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentStationId | string (UUID) | Yes | Current station ID |
| beforeStationId | string (UUID) | No | Previous station ID (null for first) |
| nextStationId | string (UUID) | No | Next station ID (null for last) |
| distance | number | Yes | Distance from previous station (km) |
| distanceFromStart | number | Yes | Cumulative distance from start (km) |

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Train route created successfully",
  "data": {
    "id": "route-uuid-1",
    "name": "Dhaka to Chittagong Express Route",
    "totalDistance": 264.5,
    "startStation": {
      "id": "station-uuid-1",
      "name": "Dhaka Railway Station"
    },
    "endStation": {
      "id": "station-uuid-3",
      "name": "Chittagong Railway Station"
    },
    "stations": [
      {
        "id": "route-station-uuid-1",
        "currentStation": {
          "id": "station-uuid-1",
          "name": "Dhaka Railway Station"
        },
        "beforeStationId": null,
        "nextStationId": "station-uuid-2",
        "distance": 0,
        "distanceFromStart": 0
      }
      // ... more stations
    ],
    "createdAt": "2025-11-24T19:49:27.848Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Station or compartment not found
- `400 Bad Request` - Validation error

---

### 2. Get All Train Routes

Retrieve a list of all train routes with basic information.

**Endpoint:** `GET /api/v1/train-routes`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "route-uuid-1",
      "name": "Dhaka to Chittagong Express Route",
      "totalDistance": 264.5,
      "startStation": {
        "id": "station-uuid-1",
        "name": "Dhaka Railway Station"
      },
      "endStation": {
        "id": "station-uuid-3",
        "name": "Chittagong Railway Station"
      },
      "createdAt": "2025-11-24T19:49:27.848Z",
      "updatedAt": "2025-11-24T19:49:27.848Z"
    }
    // ... more routes
  ]
}
```

---

### 3. Get Train Route by ID

Retrieve detailed information about a specific train route, including all stations and compartments.

**Endpoint:** `GET /api/v1/train-routes/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Train route ID |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "route-uuid-1",
    "name": "Dhaka to Chittagong Express Route",
    "totalDistance": 264.5,
    "startStation": {
      "id": "station-uuid-1",
      "name": "Dhaka Railway Station"
    },
    "endStation": {
      "id": "station-uuid-3",
      "name": "Chittagong Railway Station"
    },
    "stations": [
      {
        "id": "route-station-uuid-1",
        "currentStation": {
          "id": "station-uuid-1",
          "name": "Dhaka Railway Station"
        },
        "beforeStationId": null,
        "nextStationId": "station-uuid-2",
        "distance": 0,
        "distanceFromStart": 0
      },
      {
        "id": "route-station-uuid-2",
        "currentStation": {
          "id": "station-uuid-2",
          "name": "Comilla Railway Station"
        },
        "beforeStationId": "station-uuid-1",
        "nextStationId": "station-uuid-3",
        "distance": 120.5,
        "distanceFromStart": 120.5
      },
      {
        "id": "route-station-uuid-3",
        "currentStation": {
          "id": "station-uuid-3",
          "name": "Chittagong Railway Station"
        },
        "beforeStationId": "station-uuid-2",
        "nextStationId": null,
        "distance": 144.0,
        "distanceFromStart": 264.5
      }
    ],
    "createdAt": "2025-11-24T19:49:27.848Z",
    "updatedAt": "2025-11-24T19:49:27.848Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Train route not found

---

### 4. Update Train Route

Update an existing train route's information.

**Endpoint:** `PUT /api/v1/train-routes/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Train route ID |

**Request Body:**
All fields are optional; only include fields you want to update.

```json
{
  "name": "Dhaka to Chittagong Premium Route",
  "totalDistance": 264.5,
  "startStationId": "station-uuid-1",
  "endStationId": "station-uuid-3",
  "compartmentIds": [
    "compartment-uuid-1",
    "compartment-uuid-2",
    "compartment-uuid-3"
  ]
}
```

**Note:** Updating `stations` array requires more complex logic and is typically not recommended. Consider creating a new route instead.

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Train route, station, or compartment not found

---

### 5. Delete Train Route

Delete a train route from the system.

**Endpoint:** `DELETE /api/v1/train-routes/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Train route ID |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Train route deleted successfully",
  "data": null
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Train route not found

**⚠️ Warning:** Deleting a train route will cascade delete all associated route stations. Ensure no trains are assigned to this route before deletion.

---

## Data Model

### TrainRoute Object
```typescript
{
  id: string;
  name: string;
  totalDistance: number;      // Total route distance in km
  startStationId: string;
  endStationId: string;
  startStation: Station;      // Populated station object
  endStation: Station;        // Populated station object
  stations: RouteStation[];   // Ordered list of stations
  createdAt: string;
  updatedAt: string;
}
```

### RouteStation Object
```typescript
{
  id: string;
  trainRouteId: string;
  currentStationId: string;
  beforeStationId: string | null;
  nextStationId: string | null;
  distance: number;           // Distance from previous station (km)
  distanceFromStart: number;  // Cumulative distance from start (km)
  currentStation: Station;    // Populated station object
}
```

## Business Rules

1. **Station Sequence**:
   - Stations must be ordered correctly
   - First station: `beforeStationId = null`
   - Last station: `nextStationId = null`
   - Middle stations: both IDs must reference valid stations

2. **Distance Calculations**:
   - `distance`: Distance from the previous station
   - `distanceFromStart`: Running total from start station
   - `totalDistance`: Must match the last station's `distanceFromStart`

3. **Route Validation**:
   - `startStationId` must match first station in sequence
   - `endStationId` must match last station in sequence
   - All referenced stations must exist in the database

## Example Usage

### JavaScript/Node.js
```javascript
const token = 'your-jwt-token';
const baseURL = 'http://localhost:3000/api/v1';

// Create Train Route
const createRoute = async () => {
  const response = await fetch(`${baseURL}/train-routes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Dhaka to Chittagong Express Route',
      totalDistance: 264.5,
      startStationId: 'station-uuid-1',
      endStationId: 'station-uuid-3',
      stations: [
        {
          currentStationId: 'station-uuid-1',
          beforeStationId: null,
          nextStationId: 'station-uuid-2',
          distance: 0,
          distanceFromStart: 0
        },
        // ... more stations
      ]
    })
  });
  return await response.json();
};

// Get All Routes
const getAllRoutes = async () => {
  const response = await fetch(`${baseURL}/train-routes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Get Route Details
const getRouteDetails = async (routeId) => {
  const response = await fetch(`${baseURL}/train-routes/${routeId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

### cURL Examples
```bash
# Create Train Route
curl -X POST http://localhost:3000/api/v1/train-routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Dhaka to Sylhet Route",
    "totalDistance": 245.0,
    "startStationId": "START_STATION_ID",
    "endStationId": "END_STATION_ID",
    "stations": [
      {
        "currentStationId": "START_STATION_ID",
        "beforeStationId": null,
        "nextStationId": "MIDDLE_STATION_ID",
        "distance": 0,
        "distanceFromStart": 0
      },
      {
        "currentStationId": "END_STATION_ID",
        "beforeStationId": "MIDDLE_STATION_ID",
        "nextStationId": null,
        "distance": 245.0,
        "distanceFromStart": 245.0
      }
    ]
  }'

# Get All Routes
curl -X GET http://localhost:3000/api/v1/train-routes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete Route
curl -X DELETE http://localhost:3000/api/v1/train-routes/ROUTE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Use Cases

### 1. Creating a Multi-Stop Route
Define a route that passes through multiple stations with accurate distances.

### 2. Route Planning
Use route data for:
- Journey time estimation
- Fare calculation based on distance
- Station sequence display
- Real-time train tracking

## Related Documentation
- [Station Management API](stations.md) - Manage stations used in routes
- [Train Management API](trains.md) - Assign routes to trains and manage compartments
- [Database Schema](../workflows/database-schema.md) - Route data model

---

**Last Updated**: 2025-11-24
