# RailNet API Examples

This document provides practical examples of how to use the RailNet API endpoints with curl commands.

## Setup

First, set your API base URL:

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

### Register an admin user

```bash
curl -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "password": "adminpassword123",
    "role": "admin"
  }'
```

### Login and get JWT token

```bash
TOKEN=$(curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpassword123"
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
    "totalSeats": 50
  }'
```

### Get all compartments

```bash
curl -X GET $BASE_URL/compartments \
  -H "Authorization: Bearer $TOKEN"
```

### Get compartment by ID

```bash
curl -X GET $BASE_URL/compartments/1 \
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
  }'
```

### Get all train routes (Admin only)

```bash
curl -X GET $BASE_URL/train-routes \
  -H "Authorization: Bearer $TOKEN"
```

### Get train route by ID (Admin only)

```bash
curl -X GET $BASE_URL/train-routes/1 \
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
        "compartmentId": 1,
        "quantity": 2
      },
      {
        "compartmentId": 2,
        "quantity": 3
      }
    ]
  }'
```

### Get all trains

```bash
curl -X GET $BASE_URL/trains \
  -H "Authorization: Bearer $TOKEN"
```

### Get train by ID

```bash
curl -X GET $BASE_URL/trains/1 \
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

### Get seat availability for schedule

```bash
curl -X GET $BASE_URL/train-schedules/1/seats \
  -H "Authorization: Bearer $TOKEN"
```

### Get available seats for journey segment

```bash
curl -X GET "$BASE_URL/train-schedules/1/available-seats?fromStationId=1&toStationId=2" \
  -H "Authorization: Bearer $TOKEN"
```

## Ticket Booking

### Book a ticket

```bash
curl -X POST $BASE_URL/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "trainScheduleId": 1,
    "fromStationId": 1,
    "toStationId": 2,
    "compartmentId": 1,
    "seatNumber": "1",
    "passengerName": "John Doe",
    "passengerAge": 30,
    "passengerGender": "Male"
  }'
```

### Get user's tickets

```bash
curl -X GET $BASE_URL/tickets \
  -H "Authorization: Bearer $TOKEN"
```

### Get ticket by ID

```bash
curl -X GET $BASE_URL/tickets/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Cancel a ticket

```bash
curl -X PUT $BASE_URL/tickets/1/cancel \
  -H "Authorization: Bearer $TOKEN"
```

## Complete Workflow Example

Here's a complete example of setting up and using the RailNet API:

```bash
#!/bin/bash

# Set base URL
BASE_URL="http://localhost:3000"

echo "=== RailNet API Complete Workflow ==="

# 1. Register admin user
echo -e "\n1. Registering admin user..."
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@railnet.com",
    "firstName": "Admin",
    "lastName": "User",
    "password": "admin123",
    "role": "admin"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token')
echo "Admin token obtained"

# 2. Create stations
echo -e "\n2. Creating stations..."
curl -s -X POST $BASE_URL/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "New York Central", "city": "New York", "latitude": 40.7128, "longitude": -74.0060}' | jq '.id'

curl -s -X POST $BASE_URL/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Boston South", "city": "Boston", "latitude": 42.3601, "longitude": -71.0589}' | jq '.id'

curl -s -X POST $BASE_URL/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "New Haven Union", "city": "New Haven", "latitude": 41.3083, "longitude": -72.9279}' | jq '.id'

echo "Stations created: 1, 2, 3"

# 3. Create compartments
echo -e "\n3. Creating compartments..."
curl -s -X POST $BASE_URL/compartments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "First Class AC", "class": "First", "type": "AC", "price": 150.00, "totalSeats": 50}' | jq '.id'

curl -s -X POST $BASE_URL/compartments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Second Class Non-AC", "class": "Second", "type": "Non-AC", "price": 75.00, "totalSeats": 100}' | jq '.id'

echo "Compartments created: 1, 2"

# 4. Create train route
echo -e "\n4. Creating train route..."
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
  }' | jq '.id'

echo "Train route created: 1"

# 5. Create train
echo -e "\n5. Creating train..."
curl -s -X POST $BASE_URL/trains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Northeast Regional 101",
    "number": "NER101",
    "trainRouteId": 1,
    "compartments": [
      {"compartmentId": 1, "quantity": 2},
      {"compartmentId": 2, "quantity": 3}
    ]
  }' | jq '.id'

echo "Train created: 1"

# 6. Create schedule
echo -e "\n6. Creating train schedule..."
curl -s -X POST $BASE_URL/train-schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "trainId": 1,
    "date": "2025-12-01",
    "time": "08:00"
  }' | jq '.id'

echo "Schedule created: 1"

# 7. Register a regular user
echo -e "\n7. Registering regular user..."
USER_RESPONSE=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "user123"
  }')

USER_TOKEN=$(echo $USER_RESPONSE | jq -r '.token')
echo "User token obtained"

# 8. Search for trains
echo -e "\n8. Searching for trains from New York to Boston..."
curl -s -X GET "$BASE_URL/train-schedules/search?fromStationId=1&toStationId=2&date=2025-12-01" \
  -H "Authorization: Bearer $USER_TOKEN" | jq 'length'

echo "Found trains"

# 9. Check seat availability
echo -e "\n9. Checking seat availability..."
curl -s -X GET "$BASE_URL/train-schedules/1/available-seats?fromStationId=1&toStationId=2" \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.compartments[] | {name: .compartmentName, available: .availableSeats}'

# 10. Book a ticket
echo -e "\n10. Booking a ticket..."
TICKET_RESPONSE=$(curl -s -X POST $BASE_URL/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "trainScheduleId": 1,
    "fromStationId": 1,
    "toStationId": 2,
    "compartmentId": 1,
    "seatNumber": "1",
    "passengerName": "John Doe",
    "passengerAge": 30,
    "passengerGender": "Male"
  }')

TICKET_ID=$(echo $TICKET_RESPONSE | jq -r '.ticketId')
echo "Ticket booked with ID: $TICKET_ID"

# 11. View user's tickets
echo -e "\n11. Viewing user's tickets..."
curl -s -X GET $BASE_URL/tickets \
  -H "Authorization: Bearer $USER_TOKEN" | jq 'length'

echo "Tickets found"

# 12. View specific ticket
echo -e "\n12. Viewing ticket details..."
curl -s -X GET "$BASE_URL/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $USER_TOKEN" | jq '{id: .id, train: .trainSchedule.train.name, from: .fromStation.name, to: .toStation.name, seat: .seatNumber, status: .status}'

echo -e "\n=== Setup complete! API is ready to use. ==="
```

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation errors, invalid data) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (duplicate data, seat already booked) |
| `500` | Internal Server Error |

