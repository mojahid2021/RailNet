# Authentication API Documentation

The Authentication API provides user registration and login functionality for the RailNet system.

## Base URL

```bash
/api/v1/auth
```

## Authentication

The login endpoint returns a JWT token that should be included in the Authorization header for protected endpoints:

```bash
Authorization: Bearer <jwt-token>
```

## Endpoints

### 1. User Registration

Register a new user account for ticket booking.

**Endpoint:** `POST /api/v1/auth/register`

**Authentication:** Not Required

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "+8801712345678"
}
```

**Request Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | string | Yes | User's first name |
| lastName | string | Yes | User's last name |
| email | string | Yes | Valid email address (unique) |
| password | string | Yes | Password (minimum 6 characters) |
| phone | string | No | Phone number |

**Success Response:** `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user-uuid-1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+8801712345678",
    "createdAt": "2025-11-26T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `409 Conflict` - Email already exists

```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

- `400 Bad Request` - Validation error

---

### 2. User Login

Authenticate user credentials and receive JWT token.

**Endpoint:** `POST /api/v1/auth/login`

**Authentication:** Not Required

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Request Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid-1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+8801712345678"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid credentials

```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 3. Book Ticket

Book a train ticket for an authenticated user with distance-based pricing and comprehensive validation.

**Endpoint:** `POST /api/v1/auth/book-ticket`

**Authentication:** Required (User JWT token)

**Request Body:**

```json
{
  "scheduleId": "schedule-uuid-1",
  "compartmentId": "compartment-uuid-1",
  "seatNumber": "5",
  "fromStationId": "station-uuid-1",
  "toStationId": "station-uuid-2"
}
```

**Request Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scheduleId | string (UUID) | Yes | Train schedule ID |
| compartmentId | string (UUID) | Yes | Compartment ID |
| seatNumber | string | Yes | Seat number (1 to compartment's total seats) |
| fromStationId | string (UUID) | Yes | Departure station ID |
| toStationId | string (UUID) | Yes | Arrival station ID |

**Success Response:** `201 Created`

```json
{
  "success": true,
  "message": "Ticket booked successfully",
  "data": {
    "id": "booking-uuid-1",
    "scheduleId": "schedule-uuid-1",
    "compartmentId": "compartment-uuid-1",
    "seatNumber": "5",
    "fromStationId": "station-uuid-1",
    "toStationId": "station-uuid-2",
    "price": 750.00,
    "status": "confirmed",
    "bookingDate": "2025-11-26T12:00:00.000Z",
    "createdAt": "2025-11-26T12:00:00.000Z",
    "train": {
      "name": "Suborno Express",
      "number": "701"
    },
    "route": {
      "name": "Dhaka to Chittagong Express Route"
    },
    "compartment": {
      "name": "AC Sleeper",
      "type": "AC_SLEEPER"
    },
    "fromStation": {
      "name": "Dhaka"
    },
    "toStation": {
      "name": "Chittagong"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token

```json
{
  "success": false,
  "error": "Authorization token required"
}
```

- `404 Not Found` - Schedule, compartment, or station not found

```json
{
  "success": false,
  "error": "Train schedule not found"
}
```

```json
{
  "success": false,
  "error": "Compartment not available on this train"
}
```

```json
{
  "success": false,
  "error": "Stations not found on this route"
}
```

```json
{
  "success": false,
  "error": "Invalid seat number. Valid seats are 1 to 50"
}
```

- `409 Conflict` - Seat already booked or invalid booking conditions

```json
{
  "success": false,
  "error": "Seat already booked"
}
```

```json
{
  "success": false,
  "error": "This train schedule has been cancelled"
}
```

```json
{
  "success": false,
  "error": "Cannot book tickets for past or current schedules"
}
```

```json
{
  "success": false,
  "error": "From station must be before to station on the route"
}
```

- `400 Bad Request` - Validation error

**Business Logic:**

1. **Authentication**: User must be logged in with valid JWT token
2. **Schedule Validation**: 
   - Train schedule must exist and be active (not cancelled)
   - Departure date/time must be in the future
3. **Compartment Validation**: Compartment must be available on the selected train
4. **Station Validation**: 
   - Both from and to stations must be on the train's route
   - From station must come before to station on the route
5. **Seat Validation**:
   - Seat number must be numeric (1 to compartment's total seats)
   - Seat must not be already booked for this schedule/compartment
6. **Price Calculation**: Distance-based pricing proportional to travel distance
7. **Booking Creation**: Creates booking record with "confirmed" status

---

## Data Model

### User Object

```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;        // Hashed, not returned in responses
  phone?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Business Rules

1. **Email Uniqueness**:
   - Each user must have a unique email address
   - Email addresses are case-sensitive for uniqueness

2. **Password Requirements**:
   - Minimum 6 characters
   - Stored as bcrypt hash (not retrievable)

3. **JWT Token**:
   - Valid for 7 days
   - Contains user ID, email, and type: 'user'
   - Must be included in Authorization header for protected endpoints

4. **User Data Privacy**:
   - Passwords are never returned in API responses
   - Sensitive user data is protected

## Example Usage

### JavaScript/Node.js
```javascript
const baseURL = 'http://localhost:3000/api/v1';

// Register User
const registerUser = async () => {
  const response = await fetch(`${baseURL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phone: '+8801712345678'
    })
  });
  return await response.json();
};

// Login User
const loginUser = async () => {
  const response = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'john.doe@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();

  if (data.success) {
    // Store token for future requests
    localStorage.setItem('token', data.data.token);
    console.log('User logged in:', data.data.user);
  }

  return data;
};

// Use token for authenticated requests
const bookTicket = async (bookingData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${baseURL}/auth/book-ticket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(bookingData)
  });
  return await response.json();
};
```

### cURL Examples
```bash
# Register User
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "phone": "+8801712345678"
  }'

# Login User
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'

# Book Ticket (requires authentication token)
curl -X POST http://localhost:3000/api/v1/auth/book-ticket \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scheduleId": "SCHEDULE_ID",
    "compartmentId": "COMPARTMENT_ID",
    "seatNumber": "A1",
    "fromStationId": "FROM_STATION_ID",
    "toStationId": "TO_STATION_ID"
  }'
```

## Use Cases

### 1. New User Registration
```javascript
// Complete user registration flow
const completeRegistration = async (userData) => {
  try {
    const registerResult = await registerUser(userData);

    if (registerResult.success) {
      // Automatically login after registration
      const loginResult = await loginUser({
        email: userData.email,
        password: userData.password
      });

      if (loginResult.success) {
        // User is now registered and logged in
        console.log('Welcome!', loginResult.data.user.firstName);
        return loginResult.data;
      }
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### 2. Token Management
```javascript
// Check if token is expired and refresh if needed
const ensureValidToken = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect to login
    return false;
  }

  try {
    // Decode token to check expiration (without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;

    if (payload.exp < now) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      return false;
    }

    return true;
  } catch (error) {
    // Invalid token
    localStorage.removeItem('token');
    return false;
  }
};
```

## Related Documentation
- [Train Search API](trains.md#6-search-trains-for-purchase) - Search trains for ticket booking
- [API Testing Guide](../guides/api-testing-guide.md)

---

**Last Updated**: 2025-11-26</content>
<parameter name="filePath">/home/mojahid/VS-Code/RailNet/backend/docs/api/auth.md
