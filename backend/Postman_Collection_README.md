# RailNet Backend - Postman Collection

This directory contains Postman collection and environment files for testing the RailNet Backend API.

## Files

- `RailNet_Backend_Postman_Collection.json` - Complete API collection with all endpoints
- `RailNet_Backend_Postman_Environment.json` - Environment variables for local development

## Setup Instructions

### 1. Import the Collection and Environment

1. Open Postman
2. Click "Import" in the top left
3. Import both JSON files:
   - `RailNet_Backend_Postman_Collection.json`
   - `RailNet_Backend_Postman_Environment.json`

### 2. Select Environment

1. In Postman, select "RailNet Backend Development" from the environment dropdown (top right)
2. Verify the environment variables are set correctly

### 3. Start the Backend Server

Make sure the RailNet backend is running:

```bash
cd /path/to/railnet/backend
npm install
npm run dev
```

The server should be running on `http://localhost:3001`

## API Endpoints Overview

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `GET /health/ready` - Readiness check

### Authentication
- `POST /api/v1/auth/register` - Register passenger
- `POST /api/v1/auth/login` - Passenger login
- `POST /api/v1/auth/admin/register` - Register admin
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/admin/register-staff` - Admin registers staff
- `POST /api/v1/auth/staff/login` - Staff login
- `GET /api/v1/auth/profile` - Get user profile (requires auth)

## Authentication Flow

### Role-Based Access Control

The API implements three user roles:

1. **PASSENGER** - Regular users who can register and login
2. **ADMIN** - Administrators who can register staff and manage the system
3. **STAFF** - Staff members registered by admins

### Testing Authentication

#### Option 1: Individual Endpoint Testing

1. Use individual endpoints in the "Authentication" folder
2. Tokens are automatically saved to environment variables after successful login/registration

#### Option 2: Complete Flow Testing

Use the "Test Authentication Flow" folder which provides a step-by-step workflow:

1. **Register Passenger** - Creates a passenger account
2. **Login as Passenger** - Authenticates the passenger
3. **Access Profile** - Tests authenticated endpoint
4. **Register Admin** - Creates an admin account
5. **Register Staff (Admin)** - Admin creates a staff account
6. **Login as Staff** - Authenticates the staff member

## Environment Variables

The collection uses these environment variables:

- `base_url` - API base URL (default: http://localhost:3001)
- `api_version` - API version (default: v1)
- `auth_token` - Current authentication token
- `passenger_token` - Passenger JWT token
- `admin_token` - Admin JWT token
- `staff_token` - Staff JWT token

## Request/Response Examples

### Successful Registration Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "cmi3kqj660000ubmapbyt279m",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PASSENGER"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2025-11-17T20:05:21.473Z"
}
```

### Successful Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cmi3kqj660000ubmapbyt279m",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PASSENGER"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2025-11-17T20:05:28.789Z"
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-11-17T20:00:09.010Z",
  "uptime": 4.95684972,
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "database": "connected"
  }
}
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [...]
  },
  "timestamp": "2025-11-17T20:05:21.473Z"
}
```

### Authentication Error
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid email or password"
  },
  "timestamp": "2025-11-17T20:05:28.789Z"
}
```

## Password Requirements

All passwords must:
- Be at least 8 characters long
- Contain at least one uppercase letter
- Contain at least one lowercase letter
- Contain at least one number
- Contain at least one special character

Example: `MyPass123!`

## Troubleshooting

### Server Not Running
- Make sure the backend server is started with `npm run dev`
- Check that port 3001 is not in use by another service
- Verify the database is running (if using Docker: `docker-compose up -d`)

### Authentication Issues
- Ensure you're using the correct JWT token in the Authorization header
- Check that the token hasn't expired (24 hours by default)
- Verify the user account exists and is active

### Database Connection Issues
- Run `npx prisma migrate dev --name init` to set up the database
- Check that PostgreSQL is running if using local database
- Verify DATABASE_URL in .env file is correct

## Support

For issues with the API or this Postman collection, check:
1. Backend server logs in the terminal
2. Postman console for request/response details
3. API documentation in the backend codebase