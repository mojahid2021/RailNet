# RailNet API Examples

This document provides practical examples of how to use the RailNet API endpoints with curl commands.

## Setup

First, set your API base URL and get a JWT token:

```bash
BASE_URL="http://localhost:3000"
```

## Authentication

### Register a new user

```bash
curl -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "securepassword123"
  }'
```

### Login and get JWT token

```bash
TOKEN=$(curl -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }' | jq -r '.token')

echo "JWT Token: $TOKEN"
```

## Stations Management

### Create a station (Admin only)

```bash
curl -X POST $BASE_URL/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Central Station",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Get all stations

```bash
curl -X GET $BASE_URL/stations \
  -H "Authorization: Bearer $TOKEN"
```

### Get station by ID

```bash
curl -X GET $BASE_URL/stations/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Update a station (Admin only)

```bash
curl -X PUT $BASE_URL/stations/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Central Station",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Delete a station (Admin only)

```bash
curl -X DELETE $BASE_URL/stations/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Train Routes Management

### Create a train route (Admin only)

```bash
curl -X POST $BASE_URL/train-routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "NYC to Boston Express",
    "startStationId": 1,
    "endStationId": 2,
    "stations": [
      {
        "stationId": 1,
        "distanceFromStart": 0
      },
      {
        "stationId": 3,
        "distanceFromStart": 50
      },
      {
        "stationId": 2,
        "distanceFromStart": 100
      }
    ]
  }'
```

### Get all train routes

```bash
curl -X GET $BASE_URL/train-routes \
  -H "Authorization: Bearer $TOKEN"
```

### Get train route by ID

```bash
curl -X GET $BASE_URL/train-routes/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Compartments Management

### Create a compartment (Admin only)

```bash
curl -X POST $BASE_URL/compartments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "First Class AC",
    "class": "First",
    "type": "AC",
    "price": 150.00,
    "seats": 50
  }'
```

### Get all compartments

```bash
curl -X GET $BASE_URL/compartments \
  -H "Authorization: Bearer $TOKEN"
```

## Trains Management

### Create a train (Admin only)

```bash
curl -X POST $BASE_URL/trains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
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
  }'
```

### Get all trains

```bash
curl -X GET $BASE_URL/trains \
  -H "Authorization: Bearer $TOKEN"
```

## Train Schedules Management

### Create a train schedule (Admin only)

```bash
curl -X POST $BASE_URL/train-schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "trainId": 1,
    "date": "2025-11-30",
    "time": "08:00"
  }'
```

### Get all train schedules

```bash
curl -X GET $BASE_URL/train-schedules \
  -H "Authorization: Bearer $TOKEN"
```

### Get train schedule by ID

```bash
curl -X GET $BASE_URL/train-schedules/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Get schedules by date

```bash
curl -X GET $BASE_URL/train-schedules/date/2025-11-30 \
  -H "Authorization: Bearer $TOKEN"
```

### Get schedules by route

```bash
curl -X GET $BASE_URL/train-schedules/route/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Search trains between stations

```bash
curl -X GET "$BASE_URL/train-schedules/search?fromStationId=1&toStationId=2&date=2025-11-30" \
  -H "Authorization: Bearer $TOKEN"
```

## Complete Workflow Example

Here's a complete example of setting up and using the RailNet API:

```bash
#!/bin/bash

# Set base URL
BASE_URL="http://localhost:3000"

# 1. Register admin user
echo "Registering admin user..."
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "password": "admin123"
  }' | jq -r '.token')

echo "Admin token: $ADMIN_TOKEN"

# 2. Create stations
echo "Creating stations..."
curl -s -X POST $BASE_URL/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "New York Central", "city": "New York", "latitude": 40.7128, "longitude": -74.0060}'

curl -s -X POST $BASE_URL/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Boston South", "city": "Boston", "latitude": 42.3601, "longitude": -71.0589}'

curl -s -X POST $BASE_URL/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "New Haven", "city": "New Haven", "latitude": 41.3083, "longitude": -72.9279}'

# 3. Create compartments
echo "Creating compartments..."
curl -s -X POST $BASE_URL/compartments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "First Class AC", "class": "First", "type": "AC", "price": 150.00, "seats": 50}'

curl -s -X POST $BASE_URL/compartments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Second Class Non-AC", "class": "Second", "type": "Non-AC", "price": 75.00, "seats": 100}'

# 4. Create train route
echo "Creating train route..."
curl -s -X POST $BASE_URL/train-routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Northeast Regional",
    "stations": [
      {"stationId": 1, "distance": 0},
      {"stationId": 3, "distance": 50},
      {"stationId": 2, "distance": 50}
    ]
  }'

# 5. Create train
echo "Creating train..."
curl -s -X POST $BASE_URL/trains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Northeast Regional 101",
    "number": "NER101",
    "trainRouteId": 1,
    "compartments": [
      {"compartmentId": 1},
      {"compartmentId": 2}
    ]
  }'

# 6. Create schedule
echo "Creating train schedule..."
curl -s -X POST $BASE_URL/train-schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "trainId": 1,
    "date": "2025-11-30",
    "time": "08:00"
  }'

# 7. Search for trains
echo "Searching for trains..."
curl -s -X GET "$BASE_URL/train-schedules/search?fromStationId=1&toStationId=2&date=2025-11-30" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo "Setup complete! API is ready to use."
```

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Notes

- Replace `$TOKEN` with your actual JWT token
- All admin operations require admin role
- Dates should be in YYYY-MM-DD format
- Times should be in HH:MM format (24-hour)
- The search endpoint validates station order and returns empty array if no valid routes found