# Authentication API Documentation

The Authentication API provides secure admin user management using JWT (JSON Web Tokens) for authentication.

## Base URL
```
/api/v1/admin
```

## Endpoints

### 1. Register Admin

Register a new admin user in the system.

**Endpoint:** `POST /api/v1/admin/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Request Schema:**
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| firstName | string | Yes | - | Admin's first name |
| lastName | string | Yes | - | Admin's last name |
| email | string | Yes | Valid email format | Unique admin email |
| password | string | Yes | Minimum 6 characters | Admin password |

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "createdAt": "2025-11-24T19:49:27.848Z"
  }
}
```

**Error Responses:**

- `409 Conflict` - Email already exists
```json
{
  "success": false,
  "error": "Admin with this email already exists"
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

### 2. Admin Login

Authenticate an admin user and receive a JWT token.

**Endpoint:** `POST /api/v1/admin/login`

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
| email | string | Yes | Admin email address |
| password | string | Yes | Admin password |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid credentials
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### 3. Get Admin Profile

Retrieve the authenticated admin's profile information.

**Endpoint:** `GET /api/v1/admin/profile`

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "createdAt": "2025-11-24T19:49:27.848Z",
    "updatedAt": "2025-11-24T20:00:00.000Z"
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

- `404 Not Found` - Admin not found
```json
{
  "success": false,
  "error": "Admin not found"
}
```

---

## Authentication Flow

1. **Registration**
   - Admin provides registration details
   - Password is hashed using bcrypt (10 salt rounds)
   - Admin record is created in database
   - Response contains admin data (without password)

2. **Login**
   - Admin provides credentials
   - System validates email and password
   - JWT token is generated with admin ID, email, and type
   - Token and admin data are returned

3. **Authenticated Requests**
   - Client includes JWT token in Authorization header
   - Middleware validates token
   - Admin ID is extracted and attached to request
   - Protected route processes the request

## JWT Token Structure

The JWT token contains the following payload:
```json
{
  "id": "admin-uuid",
  "email": "admin@example.com",
  "type": "admin",
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

## Example Usage

### JavaScript/Node.js
```javascript
// Register Admin
const registerResponse = await fetch('http://localhost:3000/api/v1/admin/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'securePassword123'
  })
});
const registerData = await registerResponse.json();

// Login
const loginResponse = await fetch('http://localhost:3000/api/v1/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@example.com',
    password: 'securePassword123'
  })
});
const loginData = await loginResponse.json();
const token = loginData.data.token;

// Get Profile
const profileResponse = await fetch('http://localhost:3000/api/v1/admin/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const profileData = await profileResponse.json();
```

### cURL
```bash
# Register Admin
curl -X POST http://localhost:3000/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'

# Get Profile (replace TOKEN with actual JWT)
curl -X GET http://localhost:3000/api/v1/admin/profile \
  -H "Authorization: Bearer TOKEN"
```

## Related Documentation
- [Getting Started Guide](../guides/getting-started.md)
- [Authentication Flow Diagram](../workflows/authentication-flow.md)
- [API Testing Guide](../guides/api-testing-guide.md)

---

**Last Updated**: 2025-11-24
