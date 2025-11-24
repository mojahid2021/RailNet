# Authentication Flow Documentation

This document details the authentication and authorization flows implemented in the RailNet backend system using JWT (JSON Web Tokens).

## Overview

RailNet uses a stateless, token-based authentication system with JWT for admin users. This approach provides:
- **Stateless Authentication**: No session storage required on server
- **Scalability**: Easy to scale horizontally
- **Security**: Encrypted tokens with expiration
- **Flexibility**: Works across different client types

## Authentication Components

### 1. Password Hashing (bcrypt)
```typescript
// Hashing during registration
const hashedPassword = await bcrypt.hash(password, 10);

// Verification during login
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. JWT Token Generation
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    id: admin.id,
    email: admin.email,
    type: 'admin'
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' } // Token expires in 7 days
);
```

### 3. JWT Token Verification
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded contains: { id, email, type, iat, exp }
```

## Registration Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /api/v1/admin/register
       │    { firstName, lastName, email, password }
       ▼
┌──────────────────────────────────────────────────────┐
│              RailNet Backend                          │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  1. Request Validation (Zod)                │    │
│  │     - Check required fields                 │    │
│  │     - Validate email format                 │    │
│  │     - Validate password length (min 6)      │    │
│  └─────────────────────────────────────────────┘    │
│                      │                               │
│                      ▼                               │
│  ┌─────────────────────────────────────────────┐    │
│  │  2. Check Email Uniqueness                  │    │
│  │     SELECT * FROM Admin WHERE email = ?     │    │
│  └─────────────────────────────────────────────┘    │
│                      │                               │
│                      ▼                               │
│              ┌───────────────┐                       │
│              │ Email exists? │                       │
│              └───────┬───────┘                       │
│                      │                               │
│         Yes ─────────┼────────── No                 │
│         │                        │                   │
│         ▼                        ▼                   │
│  ┌─────────────┐      ┌──────────────────────┐     │
│  │ Return 409  │      │ 3. Hash Password     │     │
│  │ Conflict    │      │    bcrypt.hash(pwd,10)│     │
│  └─────────────┘      └──────────┬───────────┘     │
│                                   │                  │
│                                   ▼                  │
│                       ┌──────────────────────┐      │
│                       │ 4. Create Admin      │      │
│                       │    INSERT INTO Admin │      │
│                       └──────────┬───────────┘      │
│                                  │                   │
│                                  ▼                   │
│                       ┌──────────────────────┐      │
│                       │ 5. Return Admin Data │      │
│                       │    (without password)│      │
│                       └──────────────────────┘      │
└───────────────────────────────────────────────────────┘
       │
       │ Response: 201 Created
       │ { success: true, data: { id, firstName, lastName, email, createdAt } }
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

## Login Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /api/v1/admin/login
       │    { email, password }
       ▼
┌──────────────────────────────────────────────────────┐
│              RailNet Backend                          │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  1. Request Validation (Zod)                │    │
│  │     - Check required fields                 │    │
│  │     - Validate email format                 │    │
│  └─────────────────────────────────────────────┘    │
│                      │                               │
│                      ▼                               │
│  ┌─────────────────────────────────────────────┐    │
│  │  2. Find Admin by Email                     │    │
│  │     SELECT * FROM Admin WHERE email = ?     │    │
│  └─────────────────────────────────────────────┘    │
│                      │                               │
│                      ▼                               │
│              ┌───────────────┐                       │
│              │ Admin found?  │                       │
│              └───────┬───────┘                       │
│                      │                               │
│         No ──────────┼────────── Yes                │
│         │                        │                   │
│         ▼                        ▼                   │
│  ┌─────────────┐      ┌──────────────────────┐     │
│  │ Return 401  │      │ 3. Verify Password   │     │
│  │ Unauthorized│      │ bcrypt.compare(pwd)  │     │
│  └─────────────┘      └──────────┬───────────┘     │
│                                   │                  │
│                                   ▼                  │
│                       ┌──────────────────────┐      │
│                       │ Password valid?      │      │
│                       └──────────┬───────────┘      │
│                                  │                   │
│                    No ───────────┼────────── Yes    │
│                    │                         │       │
│                    ▼                         ▼       │
│           ┌─────────────┐      ┌──────────────────┐│
│           │ Return 401  │      │ 4. Generate JWT  ││
│           │ Unauthorized│      │    Token         ││
│           └─────────────┘      └──────┬───────────┘│
│                                        │            │
│                                        ▼            │
│                           ┌────────────────────┐   │
│                           │ 5. Return Token &  │   │
│                           │    Admin Data      │   │
│                           └────────────────────┘   │
└───────────────────────────────────────────────────────┘
       │
       │ Response: 200 OK
       │ { success: true, data: { token: "jwt...", admin: {...} } }
       ▼
┌─────────────┐
│   Client    │
│ Stores Token│
└─────────────┘
```

