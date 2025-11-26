# Train Schedule API Documentation

## Overview

The Train Schedule API provides **admin-only** endpoints for creating and managing train schedules with detailed station-by-station timing. Designed for professional railway operations, this API ensures secure, validated, and auditable schedule management.

### Key Features

- **Time-Based Schedules**: Uses HH:MM format for regular/repeating train operations
- **Station-by-Station Timing**: Detailed arrival/departure times for each station
- **Admin Security**: JWT-based authentication with comprehensive audit logging
- **Route Validation**: Ensures schedules align with assigned train routes
- **Real-Time Updates**: Support for status changes and delay tracking

## Authentication

**POST** `/api/v1/schedules` (Create Schedule) requires **admin JWT authentication** with the following header:

```
Authorization: Bearer <admin-jwt-token>
```

**GET** endpoints (`/api/v1/schedules` and `/api/v1/schedules/:id`) require **user authentication**.

### Security Features

- ✅ JWT token validation with admin type checking for create operations
- ✅ Granular permission-based access control for admin operations
- ✅ Comprehensive audit logging for all admin actions
- ✅ Request validation and sanitization
- ✅ Rate limiting and security headers

## API Endpoints

### Create Schedule

**POST** `/api/v1/schedules`

Creates a new train schedule with detailed station-by-station timing.

#### Request Body

```json
{
  "trainId": "uuid-of-train",
  "departureTime": "08:00",
  "stationSchedules": [
    {
      "stationId": "uuid-of-station-1",
      "estimatedArrival": "2025-11-25T08:00:00.000Z",
      "estimatedDeparture": "2025-11-25T08:15:00.000Z",
      "platformNumber": "1",
      "remarks": "First station"
    },
    {
      "stationId": "uuid-of-station-2",
      "estimatedArrival": "2025-11-25T09:30:00.000Z",
      "estimatedDeparture": "2025-11-25T09:45:00.000Z",
      "platformNumber": "2",
      "remarks": "Intermediate stop"
    }
  ]
}
```

#### Field Descriptions

- `trainId`: UUID of the train (must be assigned to a route)
- `departureTime`: Schedule departure time in HH:MM format (24-hour)
- `stationSchedules[]`: Array of station timing details
  - `stationId`: UUID of the station
  - `estimatedArrival`: Full ISO datetime string for arrival
  - `estimatedDeparture`: Full ISO datetime string for departure
  - `platformNumber`: Platform assignment (optional)
  - `remarks`: Additional notes (optional)

#### Validation Rules

- Train must exist and be assigned to a route
- All stations must be part of the train's route
- Station sequence must match the route order
- Arrival times must be before departure times at each station
- No duplicate schedules for same train at same departure time
- Time format must be HH:MM (24-hour format)

#### Response (201 Created)

```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "id": "schedule-uuid",
    "trainId": "train-uuid",
    "routeId": "route-uuid",
    "departureTime": "08:00",
    "status": "scheduled",
    "train": {
      "id": "train-uuid",
      "name": "Express Train",
      "number": "12345",
      "type": "Express"
    },
    "route": {
      "id": "route-uuid",
      "name": "Dhaka to Chittagong",
      "startStation": { "id": "start-uuid", "name": "Dhaka" },
      "endStation": { "id": "end-uuid", "name": "Chittagong" }
    },
    "stationSchedules": [
      {
        "id": "station-schedule-uuid",
        "stationId": "station-uuid",
        "sequenceOrder": 1,
        "estimatedArrival": "2025-11-25T08:00:00.000Z",
        "estimatedDeparture": "2025-11-25T08:15:00.000Z",
        "durationFromPrevious": 0,
        "waitingTime": 15,
        "status": "pending",
        "platformNumber": "1",
        "remarks": "First station",
        "station": {
          "id": "station-uuid",
          "name": "Dhaka Station",
          "city": "Dhaka",
          "district": "Dhaka"
        }
      }
    ],
    "createdAt": "2025-11-25T07:00:00.000Z"
  }
}
```

### Get All Schedules

**GET** `/api/v1/schedules`

Retrieves schedules with optional filtering and pagination. Requires user authentication.

#### Query Parameters

- `trainId` *(optional)*: Filter by specific train UUID
- `departureTime` *(optional)*: Filter by departure time (HH:MM format)
- `status` *(optional)*: Filter by schedule status (`scheduled`, `running`, `completed`, `delayed`, `cancelled`)
- `limit` *(optional)*: Number of results per page (default: 20, max: 100)
- `offset` *(optional)*: Pagination offset (default: 0)

#### Example Request