Error response format:
```json
{
  "error": "Error message description"
}
```

## Payment Processing Examples

### Book a ticket (as user)

First, book a ticket to get a ticket ID for payment:

```bash
# Book a ticket
TICKET_RESPONSE=$(curl -s -X POST $BASE_URL/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trainScheduleId": 1,
    "fromStationId": 1,
    "toStationId": 3,
    "compartmentId": 1,
    "seatNumber": "A1",
    "passengerName": "John Doe",
    "passengerAge": 30,
    "passengerGender": "Male"
  }')

# Extract ticket ID
TICKET_ID=$(echo $TICKET_RESPONSE | jq -r '.ticketId')
echo "Booked ticket ID: $TICKET_ID"
```

### Initiate payment for a ticket

```bash
# Initiate payment
PAYMENT_RESPONSE=$(curl -s -X POST $BASE_URL/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"ticketId\": $TICKET_ID
  }")

# Extract payment URL
PAYMENT_URL=$(echo $PAYMENT_RESPONSE | jq -r '.paymentUrl')
TRANSACTION_ID=$(echo $PAYMENT_RESPONSE | jq -r '.transactionId')

echo "Payment URL: $PAYMENT_URL"
echo "Transaction ID: $TRANSACTION_ID"
```

### Check ticket status after payment

```bash
# Check ticket status
curl -X GET $BASE_URL/tickets/$TICKET_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Admin: Manual cleanup of expired bookings

```bash
# Run manual cleanup (admin only)
curl -X POST $BASE_URL/payments/cleanup \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Admin: Get cleanup statistics

```bash
# Get pending booking statistics (admin only)
curl -X GET $BASE_URL/payments/cleanup/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## Notes

- Replace `$TOKEN` with your actual JWT token
- All admin operations require admin role (set during registration)
- Dates should be in YYYY-MM-DD format
- Times should be in HH:MM format (24-hour)
- The search endpoint validates station order and returns empty array if no valid routes found
- Seat numbers must be unique per train/date/compartment
- Tickets can only be cancelled up to 2 hours before departure
- **Ticket IDs**: Now use human-readable format `TRAIN-DATE-SEAT-RANDOM` (e.g., `EXPR-20241205-1A-042`)
- **Payment Flow**: Book ticket → Initiate payment → Complete payment on SSLCommerz → Ticket confirmed
- **Auto-Expiration**: Unpaid bookings expire after 10 minutes automatically
- **SSLCommerz**: Use sandbox mode for testing, production credentials for live payments


- Replace `$TOKEN` with your actual JWT token
- All admin operations require admin role (set during registration)
- Dates should be in YYYY-MM-DD format
- Times should be in HH:MM format (24-hour)
- The search endpoint validates station order and returns empty array if no valid routes found
- Seat numbers must be unique per train/date/compartment
- Tickets can only be cancelled up to 2 hours before departure