## Authenticated Request Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Request with Authorization Header
       │    GET /api/v1/admin/profile
       │    Authorization: Bearer <jwt-token>
       ▼
┌──────────────────────────────────────────────────────┐
│              RailNet Backend                          │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  1. Authentication Middleware               │    │
│  │     - Extract token from header             │    │
│  │     - Verify token signature                │    │
│  │     - Check token expiration                │    │
│  └─────────────────────────────────────────────┘    │
│                      │                               │
│                      ▼                               │
│              ┌───────────────┐                       │
│              │ Token valid?  │                       │
│              └───────┬───────┘                       │
│                      │                               │
│         No ──────────┼────────── Yes                │
│         │                        │                   │
│         ▼                        ▼                   │
│  ┌─────────────┐      ┌──────────────────────┐     │
│  │ Return 401  │      │ 2. Extract User Info │     │
│  │ Unauthorized│      │    from Token        │     │
│  └─────────────┘      └──────────┬───────────┘     │
│                                   │                  │
│                                   ▼                  │
│                       ┌──────────────────────┐      │
│                       │ 3. Attach User to    │      │
│                       │    Request Object    │      │
│                       │    request.admin = {...}│   │
│                       └──────────┬───────────┘      │
│                                  │                   │
│                                  ▼                   │
│                       ┌──────────────────────┐      │
│                       │ 4. Execute Route     │      │
│                       │    Handler           │      │
│                       └──────────┬───────────┘      │
│                                  │                   │
│                                  ▼                   │
│                       ┌──────────────────────┐      │
│                       │ 5. Return Protected  │      │
│                       │    Resource          │      │
│                       └──────────────────────┘      │
└───────────────────────────────────────────────────────┘
       │
       │ Response: 200 OK
       │ { success: true, data: {...} }
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

## JWT Token Structure

### Token Payload
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@example.com",
  "type": "admin",
  "iat": 1700000000,
  "exp": 1700604800
}
```

### Token Components
1. **Header**: Algorithm and token type
   ```json
   {
     "alg": "HS256",
     "typ": "JWT"
   }
   ```

2. **Payload**: User information and claims
3. **Signature**: Cryptographic signature to verify authenticity

### Complete Token Format
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDYwNDgwMH0.
signature_here
```

## Security Implementation

### 1. Password Security
```typescript
// Registration
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Salt rounds = 10 means 2^10 = 1024 hashing iterations
// This provides strong protection against brute force attacks
```

### 2. Token Security
```typescript
// Secret key stored in environment variable
const JWT_SECRET = process.env.JWT_SECRET;

// Token expiration
const tokenOptions = {
  expiresIn: '7d' // Token valid for 7 days
};

// Generate token
const token = jwt.sign(payload, JWT_SECRET, tokenOptions);
```

### 3. Middleware Protection
```typescript
// Protect routes with authentication middleware
app.get('/protected-route', {
  preHandler: authenticateAdmin, // Middleware function
}, async (request, reply) => {
  // Access admin data from request.admin
  const adminId = request.admin.id;
  // ... route logic
});
```

## Authentication Middleware Implementation

```typescript
// middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTUtils } from '../utils/jwt';

export async function authenticateAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized: No token provided'
      });
    }

    // 2. Parse Bearer token
    const token = authHeader.replace('Bearer ', '');
    
    // 3. Verify token
    const decoded = JWTUtils.verifyToken(token);
    
    // 4. Attach admin info to request
    request.admin = decoded;
    
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: 'Unauthorized: Invalid token'
    });
  }
}
```

