# RailNet Backend System Architecture

This document provides a comprehensive overview of the RailNet backend architecture, including technology stack, component interactions, and design patterns.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAILNET BACKEND SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Mobile App      │  │  Admin Dashboard │  │  Third-party     │   │
│  │  (Android)       │  │  (Web)           │  │  Integrations    │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  • HTTPS/TLS Security                                           │ │
│  │  • CORS (Cross-Origin Resource Sharing)                         │ │
│  │  • Rate Limiting (DDoS Protection)                              │ │
│  │  • Request/Response Logging                                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER (Fastify)                         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Route Handlers                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │  Admin       │  │  Stations    │  │  Train       │         │ │
│  │  │  Routes      │  │  Routes      │  │  Routes      │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │  ┌──────────────┐  ┌──────────────┐                           │ │
│  │  │  Train       │  │  Compartment │                           │ │
│  │  │  Routes API  │  │  Routes      │                           │ │
│  │  └──────────────┘  └──────────────┘                           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Middleware Layer                             │ │
│  │  • Authentication (JWT Verification)                            │ │
│  │  • Request Validation (Zod Schemas)                             │ │
│  │  • Error Handling                                               │ │
│  │  • Response Formatting                                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Business Logic Layer                         │ │
│  │  • User Authentication & Authorization                          │ │
│  │  • Station Management                                           │ │
│  │  • Train Route Planning                                         │ │
│  │  • Train Configuration                                          │ │
│  │  • Compartment Management                                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     DATA ACCESS LAYER (Prisma ORM)                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  • Type-safe Database Queries                                   │ │
│  │  • Relationship Management                                      │ │
│  │  • Transaction Support                                          │ │
│  │  • Migration Management                                         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   PostgreSQL Database                           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │ │
│  │  │  Admins  │  │ Stations │  │  Routes  │  │  Trains  │       │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │ │
│  │  │Route Stn │  │Compartmts│  │  Train   │                     │ │
│  │  │          │  │          │  │ Compartmt│                     │ │
│  │  └──────────┘  └──────────┘  └──────────┘                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Framework
- **Fastify**: High-performance Node.js web framework
  - Low overhead
  - Built-in JSON schema validation
  - Plugin architecture
  - Excellent TypeScript support

### Language & Type Safety
- **TypeScript**: Static typing for JavaScript
  - Compile-time type checking
  - Enhanced IDE support
  - Better code maintainability
  
- **Zod**: Runtime schema validation
  - Request/response validation
  - Type inference
  - Custom error messages

### Database
- **PostgreSQL**: Relational database
  - ACID compliance
  - Advanced querying capabilities
  - JSON support
  - PostGIS extension support (future)
  
- **Prisma ORM**: Modern database toolkit
  - Type-safe database client
  - Automatic migrations
  - Visual database browser (Prisma Studio)

### Security
- **bcrypt**: Password hashing
  - Industry-standard hashing algorithm
  - Configurable salt rounds
  
- **jsonwebtoken**: JWT authentication
  - Stateless authentication
  - Token-based authorization
  
- **Helmet**: HTTP security headers
  - XSS protection
  - Content Security Policy
  - MIME type sniffing prevention
  
- **CORS**: Cross-Origin Resource Sharing
  - Configurable origin policies
  - Credential support

### API Documentation
- **Swagger/OpenAPI**: API documentation
  - Interactive API explorer
  - Auto-generated from schemas
  - Standard API specification

### Development Tools
- **ts-node-dev**: Development server
  - Fast TypeScript compilation
  - Auto-restart on file changes
  - Memory-efficient

## Directory Structure

```
backend/
├── src/
│   ├── admin/              # Admin-related routes
│   │   ├── routes.ts       # Authentication endpoints
│   │   ├── stations.ts     # Station management
│   │   ├── trains.ts       # Train management
│   │   ├── trainRoutes.ts  # Train route management
│   │   └── compartments.ts # Compartment management
│   ├── config/             # Configuration files
│   │   └── index.ts        # Environment configuration
│   ├── errors/             # Custom error classes
│   │   └── index.ts        # Error definitions
│   ├── middleware/         # Express/Fastify middleware
│   │   └── auth.ts         # JWT authentication middleware
│   ├── schemas/            # Zod validation schemas
│   │   └── admin.ts        # Request/response schemas
│   ├── utils/              # Utility functions
│   │   ├── jwt.ts          # JWT utilities
│   │   └── response.ts     # Response formatters
│   └── app.ts              # Application entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── docs/                   # API documentation
├── package.json
├── tsconfig.json
└── .env                    # Environment variables
```

## Component Interaction

### 1. Request Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Fastify │────▶│Middleware│────▶│  Route   │────▶│ Prisma   │
│          │     │  Server  │     │  Layer   │     │ Handler  │     │   ORM    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                                            │
                                                                            ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │◀────│ Response │◀────│ Response │◀────│ Business │◀────│PostgreSQL│
│          │     │ Handler  │     │Formatter │     │  Logic   │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 2. Authentication Flow

