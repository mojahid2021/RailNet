# API Documentation Index

Welcome to the RailNet API documentation. This comprehensive guide covers all available endpoints for the railway ticket booking system.

## 📋 API Overview

The RailNet API provides a complete railway management and ticket booking system with separate authentication for administrators and regular users.

### Base URL

```http
http://localhost:3000/api/v1
```

### Authentication Types

1. **Admin Authentication** - For system administrators managing trains, stations, routes, etc.
2. **User Authentication** - For regular users booking tickets and checking availability

## 📚 API Endpoints by Category

### 🔐 Authentication APIs

#### User Authentication (`/auth`)

- [User Registration & Login](auth.md) - User account management and ticket booking
- [Admin Authentication](admin-auth.md) - Admin account management

### 🚆 Train Management (`/trains`)

- [Train CRUD Operations](trains.md) - Complete train management (Admin only)
- [Train Search](trains.md#6-search-trains-for-purchase) - Find available trains (Public)
- [Seat Availability](trains.md#7-check-compartment-seat-status) - Check seat status (Public)

### 🏢 Station Management (`/stations`)

- [Station CRUD](stations.md) - Manage railway stations (Admin only)

### 🛤️ Route Management (`/train-routes`)

- [Route CRUD](train-routes.md) - Manage train routes and station sequences (Admin only)

### 🚂 Compartment Management (`/compartments`)

- [Compartment CRUD](compartments.md) - Manage train compartments and pricing (Admin only)

### 📅 Schedule Management (`/schedules`)

- [Schedule CRUD](schedules-api.md) - Manage train schedules and timings (Admin only)

## 🔄 User Journey Flow

1. **User Registration** → `POST /auth/register`
2. **User Login** → `POST /auth/login`
3. **Search Trains** → `GET /trains/search?from_station_id={id}&to_station_id={id}&date={YYYY-MM-DD}`
4. **Check Seat Availability** → `GET /trains/seat-status/{scheduleId}/{compartmentId}?date={YYYY-MM-DD}`
5. **Book Ticket** → `POST /auth/book-ticket`

## 🔧 Admin Setup Flow

1. **Admin Registration** → `POST /admin/register`
2. **Admin Login** → `POST /admin/login`
3. **Create Stations** → `POST /stations`
4. **Create Compartments** → `POST /compartments`
5. **Create Routes** → `POST /train-routes`
6. **Create Trains** → `POST /trains`
7. **Create Schedules** → `POST /schedules`

## 📖 Getting Started

### For Users

1. Register a user account
2. Login to get JWT token
3. Search for available trains
4. Check seat availability
5. Book tickets

### For Administrators

1. Register an admin account
2. Login to get admin JWT token
3. Set up stations, compartments, routes
4. Create and schedule trains
5. Monitor bookings and availability

## 🛠️ Development Tools

- **Swagger UI**: `http://localhost:3000/docs` - Interactive API documentation
- **Prisma Studio**: `npm run db:studio` - Database management
- **API Testing**: Use the provided cURL examples or Swagger UI

## 📋 Response Format

All API responses follow a consistent format:

**Success Response:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message"
}
```

## 🔗 Quick Links

- [Main Documentation](../README.md)
- [Getting Started Guide](../guides/getting-started.md)
- [API Testing Guide](../guides/api-testing-guide.md)
- [Database Schema](../workflows/database-schema.md)

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