```http
GET /api/v1/schedules?trainId=123e4567-e89b-12d3-a456-426614174000&status=scheduled&limit=10
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "schedule-uuid",
        "trainId": "train-uuid",
        "routeId": "route-uuid",
        "departureTime": "08:00",
        "status": "scheduled",
        "train": {
          "id": "train-uuid",
          "name": "Express Train",
          "number": "12345",
          "type": "Express"
        },
        "route": {
          "id": "route-uuid",
          "name": "Dhaka to Chittagong",
          "startStation": { "id": "start-uuid", "name": "Dhaka" },
          "endStation": { "id": "end-uuid", "name": "Chittagong" }
        },
        "_count": {
          "stationSchedules": 5
        },
        "createdAt": "2025-11-25T07:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Get Schedule by ID

**GET** `/api/v1/schedules/:id`

Retrieves detailed information about a specific schedule including all station schedules and recent updates. Requires user authentication.

#### Path Parameters

- `id`: Schedule UUID

#### Schedule Details Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "schedule-uuid",
    "trainId": "train-uuid",
    "routeId": "route-uuid",
    "departureTime": "08:00",
    "status": "scheduled",
    "train": {
      "id": "train-uuid",
      "name": "Express Train",
      "number": "12345",
      "type": "Express"
    },
    "route": {
      "id": "route-uuid",
      "name": "Dhaka to Chittagong",
      "startStation": { "id": "start-uuid", "name": "Dhaka" },
      "endStation": { "id": "end-uuid", "name": "Chittagong" }
    },
    "stationSchedules": [
      {
        "id": "station-schedule-uuid",
        "stationId": "station-uuid",
        "sequenceOrder": 1,
        "estimatedArrival": "2025-11-25T08:00:00.000Z",
        "estimatedDeparture": "2025-11-25T08:15:00.000Z",
        "actualArrival": null,
        "actualDeparture": null,
        "durationFromPrevious": 0,
        "waitingTime": 15,
        "status": "pending",
        "platformNumber": "1",
        "remarks": "First station",
        "station": {
          "id": "station-uuid",
          "name": "Dhaka Station",
          "city": "Dhaka",
          "district": "Dhaka"
        },
        "updates": []
      }
    ],
    "createdAt": "2025-11-25T07:00:00.000Z",
    "updatedAt": "2025-11-25T07:00:00.000Z"
  }
}
```

## Error Handling

### HTTP Status Codes

- `200`: Success
- `201`: Created successfully
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid JWT token
- `403`: Forbidden - Insufficient admin permissions
- `404`: Not Found - Schedule, train, or station not found
- `409`: Conflict - Schedule already exists for train at specified time
- `422`: Unprocessable Entity - Validation failed
- `500`: Internal Server Error

### Common Error Responses

#### Validation Errors (400/422)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "departureTime",
      "message": "Invalid time format. Use HH:MM (24-hour format)"
    },
    {
      "field": "stationSchedules.0.stationId",
      "message": "Invalid station ID"
    }
  ]
}
```

#### Authentication Error (401)

```json
{
  "success": false,
  "error": "Authentication required"
}
```

#### Permission Error (403)

```json
{
  "success": false,
  "error": "Insufficient permissions to create schedules"
}
```

#### Not Found Error (404)

```json
{
  "success": false,
  "error": "Schedule not found"
}
```

#### Conflict Error (409)

```json
{
  "success": false,
  "error": "Schedule already exists for this train at the specified time"
}
```

## Integration Examples

### Creating a Schedule with cURL

```bash
curl -X POST http://localhost:3000/api/v1/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "trainId": "550e8400-e29b-41d4-a716-446655440000",
    "departureTime": "08:00",
    "stationSchedules": [
      {
        "stationId": "550e8400-e29b-41d4-a716-446655440001",
        "estimatedArrival": "2025-11-25T08:00:00.000Z",
        "estimatedDeparture": "2025-11-25T08:15:00.000Z",
        "platformNumber": "1",
        "remarks": "Departure station"
      },
      {
        "stationId": "550e8400-e29b-41d4-a716-446655440002",
        "estimatedArrival": "2025-11-25T09:30:00.000Z",
        "estimatedDeparture": "2025-11-25T09:45:00.000Z",
        "platformNumber": "2",
        "remarks": "Intermediate stop"
      },
      {
        "stationId": "550e8400-e29b-41d4-a716-446655440003",
        "estimatedArrival": "2025-11-25T11:00:00.000Z",
        "estimatedDeparture": "2025-11-25T11:00:00.000Z",
        "platformNumber": "1",
        "remarks": "Final destination"
      }
    ]
  }'
```

### Getting Schedules with Filtering

```bash
# Get schedules for a specific train
curl -X GET "http://localhost:3000/api/v1/schedules?trainId=550e8400-e29b-41d4-a716-446655440000"

# Get schedules with pagination
curl -X GET "http://localhost:3000/api/v1/schedules?limit=5&offset=10"

# Get schedules by status
curl -X GET "http://localhost:3000/api/v1/schedules?status=scheduled"
```

### Getting Schedule Details

```bash
curl -X GET "http://localhost:3000/api/v1/schedules/550e8400-e29b-41d4-a716-446655440004"

## Business Logic

### Schedule Creation Flow

1. **Authentication**: Validate admin JWT token and permissions
2. **Train Validation**: Ensure train exists and is assigned to a route
3. **Route Validation**: Verify all stations belong to the train's route
4. **Sequence Validation**: Confirm station order matches route definition
5. **Time Validation**: Check arrival/departure time logic
6. **Conflict Check**: Prevent duplicate schedules for same train/time
7. **Calculation**: Auto-calculate travel durations and waiting times
8. **Creation**: Create schedule and station schedules in transaction
9. **Audit**: Log admin action for compliance

### Time Calculations

- **Duration from Previous**: Time between departure from previous station and arrival at current station
- **Waiting Time**: Time between arrival and departure at the same station
- **Total Journey Time**: Sum of all travel durations and waiting times

## Performance Considerations

- Database indexes on frequently queried fields (`trainId`, `departureTime`, `status`)
- Pagination for large result sets (default 20, max 100 items)
- Transaction safety for all write operations
- Optimized queries with selective field loading
- Connection pooling for database operations

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live schedule updates
- **Status Management**: API endpoints for updating schedule and station statuses
- **Delay Tracking**: Automatic delay calculation and notification system
- **Schedule Optimization**: AI-powered schedule optimization algorithms
- **Historical Analytics**: Performance metrics and delay analysis
- **Mobile App Integration**: RESTful APIs for mobile applications
- **Third-party Integrations**: APIs for external railway systems
