# Compartment Management API Documentation

The Compartment Management API provides CRUD operations for train compartments (coach types), including seat configurations and pricing.

## Base URL
```
/api/v1/compartments
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Endpoints

### 1. Create Compartment

Create a new compartment type with pricing and seat configuration.

**Endpoint:** `POST /api/v1/compartments`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "AC Sleeper",
  "type": "AC_SLEEPER",
  "price": 1200.50,
  "totalSeat": 60
}
```

**Request Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Compartment display name |
| type | string | Yes | Compartment type identifier |
| price | number | Yes | Base price for this compartment type |
| totalSeat | integer | Yes | Total number of seats in compartment |

**Common Compartment Types:**
- `AC_SLEEPER` - Air-conditioned sleeper coach
- `AC_CHAIR` - Air-conditioned seating coach
- `NON_AC_SLEEPER` - Non-AC sleeper coach
- `NON_AC_CHAIR` - Non-AC seating coach
- `FIRST_CLASS` - First class compartment
- `ECONOMY` - Economy class

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Compartment created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "AC Sleeper",
    "type": "AC_SLEEPER",
    "price": 1200.50,
    "totalSeat": 60,
    "createdAt": "2025-11-24T19:49:27.848Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Validation error

---

### 2. Get All Compartments

Retrieve a list of all compartment types, ordered by creation date (newest first).

**Endpoint:** `GET /api/v1/compartments`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "AC Sleeper",
      "type": "AC_SLEEPER",
      "price": 1200.50,
      "totalSeat": 60,
      "createdAt": "2025-11-24T19:49:27.848Z",
      "updatedAt": "2025-11-24T19:49:27.848Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "AC Chair",
      "type": "AC_CHAIR",
      "price": 800.00,
      "totalSeat": 80,
      "createdAt": "2025-11-24T18:30:00.000Z",
      "updatedAt": "2025-11-24T18:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Compartment by ID

Retrieve detailed information about a specific compartment type.

**Endpoint:** `GET /api/v1/compartments/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Compartment ID |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "AC Sleeper",
    "type": "AC_SLEEPER",
    "price": 1200.50,
    "totalSeat": 60,
    "createdAt": "2025-11-24T19:49:27.848Z",
    "updatedAt": "2025-11-24T19:49:27.848Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Compartment not found
```json
{
  "success": false,
  "error": "Compartment not found"
}
```

---

### 4. Update Compartment

Update an existing compartment's information.

**Endpoint:** `PUT /api/v1/compartments/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Compartment ID |

**Request Body:**
All fields are optional; only include fields you want to update.

```json
{
  "name": "Premium AC Sleeper",
  "type": "AC_SLEEPER",
  "price": 1500.00,
  "totalSeat": 55
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Compartment updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Premium AC Sleeper",
    "type": "AC_SLEEPER",
    "price": 1500.00,
    "totalSeat": 55,
    "updatedAt": "2025-11-24T20:00:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Compartment not found

---

### 5. Delete Compartment

Delete a compartment type from the system.

**Endpoint:** `DELETE /api/v1/compartments/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Compartment ID |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Compartment deleted successfully",
  "data": null
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Compartment not found

**⚠️ Warning:** Deleting a compartment may fail if it's assigned to trains. Ensure no trains are using this compartment before deletion.

---

## Data Model

### Compartment Object
```typescript
{
  id: string;          // UUID
  name: string;        // Display name (e.g., "AC Sleeper")
  type: string;        // Type identifier (e.g., "AC_SLEEPER")
  price: number;       // Base price in currency units
  totalSeat: number;   // Total number of seats
  createdAt: string;   // ISO 8601 timestamp
  updatedAt: string;   // ISO 8601 timestamp
}
```

## Business Rules

1. **Pricing Strategy**:
   - `price` represents the base fare per seat
   - Dynamic pricing can be applied on top of base price
   - Different compartment types have different price points

2. **Seat Configuration**:
   - `totalSeat` defines the capacity of one compartment
   - A train can have multiple compartments of the same type
   - Total train capacity = sum of all compartment seats

3. **Compartment Assignment**:
   - Compartments are assigned to trains via the Train Management API
   - Multiple trains can use the same compartment type
   - Compartment types serve as templates for train composition

4. **Common Pricing Structure**:
   - AC Sleeper: Highest tier (Premium comfort)
   - AC Chair: Mid-high tier (Comfortable seating)
   - Non-AC Sleeper: Mid tier (Budget sleeper)
   - Non-AC Chair: Economy tier (Most affordable)

## Example Usage

### JavaScript/Node.js
```javascript
const token = 'your-jwt-token';
const baseURL = 'http://localhost:3000/api/v1';

// Create Compartment
const createCompartment = async () => {
  const response = await fetch(`${baseURL}/compartments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'First Class AC',
      type: 'FIRST_CLASS',
      price: 2000.00,
      totalSeat: 40
    })
  });
  return await response.json();
};

// Get All Compartments
const getAllCompartments = async () => {
  const response = await fetch(`${baseURL}/compartments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Update Compartment Price
const updateCompartmentPrice = async (compartmentId, newPrice) => {
  const response = await fetch(`${baseURL}/compartments/${compartmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ price: newPrice })
  });
  return await response.json();
};

// Delete Compartment
const deleteCompartment = async (compartmentId) => {
  const response = await fetch(`${baseURL}/compartments/${compartmentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

### cURL Examples
```bash
# Create Compartment
curl -X POST http://localhost:3000/api/v1/compartments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "First Class AC",
    "type": "FIRST_CLASS",
    "price": 2000.00,
    "totalSeat": 40
  }'

# Get All Compartments
curl -X GET http://localhost:3000/api/v1/compartments \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Compartment by ID
curl -X GET http://localhost:3000/api/v1/compartments/COMPARTMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update Compartment
curl -X PUT http://localhost:3000/api/v1/compartments/COMPARTMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "price": 2200.00
  }'

# Delete Compartment
curl -X DELETE http://localhost:3000/api/v1/compartments/COMPARTMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Use Cases

### 1. Setting Up Train Classes
```javascript
// Define standard compartment types for the railway system
const compartmentTypes = [
  { name: 'AC Sleeper', type: 'AC_SLEEPER', price: 1200, totalSeat: 60 },
  { name: 'AC Chair', type: 'AC_CHAIR', price: 800, totalSeat: 80 },
  { name: 'Non-AC Sleeper', type: 'NON_AC_SLEEPER', price: 600, totalSeat: 72 },
  { name: 'Economy', type: 'ECONOMY', price: 300, totalSeat: 100 }
];

for (const comp of compartmentTypes) {
  await createCompartment(comp);
}
```

### 2. Dynamic Pricing Update
```javascript
// Update prices during peak season
const updatePeakSeasonPricing = async () => {
  const compartments = await getAllCompartments();
  
  for (const comp of compartments.data) {
    const peakPrice = comp.price * 1.2; // 20% increase
    await updateCompartmentPrice(comp.id, peakPrice);
  }
};
```

## Related Documentation
- [Train Management API](trains.md) - Assign compartments to trains
- [Train Routes API](train-routes.md) - Routes also use compartment configurations
- [Database Schema](../workflows/database-schema.md) - Compartment data model
- [API Testing Guide](../guides/api-testing-guide.md)

---

**Last Updated**: 2025-11-24