## Error Scenarios

### 1. Registration Errors

| Scenario | Status Code | Error Message |
|----------|-------------|---------------|
| Email already exists | 409 Conflict | "Admin with this email already exists" |
| Invalid email format | 400 Bad Request | "Invalid email format" |
| Password too short | 400 Bad Request | "Password must be at least 6 characters" |
| Missing required field | 400 Bad Request | "Field [name] is required" |

### 2. Login Errors

| Scenario | Status Code | Error Message |
|----------|-------------|---------------|
| Email not found | 401 Unauthorized | "Invalid credentials" |
| Incorrect password | 401 Unauthorized | "Invalid credentials" |
| Invalid email format | 400 Bad Request | "Invalid email format" |

### 3. Authentication Errors

| Scenario | Status Code | Error Message |
|----------|-------------|---------------|
| No token provided | 401 Unauthorized | "Unauthorized: No token provided" |
| Invalid token | 401 Unauthorized | "Unauthorized: Invalid token" |
| Expired token | 401 Unauthorized | "Unauthorized: Token expired" |
| Malformed token | 401 Unauthorized | "Unauthorized: Invalid token format" |

## Best Practices

### 1. Client-Side Token Storage
- **Recommended**: Use httpOnly cookies for web applications
- **Alternative**: Secure localStorage with additional XSS protections
- **Never**: Store tokens in regular cookies accessible by JavaScript

### 2. Token Refresh Strategy
```javascript
// Example token refresh flow (to be implemented)
if (tokenExpiresSoon(token)) {
  const newToken = await refreshToken(token);
  updateStoredToken(newToken);
}
```

### 3. Logout Implementation
```javascript
// Client-side logout
const logout = () => {
  // Remove token from storage
  localStorage.removeItem('token');
  // Redirect to login page
  window.location.href = '/login';
};
```

### 4. Security Headers
```typescript
// Implemented via Helmet middleware
app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
});
```

## Testing Authentication

### Example Test Cases

```javascript
// 1. Test Registration
describe('POST /admin/register', () => {
  it('should register a new admin', async () => {
    const response = await fetch('/api/v1/admin/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'test@example.com',
        password: 'password123'
      })
    });
    expect(response.status).toBe(201);
  });

  it('should reject duplicate email', async () => {
    // ... register once
    const response = await fetch('/api/v1/admin/register', {
      method: 'POST',
      body: JSON.stringify({ /* same email */ })
    });
    expect(response.status).toBe(409);
  });
});

// 2. Test Login
describe('POST /admin/login', () => {
  it('should return token on valid credentials', async () => {
    const response = await fetch('/api/v1/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    const data = await response.json();
    expect(data.data.token).toBeDefined();
  });
});

// 3. Test Protected Routes
describe('GET /admin/profile', () => {
  it('should reject requests without token', async () => {
    const response = await fetch('/api/v1/admin/profile');
    expect(response.status).toBe(401);
  });

  it('should accept requests with valid token', async () => {
    const response = await fetch('/api/v1/admin/profile', {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    expect(response.status).toBe(200);
  });
});
```

## Future Enhancements

### 1. Token Refresh Mechanism
- Implement refresh tokens for long-lived sessions
- Short-lived access tokens (15 min) + long-lived refresh tokens (30 days)

### 2. Role-Based Access Control (RBAC)
- Add role field to admin model (SUPER_ADMIN, ADMIN, OPERATOR)
- Implement role-based middleware

### 3. Two-Factor Authentication (2FA)
- Add 2FA support using TOTP (Time-based One-Time Password)
- SMS or email verification codes

### 4. Session Management
- Track active sessions
- Force logout from all devices
- Device management

### 5. Audit Logging
- Log all authentication attempts
- Track token usage
- Monitor suspicious activities

## Related Documentation
- [Authentication API](../api/authentication.md)
- [System Architecture](system-architecture.md)
- [Getting Started Guide](../guides/getting-started.md)
- [API Testing Guide](../guides/api-testing-guide.md)

---

**Last Updated**: 2025-11-24