```
┌────────┐                                          ┌──────────────┐
│ Client │                                          │   Database   │
└───┬────┘                                          └──────┬───────┘
    │                                                      │
    │ 1. POST /admin/login                                │
    │    {email, password}                                │
    ├─────────────────────────────────────────────────────┤
    │                                                      │
    │                    2. Find user by email            │
    │                    ────────────────────────────────▶│
    │                                                      │
    │                    3. Return user data              │
    │                    ◀────────────────────────────────│
    │                                                      │
    │ 4. Compare password hash                            │
    │                                                      │
    │ 5. Generate JWT token                               │
    │                                                      │
    │ 6. Return token + user data                         │
    │◀─────────────────────────────────────────────────────
    │                                                      │
    │ 7. Authenticated Request                            │
    │    Header: Bearer <token>                           │
    ├─────────────────────────────────────────────────────┤
    │                                                      │
    │ 8. Verify JWT token                                 │
    │                                                      │
    │ 9. Extract user ID                                  │
    │                                                      │
    │ 10. Process request                                 │
    │                                                      │
    │ 11. Return response                                 │
    │◀─────────────────────────────────────────────────────
```

## Design Patterns

### 1. Layered Architecture
- **Presentation Layer**: Route handlers and controllers
- **Business Logic Layer**: Service functions and validations
- **Data Access Layer**: Prisma ORM
- **Database Layer**: PostgreSQL

### 2. Dependency Injection
- Prisma client decorated on Fastify instance
- Middleware injected via preHandler hooks
- Configuration loaded from environment

### 3. Error Handling
- Custom error classes (AppError, NotFoundError, ConflictError)
- Centralized error handler in app.ts
- Consistent error response format

### 4. Validation Pattern
- Zod schemas for runtime validation
- Type inference from schemas
- Validation at API boundary

## Security Measures

### 1. Authentication & Authorization
- JWT-based stateless authentication
- Password hashing with bcrypt (10 rounds)
- Token expiration
- Role-based access control (admin-only routes)

### 2. Input Validation
- Request validation using Zod schemas
- Type checking
- Sanitization of user inputs

### 3. HTTP Security
- Helmet middleware for security headers
- CORS configuration
- Rate limiting to prevent DDoS
- HTTPS enforcement (production)

### 4. Database Security
- Parameterized queries (via Prisma)
- SQL injection prevention
- Connection pooling
- Environment-based credentials

## Scalability Considerations

### Current Architecture
- Single server deployment
- Direct database connection
- Synchronous request processing

### Future Enhancements
1. **Horizontal Scaling**
   - Load balancer (NGINX)
   - Multiple server instances
   - Session management via Redis

2. **Database Optimization**
   - Read replicas for queries
   - Connection pooling
   - Query optimization
   - Caching layer (Redis)

3. **Microservices**
   - Split into domain services
   - Message queue for async operations
   - Service discovery
   - API gateway

4. **Performance**
   - Response caching
   - Database indexing
   - CDN for static assets
   - Compression

## Monitoring & Observability

### Current Implementation
- Pino logger for structured logging
- Console output for development
- Error tracking in logs

### Future Improvements
1. **Logging**
   - Centralized log aggregation (ELK stack)
   - Log levels (debug, info, warn, error)
   - Request/response logging

2. **Metrics**
   - Response time tracking
   - Error rate monitoring
   - API usage statistics
   - Database query performance

3. **Health Checks**
   - `/health` endpoint
   - Database connectivity check
   - Service dependency checks

## Configuration Management

### Environment Variables
```bash
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
API_PREFIX=/api/v1
DATABASE_URL=postgresql://user:password@localhost:5432/railnet
JWT_SECRET=your-secret-key
BASE_URL=http://localhost:3000
```

### Configuration Loading
- Environment-based configuration
- Dotenv for local development
- Validation of required variables
- Type-safe configuration object

## Database Design Principles

### Normalization
- Third Normal Form (3NF)
- Minimal data redundancy
- Referential integrity

### Relationships
- One-to-Many: Admin → (future bookings)
- One-to-Many: Station → RouteStations
- Many-to-Many: Train ↔ Compartment (via junction table)
- One-to-Many: TrainRoute → Trains

### Indexing Strategy
- Primary keys (UUID)
- Unique constraints (email, train number)
- Foreign key indexes
- Composite indexes for frequent queries

## API Design Principles

### RESTful Design
- Resource-based URLs
- HTTP method semantics
- Standard status codes
- HATEOAS ready

### Consistency
- Uniform response format
- Consistent error handling
- Standard naming conventions
- Predictable behavior

### Versioning
- URL-based versioning (`/api/v1`)
- Backward compatibility
- Deprecation strategy

## Related Documentation
- [API Flow Diagrams](api-flows.md)
- [Database Schema](database-schema.md)
- [Authentication Flow](authentication-flow.md)
- [Getting Started Guide](../guides/getting-started.md)

---

**Last Updated**: 2025-11-24
