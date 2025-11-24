# Development Best Practices

This guide outlines the coding standards, conventions, and best practices for developing and maintaining the RailNet backend.

## Table of Contents
1. [Code Style and Formatting](#code-style-and-formatting)
2. [TypeScript Best Practices](#typescript-best-practices)
3. [Error Handling](#error-handling)
4. [Security Practices](#security-practices)
5. [Database Operations](#database-operations)
6. [API Design](#api-design)
7. [Testing](#testing)
8. [Documentation](#documentation)
9. [Git Workflow](#git-workflow)

## Code Style and Formatting

### TypeScript Configuration
The project uses strict TypeScript settings defined in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Naming Conventions

#### Variables and Functions
```typescript
// Use camelCase for variables and functions
const userName = 'John Doe';
const calculateTotal = (items: Item[]) => { };

// Use descriptive names
// Good
const userEmailAddress = 'user@example.com';
// Bad
const ue = 'user@example.com';
```

#### Classes and Interfaces
```typescript
// Use PascalCase for classes and interfaces
class UserService { }
interface AdminProfile { }
```

#### Constants
```typescript
// Use UPPER_SNAKE_CASE for constants
const MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 20;
```

#### Files
```typescript
// Use kebab-case for file names
// routes/admin-routes.ts
// utils/response-handler.ts
// middleware/auth-middleware.ts
```

## TypeScript Best Practices

### Type Safety

#### Always Define Types
```typescript
// Good - Explicit types
function createStation(data: CreateStationInput): Promise<Station> {
  return prisma.station.create({ data });
}

// Bad - Using 'any'
function createStation(data: any): Promise<any> {
  return prisma.station.create({ data });
}
```

#### Use Type Inference When Obvious
```typescript
// Good - Type is inferred
const stationName = 'Dhaka Station'; // string

// Unnecessary - Type is obvious
const stationName: string = 'Dhaka Station';
```

#### Avoid Type Assertions
```typescript
// Good - Proper type checking
if (typeof value === 'string') {
  // value is now typed as string
  console.log(value.toUpperCase());
}

// Bad - Type assertion (use sparingly)
const value = data as string;
```

### Null and Undefined Handling

```typescript
// Good - Null checking
const station = await prisma.station.findUnique({ where: { id } });
if (!station) {
  throw new NotFoundError('Station not found');
}
// station is now definitely defined

// Good - Optional chaining
const stationName = station?.name;

// Good - Nullish coalescing
const displayName = station?.name ?? 'Unknown Station';
```

### Async/Await Over Promises

```typescript
// Good - Async/await
async function getStation(id: string): Promise<Station> {
  const station = await prisma.station.findUnique({ where: { id } });
  if (!station) {
    throw new NotFoundError('Station not found');
  }
  return station;
}

// Less preferred - Promise chains
function getStation(id: string): Promise<Station> {
  return prisma.station.findUnique({ where: { id } })
    .then(station => {
      if (!station) throw new NotFoundError('Station not found');
      return station;
    });
}
```

## Error Handling

### Use Custom Error Classes

```typescript
// errors/index.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}
```

### Consistent Error Handling in Routes

```typescript
// Good - Proper error handling
app.post('/stations', async (request, reply) => {
  try {
    const stationData = createStationSchema.parse(request.body);
    const station = await prisma.station.create({ data: stationData });
    return ResponseHandler.created(reply, station, 'Station created');
  } catch (error) {
    if (error instanceof ZodError) {
      return ResponseHandler.error(reply, 'Validation error', 400);
    }
    return ResponseHandler.error(reply, 'Internal server error', 500);
  }
});
```

### Don't Swallow Errors

```typescript
// Bad - Silent error
try {
  await doSomething();
} catch (error) {
  // Error is ignored!
}

// Good - Log and handle
try {
  await doSomething();
} catch (error) {
  app.log.error('Failed to do something:', error);
  throw error; // Re-throw or handle appropriately
}
```

## Security Practices

### Input Validation

```typescript
// Always validate user input with Zod
import { z } from 'zod';

const createStationSchema = z.object({
  name: z.string().min(1).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Validate before using
const stationData = createStationSchema.parse(request.body);
```

### Password Security

```typescript
// Good - Proper bcrypt usage
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Hashing
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

### JWT Security

```typescript
// Good practices
const JWT_SECRET = process.env.JWT_SECRET; // From environment
const JWT_EXPIRATION = '1d'; // Reasonable expiration

// Verify tokens
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  // Use decoded data
} catch (error) {
  throw new UnauthorizedError('Invalid token');
}
```

### SQL Injection Prevention

```typescript
// Good - Prisma handles parameterization
const station = await prisma.station.findUnique({
  where: { id } // Automatically parameterized
});

// Never use raw queries with user input
// Bad
const result = await prisma.$queryRaw`SELECT * FROM stations WHERE id = ${userInput}`;
```

### Environment Variables

```typescript
// Good - Validate required variables at startup
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`${varName} must be defined`);
  }
});

// Never commit .env files
// Add to .gitignore
```

## Database Operations

### Use Prisma Client Correctly

```typescript
// Good - Single client instance
const prisma = new PrismaClient();

// Decorate on Fastify instance
app.decorate('prisma', prisma);

// Close on shutdown
app.addHook('onClose', async () => {
  await prisma.$disconnect();
});
```

### Transaction Handling

```typescript
// Good - Use transactions for multiple operations
await prisma.$transaction(async (tx) => {
  const route = await tx.trainRoute.create({ data: routeData });
  await tx.trainRouteStation.createMany({ data: stationsData });
  return route;
});
```

### Optimize Queries

```typescript
// Good - Select only needed fields
const stations = await prisma.station.findMany({
  select: {
    id: true,
    name: true,
    city: true,
    // Don't fetch all fields if not needed
  }
});

// Good - Use includes for relations
const train = await prisma.train.findUnique({
  where: { id },
  include: {
    trainRoute: true,
    compartments: {
      include: { compartment: true }
    }
  }
});
```

### Pagination

```typescript
// Good - Implement pagination for lists
const page = parseInt(request.query.page as string) || 1;
const limit = parseInt(request.query.limit as string) || 20;
const skip = (page - 1) * limit;

const [stations, total] = await Promise.all([
  prisma.station.findMany({ skip, take: limit }),
  prisma.station.count()
]);

return {
  data: stations,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

## API Design

### RESTful Principles

```typescript
// Good - RESTful routes
POST   /api/v1/stations          // Create
GET    /api/v1/stations          // List
GET    /api/v1/stations/:id      // Get one
PUT    /api/v1/stations/:id      // Update
DELETE /api/v1/stations/:id      // Delete
```

### Consistent Response Format

```typescript
// Success response
{
  success: true,
  message: "Operation successful",
  data: { /* response data */ }
}

// Error response
{
  success: false,
  error: "Error message"
}

// Use ResponseHandler utility
return ResponseHandler.success(reply, data, 'Success message');
return ResponseHandler.error(reply, 'Error message', statusCode);
```

### HTTP Status Codes

```typescript
// Use appropriate status codes
200 // OK - Successful GET, PUT, DELETE
201 // Created - Successful POST
204 // No Content - Successful DELETE with no response body
400 // Bad Request - Invalid input
401 // Unauthorized - Authentication required
403 // Forbidden - Authenticated but not authorized
404 // Not Found - Resource doesn't exist
409 // Conflict - Resource conflict (e.g., duplicate email)
500 // Internal Server Error - Unexpected error
```

### API Versioning

```typescript
// Use URL versioning
const API_PREFIX = '/api/v1';

// Register routes with prefix
app.register(routes, { prefix: API_PREFIX });
```

## Testing

### Write Tests for Critical Paths

```typescript
// Example test structure
describe('Station API', () => {
  describe('POST /stations', () => {
    it('should create a new station', async () => {
      // Arrange
      const stationData = {
        name: 'Test Station',
        city: 'Dhaka',
        // ...
      };

      // Act
      const response = await request(app)
        .post('/api/v1/stations')
        .set('Authorization', `Bearer ${token}`)
        .send(stationData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });
  });
});
```

### Test Edge Cases

```typescript
// Test validation errors
it('should reject invalid latitude', async () => {
  const response = await request(app)
    .post('/api/v1/stations')
    .send({ latitude: 100 }); // Invalid

  expect(response.status).toBe(400);
});

// Test not found scenarios
it('should return 404 for non-existent station', async () => {
  const response = await request(app)
    .get('/api/v1/stations/invalid-id');

  expect(response.status).toBe(404);
});
```

## Documentation

### Code Comments

```typescript
// Good - Explain WHY, not WHAT
// Calculate distance using Haversine formula for accuracy
const distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);

// Bad - Obvious comment
// Add 1 to counter
counter = counter + 1;
```

### API Documentation

```typescript
// Good - Swagger/OpenAPI documentation
app.post('/stations', {
  schema: {
    description: 'Create a new railway station',
    tags: ['stations'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['name', 'city', 'latitude', 'longitude'],
      properties: {
        name: { type: 'string', description: 'Station name' },
        city: { type: 'string', description: 'City name' },
        // ...
      }
    },
    response: {
      201: { /* success schema */ },
      400: { /* error schema */ }
    }
  }
}, handler);
```

### Function Documentation

```typescript
/**
 * Calculates the distance between two geographic points using the Haversine formula
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Implementation
}
```

## Git Workflow

### Commit Messages

```bash
# Good - Clear and descriptive
git commit -m "Add JWT authentication middleware"
git commit -m "Fix station validation for latitude bounds"
git commit -m "Update API documentation for train routes"

# Bad - Vague
git commit -m "Fix bug"
git commit -m "Update code"
git commit -m "Changes"
```

### Branch Naming

```bash
# Feature branches
feature/user-authentication
feature/train-route-management

# Bug fixes
bugfix/station-latitude-validation
bugfix/jwt-expiration-handling

# Documentation
docs/api-documentation
docs/setup-guide
```

### Pull Requests

- Write descriptive PR titles
- Include summary of changes
- Reference related issues
- Request code review
- Ensure tests pass

## Performance Optimization

### Database Queries

```typescript
// Good - Batch operations
await prisma.station.createMany({
  data: stations // Array of stations
});

// Bad - Loop with individual creates
for (const station of stations) {
  await prisma.station.create({ data: station });
}
```

### Caching Strategies

```typescript
// Consider caching for frequently accessed, rarely changed data
// Example: Station list, train routes
const cachedStations = await cache.get('stations');
if (cachedStations) {
  return cachedStations;
}

const stations = await prisma.station.findMany();
await cache.set('stations', stations, { ttl: 3600 }); // 1 hour
return stations;
```

### Async Operations

```typescript
// Good - Parallel operations when possible
const [stations, compartments, routes] = await Promise.all([
  prisma.station.findMany(),
  prisma.compartment.findMany(),
  prisma.trainRoute.findMany()
]);

// Bad - Sequential when not necessary
const stations = await prisma.station.findMany();
const compartments = await prisma.compartment.findMany();
const routes = await prisma.trainRoute.findMany();
```

## Code Review Checklist

Before submitting code for review:

- [ ] Code follows project style guidelines
- [ ] All functions have proper type annotations
- [ ] Error handling is implemented correctly
- [ ] Input validation is in place
- [ ] Security best practices are followed
- [ ] Database queries are optimized
- [ ] API responses are consistent
- [ ] Documentation is updated
- [ ] Tests are written (if applicable)
- [ ] No console.log() or commented code
- [ ] Environment variables are used for secrets
- [ ] Code is DRY (Don't Repeat Yourself)

## Common Pitfalls to Avoid

### 1. Not Handling Async Errors
```typescript
// Bad
async function getStation(id: string) {
  return await prisma.station.findUnique({ where: { id } });
  // Doesn't handle promise rejection
}

// Good
async function getStation(id: string) {
  try {
    return await prisma.station.findUnique({ where: { id } });
  } catch (error) {
    log.error('Failed to get station:', error);
    throw new DatabaseError('Failed to fetch station');
  }
}
```

### 2. Exposing Sensitive Data
```typescript
// Bad - Exposing password
const admin = await prisma.admin.findUnique({ where: { email } });
return admin; // Contains password hash!

// Good - Selective fields
const admin = await prisma.admin.findUnique({
  where: { email },
  select: { id: true, firstName: true, lastName: true, email: true }
});
return admin;
```

### 3. Not Validating Input
```typescript
// Bad - Direct usage
const { id } = request.params;
const station = await prisma.station.findUnique({ where: { id } });

// Good - Validation
const paramsSchema = z.object({ id: z.string().uuid() });
const { id } = paramsSchema.parse(request.params);
const station = await prisma.station.findUnique({ where: { id } });
```

## Related Documentation
- [Getting Started Guide](getting-started.md)
- [Environment Configuration](environment-configuration.md)
- [API Testing Guide](api-testing-guide.md)
- [System Architecture](../workflows/system-architecture.md)

---

**Last Updated**: 2025-11-24

**Remember**: These are guidelines, not absolute rules. Use your judgment, and when in doubt, favor readability and maintainability.
