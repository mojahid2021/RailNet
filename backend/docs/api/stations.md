# Station Management API Documentation

The Station Management API provides complete CRUD operations for railway stations, including geographic coordinates for location tracking.

## Base URL
```
/api/v1/stations
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Endpoints

### 1. Create Station

Create a new railway station with geographic location data.

**Endpoint:** `POST /api/v1/stations`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Dhaka Railway Station",
  "city": "Dhaka",
  "district": "Dhaka",
  "division": "Dhaka",
  "latitude": 23.7104,
  "longitude": 90.4074
}
```

**Request Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Station name |
| city | string | Yes | City name |
| district | string | Yes | District name |
| division | string | Yes | Division/state name |
| latitude | number | Yes | Geographic latitude |
| longitude | number | Yes | Geographic longitude |

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Station created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Dhaka Railway Station",
    "city": "Dhaka",
    "district": "Dhaka",
    "division": "Dhaka",
    "latitude": 23.7104,
    "longitude": 90.4074,
    "createdAt": "2025-11-24T19:49:27.848Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Validation error

---

### 2. Get All Stations

Retrieve a list of all railway stations, ordered by creation date (newest first).

**Endpoint:** `GET /api/v1/stations`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Dhaka Railway Station",
      "city": "Dhaka",
      "district": "Dhaka",
      "division": "Dhaka",
      "latitude": 23.7104,
      "longitude": 90.4074,
      "createdAt": "2025-11-24T19:49:27.848Z",
      "updatedAt": "2025-11-24T19:49:27.848Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Chittagong Railway Station",
      "city": "Chittagong",
      "district": "Chittagong",
      "division": "Chittagong",
      "latitude": 22.3569,
      "longitude": 91.7832,
      "createdAt": "2025-11-24T18:30:00.000Z",
      "updatedAt": "2025-11-24T18:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

---

### 3. Get Station by ID

Retrieve detailed information about a specific station.

**Endpoint:** `GET /api/v1/stations/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Station ID |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Dhaka Railway Station",
    "city": "Dhaka",
    "district": "Dhaka",
    "division": "Dhaka",
    "latitude": 23.7104,
    "longitude": 90.4074,
    "createdAt": "2025-11-24T19:49:27.848Z",
    "updatedAt": "2025-11-24T19:49:27.848Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Station not found
```json
{
  "success": false,
  "error": "Station not found"
}
```

---

### 4. Update Station

Update an existing station's information.

**Endpoint:** `PUT /api/v1/stations/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Station ID |

**Request Body:**
All fields are optional; only include fields you want to update.

```json
{
  "name": "Dhaka Central Railway Station",
  "city": "Dhaka",
  "district": "Dhaka",
  "division": "Dhaka",
  "latitude": 23.7104,
  "longitude": 90.4074
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Station updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Dhaka Central Railway Station",
    "city": "Dhaka",
    "district": "Dhaka",
    "division": "Dhaka",
    "latitude": 23.7104,
    "longitude": 90.4074,
    "updatedAt": "2025-11-24T20:00:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Station not found

---

### 5. Delete Station

Delete a station from the system.

**Endpoint:** `DELETE /api/v1/stations/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Station ID |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Station deleted successfully",
  "data": null
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Station not found

**⚠️ Warning:** Deleting a station may fail if it's referenced in train routes. Ensure the station is not being used before deletion.

---

## Data Model

### Station Object
```typescript
{
  id: string;          // UUID
  name: string;        // Station name
  city: string;        // City name
  district: string;    // District name
  division: string;    // Division/state name
  latitude: number;    // Geographic latitude (-90 to 90)
  longitude: number;   // Geographic longitude (-180 to 180)
  createdAt: string;   // ISO 8601 timestamp
  updatedAt: string;   // ISO 8601 timestamp
}
```

## Business Rules

1. **Geographic Coordinates**: Latitude and longitude are used for:
   - Map visualization
   - Distance calculations between stations
   - Real-time train tracking
   
2. **Administrative Divisions**: The hierarchical structure (division > district > city) helps in:
   - Organizing stations by region
   - Filtering and searching
   - Administrative reporting

3. **Station Dependencies**: Stations may be referenced by:
   - Train routes (start/end stations)
   - Route station sequences
   - This creates foreign key constraints that must be respected

## Example Usage

### JavaScript/Node.js
```javascript
const token = 'your-jwt-token';
const baseURL = 'http://localhost:3000/api/v1';

// Create Station
const createStation = async () => {
  const response = await fetch(`${baseURL}/stations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Sylhet Railway Station',
      city: 'Sylhet',
      district: 'Sylhet',
      division: 'Sylhet',
      latitude: 24.8949,
      longitude: 91.8687
    })
  });
  return await response.json();
};

// Get All Stations
const getAllStations = async () => {
  const response = await fetch(`${baseURL}/stations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Update Station
const updateStation = async (stationId) => {
  const response = await fetch(`${baseURL}/stations/${stationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Updated Station Name'
    })
  });
  return await response.json();
};

// Delete Station
const deleteStation = async (stationId) => {
  const response = await fetch(`${baseURL}/stations/${stationId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

### cURL Examples
```bash
# Create Station
curl -X POST http://localhost:3000/api/v1/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Sylhet Railway Station",
    "city": "Sylhet",
    "district": "Sylhet",
    "division": "Sylhet",
    "latitude": 24.8949,
    "longitude": 91.8687
  }'

# Get All Stations
curl -X GET http://localhost:3000/api/v1/stations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Station by ID
curl -X GET http://localhost:3000/api/v1/stations/STATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update Station
curl -X PUT http://localhost:3000/api/v1/stations/STATION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Station Name"
  }'

# Delete Station
curl -X DELETE http://localhost:3000/api/v1/stations/STATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Related Documentation
- [Train Routes API](train-routes.md) - Stations are used in train routes
- [Database Schema](../workflows/database-schema.md) - Station data model
- [API Testing Guide](../guides/api-testing-guide.md)

---

**Last Updated**: 2025-11-24
