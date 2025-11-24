# Train Management API Documentation

The Train Management API provides complete CRUD operations for trains, including train details, route assignments, and compartment configurations.

## Base URL
```
/api/v1/trains
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Endpoints

### 1. Create Train

Create a new train with route assignment and compartment configuration.

**Endpoint:** `POST /api/v1/trains`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Suborno Express",
  "number": "701",
  "type": "INTERCITY",
  "trainRouteId": "route-uuid-1",
  "compartmentIds": [
    "compartment-uuid-1",
    "compartment-uuid-2",
    "compartment-uuid-3"
  ]
}
```

**Request Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Train name |
| number | string | Yes | Unique train number |
| type | string | Yes | Train type/category |
| trainRouteId | string (UUID) | No | Assigned route ID |
| compartmentIds | array | No | List of compartment IDs |

**Common Train Types:**
- `INTERCITY` - Intercity express train
- `MAIL_EXPRESS` - Mail/Express train
- `LOCAL` - Local commuter train
- `SPECIAL` - Special service train
- `FREIGHT` - Freight train

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Train created successfully",
  "data": {
    "id": "train-uuid-1",
    "name": "Suborno Express",
    "number": "701",
    "type": "INTERCITY",
    "trainRouteId": "route-uuid-1",
    "trainRoute": {
      "id": "route-uuid-1",
      "name": "Dhaka to Chittagong Express Route"
    },
    "compartments": [
      {
        "id": "tc-uuid-1",
        "compartment": {
          "id": "compartment-uuid-1",
          "name": "AC Sleeper",
          "type": "AC_SLEEPER",
          "price": 1200.50,
          "totalSeat": 60
        }
      },
      {
        "id": "tc-uuid-2",
        "compartment": {
          "id": "compartment-uuid-2",
          "name": "AC Chair",
          "type": "AC_CHAIR",
          "price": 800.00,
          "totalSeat": 80
        }
      }
    ],
    "createdAt": "2025-11-24T19:49:27.848Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `409 Conflict` - Train number already exists
```json
{
  "success": false,
  "error": "Train with this number already exists"
}
```
- `404 Not Found` - Train route or compartment not found
- `400 Bad Request` - Validation error

---

### 2. Get All Trains

Retrieve a list of all trains with their routes and compartments.

**Endpoint:** `GET /api/v1/trains`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "train-uuid-1",
      "name": "Suborno Express",
      "number": "701",
      "type": "INTERCITY",
      "trainRouteId": "route-uuid-1",
      "trainRoute": {
        "id": "route-uuid-1",
        "name": "Dhaka to Chittagong Express Route"
      },
      "compartments": [
        {
          "id": "tc-uuid-1",
          "compartment": {
            "id": "compartment-uuid-1",
            "name": "AC Sleeper",
            "type": "AC_SLEEPER",
            "price": 1200.50,
            "totalSeat": 60
          }
        }
      ],
      "createdAt": "2025-11-24T19:49:27.848Z",
      "updatedAt": "2025-11-24T19:49:27.848Z"
    }
    // ... more trains
  ]
}
```

---

### 3. Get Train by ID

Retrieve detailed information about a specific train.

**Endpoint:** `GET /api/v1/trains/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Train ID |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "train-uuid-1",
    "name": "Suborno Express",
    "number": "701",
    "type": "INTERCITY",
    "trainRouteId": "route-uuid-1",
    "trainRoute": {
      "id": "route-uuid-1",
      "name": "Dhaka to Chittagong Express Route"
    },
    "compartments": [
      {
        "id": "tc-uuid-1",
        "compartment": {
          "id": "compartment-uuid-1",
          "name": "AC Sleeper",
          "type": "AC_SLEEPER",
          "price": 1200.50,
          "totalSeat": 60
        }
      },
      {
        "id": "tc-uuid-2",
        "compartment": {
          "id": "compartment-uuid-2",
          "name": "AC Chair",
          "type": "AC_CHAIR",
          "price": 800.00,
          "totalSeat": 80
        }
      }
    ],
    "createdAt": "2025-11-24T19:49:27.848Z",
    "updatedAt": "2025-11-24T19:49:27.848Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Train not found
```json
{
  "success": false,
  "error": "Train not found"
}
```

---

### 4. Update Train

Update an existing train's information, including route and compartment assignments.

