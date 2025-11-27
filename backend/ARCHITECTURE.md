# Backend Architecture Documentation

## Overview

The RailNet backend has been restructured to follow professional software engineering standards with a clear separation of concerns, modular architecture, and industry best practices.

## Directory Structure

```
backend/src/
├── lib/                         # Core infrastructure and shared utilities
│   ├── config.ts                # Environment configuration with Zod validation
│   ├── prisma.ts                # Prisma singleton service
│   ├── logger.ts                # Centralized logger service
│   ├── constants.ts             # Application-wide constants
│   ├── types.ts                 # Common TypeScript types and interfaces
│   ├── errors.ts                # Custom error classes
│   ├── response.ts              # Standardized response formatting
│   ├── jwt.ts                   # JWT utilities
│   ├── pagination.ts            # Pagination helpers
│   ├── middleware.ts            # Authentication middleware
│   ├── admin-security.ts        # Admin security utilities
│   ├── error-handler.ts         # Error handler utility
│   └── index.ts                 # Central exports
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
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dtos/
│   │   └── index.ts
│   │
│   ├── station/                 # Station module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dtos/
│   │   └── index.ts
│   │
│   └── booking/                 # Ticket booking module
│       ├── controllers/
│       ├── services/
│       ├── dtos/
│       └── index.ts
│
└── app.ts                       # Application entry point
```

## Architecture Layers

### 1. Library Layer (`lib/`)
**Purpose**: Consolidated core infrastructure, shared utilities, and cross-cutting concerns.

This single `lib/` directory consolidates what was previously spread across `common/`, `core/`, and `shared/` directories, reducing redundancy and improving maintainability.

- **Configuration**: `config.ts` - Environment variable management with Zod validation
- **Database**: `prisma.ts` - Singleton Prisma client with logging and error handling
- **Logger**: `logger.ts` - Centralized logging service using Pino
- **Constants**: `constants.ts` - Application-wide constants (HTTP status codes, error messages, etc.)
- **Types**: `types.ts` - Common TypeScript types, interfaces, and Fastify augmentation
- **Errors**: `errors.ts` - Custom error classes with proper HTTP status codes
- **Response**: `response.ts` - Standardized response formatting utility
- **JWT**: `jwt.ts` - JWT token generation and verification
- **Pagination**: `pagination.ts` - Pagination helpers
- **Middleware**: `middleware.ts` - Authentication middleware
- **Admin Security**: `admin-security.ts` - Admin security utilities
- **Error Handler**: `error-handler.ts` - Centralized error handling for controllers

### 2. Module Layer (`modules/`)
**Purpose**: Feature-specific code organized by domain/feature.

Each module follows a consistent structure:
```
module-name/
├── controllers/      # HTTP request handlers
├── services/         # Business logic
├── dtos/             # Data Transfer Objects (validation schemas)
└── index.ts          # Module exports
```

## Design Patterns

### 1. Layered Architecture
- **Controllers**: Handle HTTP requests/responses, validate input
- **Services**: Contain business logic, orchestrate operations
- **DTOs**: Define data transfer objects with Zod schemas

### 2. Centralized Library
- All shared code is in a single `lib/` directory
- Single import path for all utilities: `import { ... } from '../../../lib'`
- Reduces import complexity and circular dependencies

### 3. DTO Pattern
- Validates incoming data using Zod schemas
- Type-safe data transfer
- Clear API contracts

### 4. Middleware Pattern
- Authentication, authorization, logging
- Reusable across routes
- Separation of cross-cutting concerns

## Key Improvements

### 1. Reduced Directory Structure
- Consolidated `common/`, `core/`, and `shared/` into single `lib/` directory
- Eliminates redundancy and confusion
- Simpler import paths

### 2. Separation of Concerns
- Clear distinction between controllers, services, and data access
- Each layer has a single responsibility
- Easier to maintain and test

### 3. Type Safety
- Comprehensive TypeScript types
- Zod schemas for runtime validation
- Type inference from schemas

### 4. Error Handling
- Custom error classes with proper status codes
- Centralized error handler
- Consistent error responses

### 5. Logging
- Centralized logger service
- Structured logging
- Environment-based log levels

### 6. Configuration Management
- Type-safe configuration
- Environment variable validation
- Centralized config access

### 7. Modularity
- Feature-based module organization
- Self-contained modules
- Easy to add/remove features

## Usage Examples

### Importing from lib
```typescript
// Import everything you need from the lib directory
import { 
  prisma, 
  logger, 
  config,
  ResponseHandler, 
  ErrorHandlerUtil,
  authenticateAdmin,
  NotFoundError,
  ConflictError,
  HTTP_STATUS,
  AUTH,
  JWTPayload 
} from '../../../lib';
```

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
import { prisma, NotFoundError } from '../../../lib';
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
import { ResponseHandler, ErrorHandlerUtil, authenticateAdmin } from '../../../lib';

export async function itemRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: authenticateAdmin,
  }, async (request, reply) => {
    try {
      const data = CreateItemSchema.parse(request.body);
      const item = await itemService.create(data);
      return ResponseHandler.created(reply, item);
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error);
    }
  });
}

// 5. Register in app.ts
app.register(async (app) => {
  const { itemRoutes } = await import('./modules/new-feature');
  await itemRoutes(app);
}, { prefix: '/items' });
```

## Best Practices

1. **Import from lib**: Always import shared utilities from `lib/index.ts`
2. **Keep modules independent**: Modules should not import from each other directly
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

## Security Measures

1. **Authentication**: JWT-based with secure token generation
2. **Password Hashing**: bcrypt with appropriate salt rounds
3. **Input Validation**: Zod schemas for all input
4. **SQL Injection**: Protected by Prisma's parameterized queries
5. **Rate Limiting**: Fastify rate limit plugin
6. **CORS**: Configured allowed origins
7. **Security Headers**: Helmet middleware
8. **Error Handling**: Don't expose sensitive information in errors

## Related Documentation

- [Main README](README.md)
- [API Documentation](docs/api/README.md)
- [Best Practices](docs/guides/best-practices.md)

---

**Last Updated**: 2025-11-26
**Version**: 3.0.0
**Maintained by**: Team error2k21
