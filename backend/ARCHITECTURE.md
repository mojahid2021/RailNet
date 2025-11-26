# Backend Architecture Documentation

## Overview

The RailNet backend has been restructured to follow professional software engineering standards with a clear separation of concerns, modular architecture, and industry best practices.

## Directory Structure

```
backend/src/
├── common/                      # Shared code across modules
│   ├── constants/               # Application-wide constants
│   │   └── index.ts             # HTTP status codes, error messages, etc.
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts             # Common types and interfaces
│   └── interfaces/              # Shared interfaces
│       └── index.ts             # ILogger, IRepository, IService, etc.
│
├── core/                        # Core infrastructure
│   ├── config/                  # Configuration management
│   │   └── index.ts             # Environment configuration with Zod validation
│   ├── database/                # Database layer
│   │   └── prisma.service.ts    # Prisma singleton service
│   └── logger/                  # Logging infrastructure
│       └── logger.service.ts    # Centralized logger service
│
├── shared/                      # Shared utilities and middleware
│   ├── errors/                  # Error handling
│   │   ├── app.error.ts         # Custom error classes
│   │   └── index.ts
│   ├── middleware/              # Middleware functions
│   │   ├── auth.middleware.ts   # Authentication middleware
│   │   ├── error.middleware.ts  # Global error handler
│   │   └── index.ts
│   └── utils/                   # Utility functions
│       ├── response.handler.ts  # Standardized response formatting
│       ├── jwt.util.ts          # JWT utilities
│       ├── pagination.util.ts   # Pagination helpers
│       └── index.ts
│
├── modules/                     # Feature modules
│   ├── auth/                    # Authentication module
│   │   ├── controllers/         # Route handlers
│   │   │   ├── admin-auth.controller.ts
│   │   │   └── user-auth.controller.ts
│   │   ├── services/            # Business logic
│   │   │   └── auth.service.ts
│   │   ├── dtos/                # Data Transfer Objects
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── index.ts
│   │   ├── validators/          # Validation logic (future)
│   │   ├── repositories/        # Data access (future)
│   │   └── index.ts
│   │
│   ├── admin/                   # Admin management module
│   │   ├── controllers/         # Route handlers
│   │   │   ├── station.controller.ts
│   │   │   ├── compartment.controller.ts
│   │   │   ├── train.controller.ts
│   │   │   ├── train-route.controller.ts
│   │   │   └── index.ts
│   │   ├── services/            # Business logic
│   │   │   ├── station.service.ts
│   │   │   ├── compartment.service.ts
│   │   │   ├── train.service.ts
│   │   │   ├── train-route.service.ts
│   │   │   └── index.ts
│   │   ├── dtos/                # Data Transfer Objects
│   │   │   ├── station.dto.ts
│   │   │   ├── compartment.dto.ts
│   │   │   ├── train.dto.ts
│   │   │   ├── train-route.dto.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── schedule/                # Schedule management module
│   │   ├── controllers/         # Route handlers
│   │   │   ├── schedule.controller.ts
│   │   │   └── index.ts
│   │   ├── services/            # Business logic
│   │   │   ├── schedule.service.ts
│   │   │   └── index.ts
│   │   ├── dtos/                # Data Transfer Objects
│   │   │   ├── schedule.dto.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── station/                 # Station module (legacy - being refactored)
│   └── booking/                 # Booking management (future)
│
└── app.ts                       # Application entry point
```

## Architecture Layers

### 1. Core Layer
**Purpose**: Foundation infrastructure that the entire application depends on.

- **Configuration**: Environment variable management with validation
- **Database**: Singleton Prisma client with logging and error handling
- **Logger**: Centralized logging service using Pino

### 2. Common Layer
**Purpose**: Shared code that can be used across all modules.

- **Constants**: Application-wide constants (HTTP status codes, error messages, etc.)
- **Types**: Common TypeScript types and interfaces
- **Interfaces**: Shared interface definitions (ILogger, IRepository, IService)

### 3. Shared Layer
**Purpose**: Reusable utilities, middleware, and cross-cutting concerns.

- **Errors**: Custom error classes with proper HTTP status codes
- **Middleware**: Authentication, error handling, validation
- **Utils**: Response formatting, JWT operations, pagination

### 4. Module Layer
**Purpose**: Feature-specific code organized by domain/feature.

Each module follows a consistent structure:
```
module-name/
├── controllers/      # HTTP request handlers
├── services/         # Business logic
├── repositories/     # Data access layer
├── dtos/             # Data Transfer Objects (validation schemas)
├── validators/       # Custom validation logic
└── index.ts          # Module exports
```

## Design Patterns

### 1. Layered Architecture
- **Controllers**: Handle HTTP requests/responses, validate input
- **Services**: Contain business logic, orchestrate operations
- **Repositories**: Abstract data access, interact with database

### 2. Dependency Injection
- Services are instantiated and exported as singletons
- Dependencies are injected through constructors (future enhancement)
- Facilitates testing and loose coupling

### 3. Repository Pattern
- Abstracts database operations
- Makes it easy to switch data sources
- Improves testability

### 4. DTO Pattern
- Validates incoming data using Zod schemas
- Type-safe data transfer
- Clear API contracts

### 5. Middleware Pattern
- Authentication, authorization, logging
- Reusable across routes
- Separation of cross-cutting concerns

## Key Improvements

### 1. Separation of Concerns
- Clear distinction between controllers, services, and data access
- Each layer has a single responsibility
- Easier to maintain and test

### 2. Type Safety
- Comprehensive TypeScript types
- Zod schemas for runtime validation
- Type inference from schemas