**Endpoint:** `PUT /api/v1/trains/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Train ID |

**Request Body:**
All fields are optional; only include fields you want to update.

```json
{
  "name": "Suborno Premium Express",
  "number": "701",
  "type": "INTERCITY",
  "trainRouteId": "route-uuid-2",
  "compartmentIds": [
    "compartment-uuid-1",
    "compartment-uuid-4"
  ]
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Train updated successfully",
  "data": {
    "id": "train-uuid-1",
    "name": "Suborno Premium Express",
    "number": "701",
    "type": "INTERCITY",
    "trainRouteId": "route-uuid-2",
    "trainRoute": {
      "id": "route-uuid-2",
      "name": "Updated Route"
    },
    "compartments": [
      // Updated compartments
    ],
    "updatedAt": "2025-11-24T20:00:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `409 Conflict` - Train number already exists (when updating number)
- `404 Not Found` - Train, route, or compartment not found
- `400 Bad Request` - Validation error

**Note:** Updating `compartmentIds` will replace all existing compartment assignments with the new list.

---

### 5. Delete Train

Delete a train from the system.

**Endpoint:** `DELETE /api/v1/trains/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Train ID |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Train deleted successfully",
  "data": null
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Train not found

**⚠️ Warning:** Deleting a train will cascade delete all compartment assignments. Ensure the train is not in active service before deletion.

---

## Data Model

### Train Object
```typescript
{
  id: string;
  name: string;              // Display name (e.g., "Suborno Express")
  number: string;            // Unique identifier (e.g., "701")
  type: string;              // Train category
  trainRouteId: string | null;
  trainRoute?: {             // Populated route object
    id: string;
    name: string;
  };
  compartments: TrainCompartment[];
  createdAt: string;
  updatedAt: string;
}
```

### TrainCompartment Object
```typescript
{
  id: string;                // Junction table ID
  trainId: string;
  compartmentId: string;
  train: Train;              // Reference to train
  compartment: Compartment;  // Populated compartment details
}
```

## Business Rules

1. **Unique Train Numbers**:
   - Each train must have a unique number
   - Train numbers typically follow railway numbering conventions
   - Common format: 3-4 digit numbers (e.g., "701", "9201")

2. **Route Assignment**:
   - A train can operate on one route at a time
   - Routes can be changed (e.g., for seasonal services)
   - `trainRouteId` can be null for trains not yet assigned to routes

3. **Compartment Configuration**:
   - Multiple compartments define the train's composition
   - Same compartment type can be added multiple times (e.g., 3x AC Sleeper)
   - Total train capacity = sum of all compartment seats
   - Compartments determine available ticket classes

4. **Train Capacity Calculation**:
   ```
   Total Seats = Σ (compartment.totalSeat for each compartment)
   ```

5. **Train Types Usage**:
   - `INTERCITY`: Fast trains between major cities
   - `MAIL_EXPRESS`: Regular long-distance trains
   - `LOCAL`: Commuter trains with frequent stops
   - `SPECIAL`: Festival specials, tourist trains

## Example Usage

### JavaScript/Node.js
```javascript
const token = 'your-jwt-token';
const baseURL = 'http://localhost:3000/api/v1';

// Create Train with Route and Compartments
const createTrain = async () => {
  const response = await fetch(`${baseURL}/trains`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Paharika Express',
      number: '801',
      type: 'INTERCITY',
      trainRouteId: 'route-uuid-1',
      compartmentIds: [
        'ac-sleeper-uuid',
        'ac-chair-uuid',
        'economy-uuid'
      ]
    })
  });
  return await response.json();
};

// Get All Trains
const getAllTrains = async () => {
  const response = await fetch(`${baseURL}/trains`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Update Train Route
const updateTrainRoute = async (trainId, newRouteId) => {
  const response = await fetch(`${baseURL}/trains/${trainId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      trainRouteId: newRouteId
    })
  });
  return await response.json();
};

// Calculate Train Capacity
const calculateTrainCapacity = async (trainId) => {
  const response = await fetch(`${baseURL}/trains/${trainId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  if (data.success) {
    const totalSeats = data.data.compartments.reduce((sum, tc) => {
      return sum + tc.compartment.totalSeat;
    }, 0);
    console.log(`Total train capacity: ${totalSeats} seats`);
    return totalSeats;
  }
};

// Delete Train
const deleteTrain = async (trainId) => {
  const response = await fetch(`${baseURL}/trains/${trainId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

### cURL Examples
```bash
# Create Train
curl -X POST http://localhost:3000/api/v1/trains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Paharika Express",
    "number": "801",
    "type": "INTERCITY",
    "trainRouteId": "ROUTE_ID",
    "compartmentIds": ["COMP_ID_1", "COMP_ID_2"]
  }'

# Get All Trains
curl -X GET http://localhost:3000/api/v1/trains \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Train by ID
curl -X GET http://localhost:3000/api/v1/trains/TRAIN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update Train
curl -X PUT http://localhost:3000/api/v1/trains/TRAIN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Train Name",
    "trainRouteId": "NEW_ROUTE_ID"
  }'

# Delete Train
curl -X DELETE http://localhost:3000/api/v1/trains/TRAIN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Use Cases

### 1. Complete Train Setup
```javascript
// Step 1: Create stations
// Step 2: Create compartments
// Step 3: Create route
// Step 4: Create train with route and compartments

const setupNewTrain = async () => {
  // Assuming stations, compartments, and route are already created
  const train = await createTrain({
    name: 'Silk City Express',
    number: '902',
    type: 'INTERCITY',
    trainRouteId: existingRouteId,
    compartmentIds: [acSleeperCompartmentId, economyCompartmentId]
  });
  
  console.log('Train created:', train);
};
```

### 2. Seasonal Route Change
```javascript
// Change train route for different season
const changeSeasonalRoute = async (trainId, summerRouteId, winterRouteId) => {
  const currentMonth = new Date().getMonth();
  const isSummer = currentMonth >= 3 && currentMonth <= 8;
  
  const routeId = isSummer ? summerRouteId : winterRouteId;
  await updateTrainRoute(trainId, routeId);
};
```

### 3. Train Fleet Management
```javascript
// Get all trains and their capacities
const getFleetOverview = async () => {
  const trains = await getAllTrains();
  
  const fleetData = trains.data.map(train => ({
    name: train.name,
    number: train.number,
    route: train.trainRoute?.name || 'Not assigned',
    totalSeats: train.compartments.reduce((sum, tc) => 
      sum + tc.compartment.totalSeat, 0
    )
  }));
  
  console.table(fleetData);
};
```

## Related Documentation
- [Train Routes API](train-routes.md) - Manage routes for trains
- [Compartment API](compartments.md) - Manage train compartments
- [Station Management API](stations.md) - Stations in routes
- [Database Schema](../workflows/database-schema.md) - Train data model
- [API Testing Guide](../guides/api-testing-guide.md)

---

**Last Updated**: 2025-11-24
