# API Testing Guide

This comprehensive guide will help you test the RailNet backend APIs using various tools and methods.

## Testing Tools

### 1. Swagger UI (Recommended for Beginners)
- **URL**: http://localhost:3000/docs
- **Best for**: Quick testing, exploring endpoints
- **Features**: Interactive, auto-documentation, no setup required

### 2. cURL (Command Line)
- **Best for**: Scripting, automation, CI/CD
- **Features**: Available on all systems, scriptable

### 3. Postman
- **Best for**: Complex workflows, team collaboration
- **Features**: Collections, environments, testing scripts

### 4. HTTPie
- **Best for**: User-friendly CLI testing
- **Features**: Colored output, intuitive syntax

## Getting Started

### Prerequisites
1. Backend server running on http://localhost:3000
2. PostgreSQL database configured
3. Environment variables set

### Start the Server
```bash
cd backend
npm run dev
```

Verify server is running:
```bash
curl http://localhost:3000
# Expected: {"status":"Server is running..."}
```

## Testing Workflow

### Complete Test Flow

```
1. Register Admin
   ↓
2. Login (Get JWT Token)
   ↓
3. Create Compartments
   ↓
4. Create Stations
   ↓
5. Create Train Route
   ↓
6. Create Train
   ↓
7. Test CRUD Operations
```

## Method 1: Using Swagger UI

### Step 1: Access Swagger UI
Open http://localhost:3000/docs in your browser

### Step 2: Register Admin
1. Find **POST /api/v1/admin/register**
2. Click to expand
3. Click **"Try it out"**
4. Fill in the request body:
```json
{
  "firstName": "Test",
  "lastName": "Admin",
  "email": "test@example.com",
  "password": "password123"
}
```
5. Click **"Execute"**
6. Check response (should be 201 Created)

### Step 3: Login
1. Find **POST /api/v1/admin/login**
2. Click **"Try it out"**
3. Fill in credentials:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
4. Click **"Execute"**
5. **Copy the token** from the response

### Step 4: Authorize
1. Click the **"Authorize"** button at the top
2. In the "Value" field, enter: `Bearer YOUR_TOKEN_HERE`
3. Click **"Authorize"**
4. Click **"Close"**

Now all subsequent requests will include your authentication token!

### Step 5: Test Protected Endpoints
Try creating a station:
1. Find **POST /api/v1/stations**
2. Click **"Try it out"**
3. Fill in station data:
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
4. Click **"Execute"**
5. Verify 201 Created response

## Method 2: Using cURL

### Complete Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api/v1"
EMAIL="test@example.com"
PASSWORD="password123"

echo "=== RailNet API Testing ==="
echo

# 1. Register Admin
echo "1. Registering admin..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"Admin\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
echo "Register Response: $REGISTER_RESPONSE"
echo

# 2. Login
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
echo "Login Response: $LOGIN_RESPONSE"

# Extract token using jq
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "Token: $TOKEN"
echo

# 3. Get Profile
echo "3. Getting admin profile..."
curl -s -X GET "$BASE_URL/admin/profile" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo

# 4. Create Station
echo "4. Creating station..."
STATION_RESPONSE=$(curl -s -X POST "$BASE_URL/stations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Dhaka Railway Station",
    "city": "Dhaka",
    "district": "Dhaka",
    "division": "Dhaka",
    "latitude": 23.7104,
    "longitude": 90.4074
  }')
echo "Station Response: $STATION_RESPONSE"

# Extract station ID using jq
STATION_ID=$(echo $STATION_RESPONSE | jq -r '.data.id')
echo "Station ID: $STATION_ID"
echo

# 5. Get All Stations
echo "5. Getting all stations..."
curl -s -X GET "$BASE_URL/stations" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo

# 6. Create Compartment
echo "6. Creating compartment..."
COMP_RESPONSE=$(curl -s -X POST "$BASE_URL/compartments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "AC Sleeper",
    "type": "AC_SLEEPER",
    "price": 1200.50,
    "totalSeat": 60
  }')
echo "Compartment Response: $COMP_RESPONSE"
echo

echo "=== Testing Complete ==="
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

### Individual cURL Commands

