# Train Schedule API Documentation

## Overview
The Train Schedule API allows **ADMIN ONLY** creation and management of train schedules with station-by-station arrival and departure times. This API is designed for professional railway operations with low-latency requirements and comprehensive security measures.

## Security & Access Control

### Admin-Only Access
- **JWT Authentication Required**: All endpoints require valid admin JWT tokens
- **Token Type Validation**: Only tokens with `type: 'admin'` are accepted
- **Permission Checks**: Explicit permission validation for each operation
- **Audit Logging**: All admin actions are logged for compliance and security

### Authentication Headers
```bash
Authorization: Bearer <admin-jwt-token>
```

### Security Features
- ✅ **Multi-layer Authentication**: JWT + admin type validation
- ✅ **Permission-based Access**: Granular permission checks
- ✅ **Comprehensive Logging**: All operations logged with admin ID
- ✅ **Audit Trail**: Complete record of admin actions
- ✅ **Request Validation**: Strict input validation and sanitization

## API Endpoints

### 1. Create Schedule
**POST** `/api/v1/schedules`

Creates a new train schedule with detailed station-by-station timing.

#### Request Body
```json
{
  "trainId": "uuid-of-train",
  "departureDate": "2025-11-25T08:00:00.000Z",
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

#### Validation Rules
- Train must exist and be assigned to a route
- All stations must be part of the train's route
- Station sequence must match the route order
- Arrival times must be before departure times
- No duplicate schedules for same train on same date

#### Response
```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "id": "schedule-uuid",
    "trainId": "train-uuid",
    "routeId": "route-uuid",
    "departureDate": "2025-11-25T08:00:00.000Z",
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
    ]
  }
}
```

### 2. Get All Schedules
**GET** `/api/v1/schedules`

Retrieves schedules with optional filtering and pagination.

#### Query Parameters
- `trainId` (optional): Filter by specific train
- `dateFrom` (optional): Filter schedules from this date
- `dateTo` (optional): Filter schedules until this date
- `status` (optional): Filter by schedule status
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

#### Example Request
```
GET /api/v1/schedules?trainId=123e4567-e89b-12d3-a456-426614174000&status=scheduled&limit=10
```

### 3. Get Schedule by ID
**GET** `/api/v1/schedules/:id`

Retrieves detailed information about a specific schedule including all station schedules and recent updates.

## Data Flow

1. **Train Assignment**: Train must be assigned to a route before creating schedules
2. **Route Validation**: All stations in schedule must exist in the train's route
3. **Sequence Validation**: Station order must match the route definition
4. **Time Calculations**: Automatic calculation of travel duration and waiting times
5. **Audit Trail**: All status changes are tracked for compliance

## Performance Optimizations

- **Indexed Queries**: Optimized database indexes for fast lookups
- **Selective Fields**: API supports field selection for reduced payload
- **Pagination**: Efficient handling of large result sets
- **Transaction Safety**: All operations use database transactions

## Error Handling

### Common Error Codes
- `400`: Invalid request data
- `404`: Train/route/station not found
- `409`: Schedule conflict (duplicate date/train)
- `500`: Internal server error

### Validation Errors
- Station sequence mismatch
- Invalid time formats
- Missing required fields
- Train not assigned to route

## Integration Examples

### Creating a Schedule with cURL
```bash
curl -X POST http://localhost:3000/api/v1/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "trainId": "train-uuid",
    "departureDate": "2025-11-25T08:00:00.000Z",
    "stationSchedules": [
      {
        "stationId": "station-1-uuid",
        "estimatedArrival": "2025-11-25T08:00:00.000Z",
        "estimatedDeparture": "2025-11-25T08:15:00.000Z"
      },
      {
        "stationId": "station-2-uuid",
        "estimatedArrival": "2025-11-25T09:30:00.000Z",
        "estimatedDeparture": "2025-11-25T09:45:00.000Z"
      }
    ]
  }'
```

## Next Steps

Future enhancements will include:
- Real-time schedule updates via WebSocket
- Station status updates (arrived/departed)
- Delay notifications
- Schedule optimization algorithms
- Historical performance analytics