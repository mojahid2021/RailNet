# User Authentication API Documentation

The User Authentication API provides secure user account management for ticket booking and profile management using JWT (JSON Web Tokens) for authentication.

## Base URL

```http
/api/v1/auth
```

## Endpoints

### 1. Register User

Register a new user account for ticket booking.

**Endpoint:** `POST /api/v1/auth/register`

**Authentication:** Not required

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "phone": "+8801712345678"
}
```

**Request Schema:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| firstName | string | Yes | - | User's first name |
| lastName | string | Yes | - | User's last name |
| email | string | Yes | Valid email format | Unique user email |
| password | string | Yes | Minimum 6 characters | User password |
| phone | string | No | - | User's phone number |

**Success Response:** `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
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

```json
{
  "success": false,
  "error": "Validation error message"
}
```

---

### 2. User Login

Authenticate a user and receive a JWT token for booking operations.

**Endpoint:** `POST /api/v1/auth/login`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Request Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |
| password | string | Yes | User password |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
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

Book a train ticket for a specific schedule, compartment, and seat.

**Endpoint:** `POST /api/v1/auth/book-ticket`

**Authentication:** Required (User JWT Token)

**Headers:**

```http
Authorization: Bearer <user-jwt-token>
```

**Request Body:**

```json
{
  "scheduleId": "schedule-uuid-1",
  "compartmentId": "compartment-uuid-1",
  "seatNumber": "A1",
  "fromStationId": "station-uuid-1",
  "toStationId": "station-uuid-2"
}
```

**Request Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scheduleId | string (UUID) | Yes | Train schedule ID |
| compartmentId | string (UUID) | Yes | Compartment ID on the train |
| seatNumber | string | Yes | Seat number to book |
| fromStationId | string (UUID) | Yes | Starting station ID |
| toStationId | string (UUID) | Yes | Destination station ID |

**Success Response:** `201 Created`

```json
{
  "success": true,
  "message": "Ticket booked successfully",
  "data": {
    "id": "booking-uuid-1",
    "scheduleId": "schedule-uuid-1",
    "compartmentId": "compartment-uuid-1",
    "seatNumber": "A1",
    "fromStationId": "station-uuid-1",
    "toStationId": "station-uuid-2",
    "price": 1200.50,
    "status": "confirmed",
    "bookingDate": "2025-11-26",
    "createdAt": "2025-11-26T10:30:00.000Z",
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
  "error": "Unauthorized"
}
```

- `404 Not Found` - Schedule, compartment, or station not found

```json
{
  "success": false,
  "error": "Train schedule not found"
}
```

- `409 Conflict` - Seat already booked

```json
{
  "success": false,
  "error": "Seat already booked"
}
```

---

## Authentication Flow

1. **Registration**
   - User provides registration details
   - Password is hashed using bcrypt (10 salt rounds)
   - User record is created in database
   - Response contains user data (without password)

2. **Login**
   - User provides credentials
   - System validates email and password
   - JWT token is generated with user ID, email, and type
   - Token and user data are returned

3. **Authenticated Requests**
   - Client includes JWT token in Authorization header
   - Middleware validates token
   - User ID is extracted and attached to request
   - Protected route processes the request

## JWT Token Structure

The JWT token contains the following payload:

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "type": "user",
  "iat": 1700000000,
  "exp": 1700086400
}
```

## Security Best Practices

1. **Password Storage**: Passwords are hashed using bcrypt with a cost factor of 10
2. **Token Expiration**: JWT tokens should have reasonable expiration times
3. **HTTPS Only**: Always use HTTPS in production
4. **Token Storage**: Store tokens securely on the client (httpOnly cookies recommended)
5. **Environment Variables**: Keep JWT_SECRET in environment variables, never commit to code

## Business Logic

### Ticket Booking Process

1. **Schedule Validation**: Verifies the train schedule exists
2. **Compartment Validation**: Ensures the compartment is available on the selected train
3. **Station Validation**: Confirms both from and to stations are on the route
4. **Seat Availability**: Checks if the specific seat is not already booked
5. **Price Calculation**: Uses the compartment's base price
6. **Booking Creation**: Creates booking record with confirmed status

### Booking Constraints

- Users can only book one seat per booking request
- Seats are unique per schedule, compartment, and seat number
- Bookings are immediately confirmed upon successful validation
- No partial bookings or reservations are supported

## Example Usage

### JavaScript/Node.js

```javascript
// Register User
const registerResponse = await fetch('http://localhost:3000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'securePassword123',
    phone: '+8801712345678'
  })
});
const registerData = await registerResponse.json();

// Login
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@example.com',
    password: 'securePassword123'
  })
});
const loginData = await loginResponse.json();
const token = loginData.data.token;

// Book Ticket
const bookingResponse = await fetch('http://localhost:3000/api/v1/auth/book-ticket', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    scheduleId: 'schedule-uuid-1',
    compartmentId: 'compartment-uuid-1',
    seatNumber: 'A1',
    fromStationId: 'station-uuid-1',
    toStationId: 'station-uuid-2'
  })
});
const bookingData = await bookingResponse.json();
```

### cURL

```bash
# Register User
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "phone": "+8801712345678"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'

# Book Ticket (replace TOKEN with actual JWT)
curl -X POST http://localhost:3000/api/v1/auth/book-ticket \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "scheduleId": "schedule-uuid-1",
    "compartmentId": "compartment-uuid-1",
    "seatNumber": "A1",
    "fromStationId": "station-uuid-1",
    "toStationId": "station-uuid-2"
  }'
```

## Related Documentation

- [Train Search API](trains.md#6-search-trains-for-purchase) - Find available trains
- [Seat Status API](trains.md#7-check-compartment-seat-status) - Check seat availability
- [Getting Started Guide](../guides/getting-started.md)
- [Authentication Flow Diagram](../workflows/authentication-flow.md)
- [API Testing Guide](../guides/api-testing-guide.md)

---

**Last Updated**: 2025-11-26