#### Register Admin
```bash
curl -X POST http://localhost:3000/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Login and Save Token
```bash
# Login and save response
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Verify token
echo "Token: $TOKEN"
```

#### Use Token in Requests
```bash
# Get profile
curl -X GET http://localhost:3000/api/v1/admin/profile \
  -H "Authorization: Bearer $TOKEN"

# Create station
curl -X POST http://localhost:3000/api/v1/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Station",
    "city": "Dhaka",
    "district": "Dhaka",
    "division": "Dhaka",
    "latitude": 23.7104,
    "longitude": 90.4074
  }'
```

## Method 3: Using Postman

### Setup Collection

1. **Import OpenAPI Specification**
   - Open Postman
   - Click "Import"
   - Enter URL: http://localhost:3000/docs/json
   - Click "Import"

2. **Create Environment**
   - Click "Environments" in sidebar
   - Click "+" to create new environment
   - Name it "RailNet Local"
   - Add variables:
     ```
     base_url: http://localhost:3000/api/v1
     token: (leave empty for now)
     ```
   - Save

3. **Set Up Authorization**
   - Select your collection
   - Go to "Authorization" tab
   - Type: Bearer Token
   - Token: `{{token}}`

### Testing Steps

#### 1. Register Admin
- Request: POST `{{base_url}}/admin/register`
- Body (JSON):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
- Send and verify 201 response

#### 2. Login and Capture Token
- Request: POST `{{base_url}}/admin/login`
- Body (JSON):
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- Go to "Tests" tab
- Add script:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.data.token);
    console.log("Token saved:", response.data.token);
}
```
- Send request
- Token is now automatically saved to environment

#### 3. Test Protected Endpoints
All subsequent requests will use the token automatically!

### Postman Collection Example

Create a collection with these requests:

```
RailNet API Tests/
├── Authentication/
│   ├── Register Admin
│   ├── Login
│   └── Get Profile
├── Stations/
│   ├── Create Station
│   ├── Get All Stations
│   ├── Get Station by ID
│   ├── Update Station
│   └── Delete Station
├── Compartments/
│   ├── Create Compartment
│   ├── Get All Compartments
│   └── ...
└── Trains/
    ├── Create Train
    └── ...
```

## Method 4: Using HTTPie

HTTPie provides a more user-friendly CLI experience.

### Installation
```bash
# macOS
brew install httpie

# Ubuntu/Debian
sudo apt install httpie

# Python pip
pip install httpie
```

### Testing Commands

#### Register
```bash
http POST localhost:3000/api/v1/admin/register \
  firstName=John \
  lastName=Doe \
  email=john@example.com \
  password=password123
```

#### Login
```bash
http POST localhost:3000/api/v1/admin/login \
  email=john@example.com \
  password=password123
```

#### Authenticated Request
```bash
# Set token variable
TOKEN="your-jwt-token-here"

# Get profile
http GET localhost:3000/api/v1/admin/profile \
  "Authorization:Bearer $TOKEN"

# Create station
http POST localhost:3000/api/v1/stations \
  "Authorization:Bearer $TOKEN" \
  name="Dhaka Station" \
  city=Dhaka \
  district=Dhaka \
  division=Dhaka \
  latitude:=23.7104 \
  longitude:=90.4074
```

## Test Scenarios

### Scenario 1: Complete Train Setup

```bash
TOKEN="your-token-here"
BASE_URL="http://localhost:3000/api/v1"

# 1. Create compartments
COMP1=$(curl -s -X POST "$BASE_URL/compartments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"AC Sleeper","type":"AC_SLEEPER","price":1200,"totalSeat":60}' \
  | jq -r '.data.id')

# 2. Create stations
STATION1=$(curl -s -X POST "$BASE_URL/stations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Dhaka","city":"Dhaka","district":"Dhaka","division":"Dhaka","latitude":23.7104,"longitude":90.4074}' \
  | jq -r '.data.id')

STATION2=$(curl -s -X POST "$BASE_URL/stations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Chittagong","city":"Chittagong","district":"Chittagong","division":"Chittagong","latitude":22.3569,"longitude":91.7832}' \
  | jq -r '.data.id')

# 3. Create train route
ROUTE=$(curl -s -X POST "$BASE_URL/train-routes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Dhaka-Chittagong Route\",
    \"totalDistance\": 264.5,
    \"startStationId\": \"$STATION1\",
    \"endStationId\": \"$STATION2\",
    \"stations\": [
      {
        \"currentStationId\": \"$STATION1\",
        \"beforeStationId\": null,
        \"nextStationId\": \"$STATION2\",
        \"distance\": 0,
        \"distanceFromStart\": 0
      },
      {
        \"currentStationId\": \"$STATION2\",
        \"beforeStationId\": \"$STATION1\",
        \"nextStationId\": null,
        \"distance\": 264.5,
        \"distanceFromStart\": 264.5
      }
    ],
    \"compartmentIds\": [\"$COMP1\"]
  }" | jq -r '.data.id')

# 4. Create train
curl -X POST "$BASE_URL/trains" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Suborno Express\",
    \"number\": \"701\",
    \"type\": \"INTERCITY\",
    \"trainRouteId\": \"$ROUTE\",
    \"compartmentIds\": [\"$COMP1\"]
  }"
```

