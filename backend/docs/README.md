# RailNet Backend Documentation

Welcome to the RailNet Backend API documentation. This comprehensive guide provides everything you need to understand, set up, and work with the RailNet backend system.

## 📚 Documentation Overview

This documentation is organized into three main sections:

### 🔌 API Documentation (`/api`)
Detailed documentation for all API endpoints, including request/response schemas, authentication requirements, and examples.

- [Authentication API](api/authentication.md) - User registration, login, ticket booking, and profile management
- [Station Management API](api/stations.md) - CRUD operations for railway stations
- [Train Routes API](api/train-routes.md) - Manage train routes and route stations
- [Compartment API](api/compartments.md) - Manage train compartments and seat types
- [Train Management API](api/trains.md) - Complete train management with routes, compartments, and seat availability

### 🔄 Workflows (`/workflows`)
Visual diagrams and explanations of system workflows and architecture.

- [System Architecture](workflows/system-architecture.md) - Overall system design and component interaction
- [API Flow Diagrams](workflows/api-flows.md) - Request/response flows for major operations
- [Database Schema](workflows/database-schema.md) - Complete database structure and relationships
- [Authentication Flow](workflows/authentication-flow.md) - JWT-based authentication process

### 📖 Developer Guides (`/guides`)
Step-by-step guides for developers working with the backend.

- [Getting Started](guides/getting-started.md) - Setup and installation instructions
- [Environment Configuration](guides/environment-configuration.md) - Environment variables and configuration
- [Database Guide](guides/database-guide.md) - Database migrations and management
- [API Testing Guide](guides/api-testing-guide.md) - Testing APIs with examples
- [Development Best Practices](guides/best-practices.md) - Coding standards and conventions

## 🚀 Quick Start

1. **Installation**
   ```bash
   npm install
   ```

2. **Setup Environment**
   ```bash
   # Copy .env file and configure DATABASE_URL and JWT_SECRET
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access API Documentation**
   Navigate to `http://localhost:3000/docs` for interactive Swagger UI

## 🛠️ Technology Stack

- **Framework**: Fastify (high-performance Node.js web framework)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Key Features

- ✅ JWT-based admin and user authentication
- ✅ User registration and login system
- ✅ Station management with geographic coordinates
- ✅ Train route management with multiple stations
- ✅ Compartment and seat type management
- ✅ Complete train CRUD operations
- ✅ Train search and availability checking
- ✅ Ticket booking with seat selection
- ✅ Real-time seat availability status
- ✅ Swagger UI for API documentation
- ✅ Type-safe with TypeScript and Zod validation
- ✅ Production-ready security measures

## 🔐 Authentication

The API supports two types of authentication:

### Admin Authentication

For administrative operations (station management, train management, etc.), use admin JWT tokens obtained via admin login.

### User Authentication

For user operations (ticket booking, profile management), use user JWT tokens obtained via user registration/login.

Include the appropriate token in the request header:

```http
Authorization: Bearer <your-jwt-token>
```

## 📊 API Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Documentation**: `http://localhost:3000/docs`

## 🤝 Developer-Friendly Features

- **Comprehensive Error Handling**: Clear error messages with appropriate HTTP status codes
- **Type Safety**: Full TypeScript support with Zod schema validation
- **API Documentation**: Auto-generated Swagger docs accessible via browser
- **Modular Architecture**: Clean separation of concerns (routes, schemas, middleware, utils)
- **Prisma Studio**: Visual database management tool (`npm run db:studio`)
- **Consistent Response Format**: Standardized success/error response structure

## 📝 Response Format

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

## 🔗 Related Documentation

- [Main Project README](../../README.md)
- [System Workflow](../../WORKFLOW.md)
- [Dashboard Documentation](../../dashboard/README.md)
- [API Documentation Index](api/README.md)
- [User Authentication API](api/user-auth.md)
- [Admin Authentication API](api/authentication.md)
- [Train Management API](api/trains.md)
- [Station Management API](api/stations.md)
- [Train Routes API](api/train-routes.md)
- [Compartment Management API](api/compartments.md)
- [Schedule Management API](api/schedules-api.md)

## 📞 Support

For questions, issues, or contributions:

- GitHub: [RailNet Repository](https://github.com/mojahid2021/RailNet)
- Email: aammojahid@gmail.com

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
**Maintained by**: Team error2k21