### 3. Error Handling
- Custom error classes with proper status codes
- Centralized error handler
- Consistent error responses

### 4. Logging
- Centralized logger service
- Structured logging
- Environment-based log levels

### 5. Configuration Management
- Type-safe configuration
- Environment variable validation
- Centralized config access

### 6. Modularity
- Feature-based module organization
- Self-contained modules
- Easy to add/remove features

### 7. Scalability
- Clear module boundaries
- Easy to split into microservices
- Horizontal scaling ready

## Migration Strategy

The restructuring follows an incremental approach:

1. **Phase 1 (Completed)**: Core infrastructure
   - ✅ Core layer (config, database, logger)
   - ✅ Common layer (types, constants, interfaces)
   - ✅ Shared layer (errors, middleware, utils)
   - ✅ Auth module (complete example)

2. **Phase 2 (Completed)**: Module migration
   - ✅ Station module (controllers, services, DTOs)
   - ✅ Train module (controllers, services, DTOs)
   - ✅ Train-route module (controllers, services, DTOs)
   - ✅ Compartment module (controllers, services, DTOs)
   - ✅ Schedule module (controllers, services, DTOs)
   - [ ] Booking module

3. **Phase 3**: Advanced features
   - [ ] Repository layer implementation
   - [ ] Unit tests for each layer
   - [ ] Integration tests
   - [ ] API documentation updates

## Usage Examples

### Creating a New Module

```typescript
// 1. Create module structure
modules/
  └── new-feature/
      ├── controllers/
      ├── services/
      ├── dtos/
      └── index.ts

// 2. Define DTOs with Zod
// modules/new-feature/dtos/create-item.dto.ts
import { z } from 'zod';

export const CreateItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreateItemDto = z.infer<typeof CreateItemSchema>;

// 3. Create Service
// modules/new-feature/services/item.service.ts
import { prisma } from '../../../core/database/prisma.service';
import { CreateItemDto } from '../dtos';

export class ItemService {
  async create(data: CreateItemDto) {
    return await prisma.item.create({ data });
  }
}

export const itemService = new ItemService();

// 4. Create Controller
// modules/new-feature/controllers/item.controller.ts
import { FastifyInstance } from 'fastify';
import { itemService } from '../services/item.service';
import { CreateItemSchema } from '../dtos';
import { ResponseHandler } from '../../../shared/utils';

export async function itemRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const data = CreateItemSchema.parse(request.body);
    const item = await itemService.create(data);
    return ResponseHandler.created(reply, item);
  });
}

// 5. Register in app.ts
import { itemRoutes } from './modules/new-feature';
app.register(itemRoutes, { prefix: '/items' });
```

## Testing Strategy

```typescript
// Unit Test Example
describe('ItemService', () => {
  it('should create an item', async () => {
    const data = { name: 'Test Item' };
    const result = await itemService.create(data);
    expect(result).toHaveProperty('id');
  });
});

// Integration Test Example
describe('POST /items', () => {
  it('should create an item', async () => {
    const response = await request(app)
      .post('/api/v1/items')
      .send({ name: 'Test Item' })
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

## Best Practices

1. **Keep modules independent**: Modules should not import from each other directly
2. **Use shared code**: Leverage common, core, and shared layers
3. **Type everything**: Avoid `any` types, use proper TypeScript types
4. **Validate input**: Always validate request data with Zod schemas
5. **Handle errors properly**: Use custom error classes, don't swallow errors
6. **Log appropriately**: Use the logger service, not console.log
7. **Keep controllers thin**: Business logic belongs in services
8. **Test your code**: Write unit and integration tests
9. **Document public APIs**: Add JSDoc comments for exported functions
10. **Follow naming conventions**: Consistent naming across the codebase

## Environment Variables

Required environment variables (validated on startup):

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
API_PREFIX=/api/v1
DATABASE_URL=postgresql://user:pass@localhost:5432/railnet
JWT_SECRET=your-secret-key
BASE_URL=http://localhost:3000
```

## Performance Considerations

1. **Database**: Use Prisma's query optimization, connection pooling
2. **Caching**: Implement caching for frequently accessed data
3. **Pagination**: Always paginate list endpoints
4. **Async Operations**: Use Promise.all() for parallel operations
5. **Logging**: Use appropriate log levels to avoid performance impact

## Security Measures

1. **Authentication**: JWT-based with secure token generation
2. **Password Hashing**: bcrypt with appropriate salt rounds
3. **Input Validation**: Zod schemas for all input
4. **SQL Injection**: Protected by Prisma's parameterized queries
5. **Rate Limiting**: Fastify rate limit plugin
6. **CORS**: Configured allowed origins
7. **Security Headers**: Helmet middleware
8. **Error Handling**: Don't expose sensitive information in errors

## Future Enhancements

1. **Caching Layer**: Redis integration for caching
2. **Message Queue**: Bull/BullMQ for async jobs
3. **Microservices**: Split into domain services
4. **GraphQL**: Alternative API interface
5. **WebSockets**: Real-time updates
6. **Monitoring**: Prometheus, Grafana
7. **Tracing**: OpenTelemetry integration
8. **API Gateway**: Kong or similar
9. **Service Mesh**: Istio for microservices
10. **CI/CD**: Automated testing and deployment

## Related Documentation

- [Main README](README.md)
- [API Documentation](docs/api/README.md)
- [Best Practices](docs/guides/best-practices.md)
- [System Architecture](docs/workflows/system-architecture.md)

---

**Last Updated**: 2025-11-26
**Version**: 2.0.0
**Maintained by**: Team error2k21