### Scenario 2: Error Testing

Test error responses:

```bash
# 1. Duplicate email (409)
curl -X POST "$BASE_URL/admin/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "existing@example.com",
    "password": "password123"
  }'

# 2. Invalid credentials (401)
curl -X POST "$BASE_URL/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@example.com",
    "password": "wrongpassword"
  }'

# 3. Missing token (401)
curl -X GET "$BASE_URL/admin/profile"

# 4. Invalid token (401)
curl -X GET "$BASE_URL/admin/profile" \
  -H "Authorization: Bearer invalid-token"

# 5. Not found (404)
curl -X GET "$BASE_URL/stations/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN"
```

## Validation Testing

### Test Required Fields
```bash
# Missing required field
curl -X POST "$BASE_URL/stations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Station",
    "city": "Dhaka"
  }'
# Expected: 400 Bad Request with validation error
```

### Test Data Types
```bash
# Invalid data type (string instead of number)
curl -X POST "$BASE_URL/stations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "city": "Dhaka",
    "district": "Dhaka",
    "division": "Dhaka",
    "latitude": "not-a-number",
    "longitude": 90.4074
  }'
# Expected: 400 Bad Request
```

## Response Validation

### Expected Response Format

**Success Response**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Automated Testing

### Jest/Supertest Example

```javascript
// tests/api/auth.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Authentication API', () => {
  describe('POST /admin/register', () => {
    it('should register new admin', async () => {
      const response = await request(app)
        .post('/api/v1/admin/register')
        .send({
          firstName: 'Test',
          lastName: 'Admin',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should reject duplicate email', async () => {
      // Register first time
      await request(app)
        .post('/api/v1/admin/register')
        .send({ /* ... */ });
      
      // Try to register again
      const response = await request(app)
        .post('/api/v1/admin/register')
        .send({ /* same email */ });
      
      expect(response.status).toBe(409);
    });
  });

  describe('POST /admin/login', () => {
    it('should return token on valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/admin/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('token');
    });
  });
});
```

## Tips and Best Practices

### 1. Use Environment Variables
```bash
# Save frequently used values
export API_URL="http://localhost:3000/api/v1"
export TOKEN="your-jwt-token"

# Use in commands
curl -X GET "$API_URL/stations" -H "Authorization: Bearer $TOKEN"
```

### 2. Format JSON Output
```bash
# Pretty print with jq
curl -s http://localhost:3000/api/v1/stations \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Extract specific field
curl -s http://localhost:3000/api/v1/stations \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0].name'
```

### 3. Save Response to File
```bash
curl -X GET "$API_URL/stations" \
  -H "Authorization: Bearer $TOKEN" \
  -o stations.json
```

### 4. Verbose Output for Debugging
```bash
curl -v -X POST "$API_URL/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Common Issues

### Issue 1: 401 Unauthorized
- Check token is valid
- Verify token format: `Bearer <token>`
- Ensure token hasn't expired

### Issue 2: 404 Not Found
- Verify endpoint URL is correct
- Check API_PREFIX in environment
- Ensure server is running

### Issue 3: 400 Bad Request
- Validate JSON syntax
- Check all required fields are present
- Verify data types match schema

## Related Documentation
- [Authentication API](../api/admin-auth.md)
- [All API Documentation](../api/)
- [Getting Started Guide](getting-started.md)
- [Authentication Flow](../workflows/authentication-flow.md)

---

**Last Updated**: 2025-11-24
