# RailNet Backend - Professional Structure

## 🎯 Overview

The RailNet backend has been completely restructured to follow enterprise-level software engineering practices with clear separation of concerns, modular architecture, and professional standards.

## 📁 New Directory Structure

```
backend/
├── src/
│   ├── common/              # Shared code across all modules
│   │   ├── constants/       # Application constants
│   │   ├── types/           # TypeScript type definitions
│   │   └── interfaces/      # Shared interfaces
│   │
│   ├── core/                # Core infrastructure
│   │   ├── config/          # Environment configuration
│   │   ├── database/        # Database service (Prisma)
│   │   └── logger/          # Logging service
│   │
│   ├── shared/              # Shared utilities
│   │   ├── errors/          # Custom error classes
│   │   ├── middleware/      # Authentication, error handling
│   │   └── utils/           # Response handlers, JWT, pagination
│   │
│   └── modules/             # Feature modules
│       ├── auth/            # ✅ Authentication (Admin & User)
│       ├── station/         # ✅ Station management
│       ├── train/           # ⏳ Train management
│       ├── train-route/     # ⏳ Train route management
│       ├── compartment/     # ⏳ Compartment management
│       ├── schedule/        # ⏳ Schedule management
│       └── booking/         # ⏳ Booking management
│
├── tests/                   # Test files mirroring src structure
│   └── modules/
│       ├── auth/
│       └── station/
│
├── docs/                    # Documentation
├── prisma/                  # Database schema and migrations
├── ARCHITECTURE.md          # Detailed architecture documentation
├── MIGRATION_GUIDE.md       # Migration guide for developers
└── package.json
```

## 🏗️ Architecture Layers

### 1. Core Layer
Foundation services that the entire application depends on:
- **Config**: Type-safe environment configuration with Zod validation
- **Database**: Singleton Prisma service with logging
- **Logger**: Centralized Pino-based logging service

### 2. Common Layer
Shared code reusable across all modules:
- **Constants**: HTTP status codes, error messages, roles
- **Types**: Common TypeScript interfaces and types
- **Interfaces**: Abstract interfaces (ILogger, IRepository, IService)

### 3. Shared Layer
Cross-cutting concerns and utilities:
- **Errors**: Custom error classes (NotFoundError, ConflictError, etc.)
- **Middleware**: Authentication, authorization, error handling
- **Utils**: Response formatting, JWT operations, pagination

### 4. Module Layer
Feature-specific code organized by domain:

Each module follows a consistent structure:
```
module/
├── controllers/     # Route handlers (HTTP layer)
├── services/        # Business logic
├── repositories/    # Data access (future)
├── dtos/            # Data Transfer Objects with validation
├── validators/      # Custom validation (future)
└── index.ts         # Module exports
```

## ✨ Key Features

### ✅ Implemented Features

1. **Professional Structure**
   - Layered architecture (Controllers → Services → Repositories)
   - Clear separation of concerns
   - Module-based organization

2. **Type Safety**
   - Comprehensive TypeScript types
   - Runtime validation with Zod
   - Type inference from schemas

3. **Error Handling**
   - Custom error classes with proper HTTP status codes
   - Centralized error handler
   - Consistent error responses

4. **Logging**
   - Centralized logger service
   - Structured logging with Pino
   - Environment-based log levels

5. **Configuration**
   - Type-safe environment variables
   - Zod validation on startup
   - Centralized configuration access

6. **Authentication**
   - JWT-based authentication
   - Separate admin and user roles
   - Secure token generation and verification

7. **Utilities**
   - Standardized response formatting
   - Pagination helpers
   - JWT utilities

### 🎯 Benefits

1. **Maintainability**
   - Easy to find and modify code
   - Clear module boundaries
   - Self-documenting structure

2. **Testability**
   - Services can be tested independently
   - Clear test structure
   - Easy to mock dependencies

3. **Scalability**
   - Add features without affecting others
   - Easy to split into microservices
   - Horizontal scaling ready

4. **Developer Experience**
   - Consistent patterns
   - Clear conventions
   - Comprehensive documentation

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Configuration
```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
```

### Development
```bash
npm run dev          # Start development server
```

### Production
```bash
npm run build        # Compile TypeScript
npm start            # Start production server
```

## 📖 Module Example: Authentication

### Structure
```
modules/auth/
├── controllers/
│   ├── admin-auth.controller.ts    # Admin auth endpoints
│   └── user-auth.controller.ts     # User auth endpoints
├── services/
│   └── auth.service.ts              # Auth business logic
├── dtos/
│   ├── register.dto.ts              # Registration validation
│   ├── login.dto.ts                 # Login validation
│   └── index.ts
└── index.ts
```

### Usage

#### DTOs (Data Transfer Objects)
```typescript
// dtos/register.dto.ts
import { z } from 'zod';

export const RegisterAdminSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterAdminDto = z.infer<typeof RegisterAdminSchema>;
```

#### Services (Business Logic)
```typescript
// services/auth.service.ts
export class AuthService {
  async registerAdmin(data: RegisterAdminDto) {
    // 1. Check if admin exists
    // 2. Hash password
    // 3. Create admin
    // 4. Return sanitized data
  }
  
  async loginAdmin(data: LoginDto) {
    // 1. Find admin
    // 2. Verify password
    // 3. Generate JWT token
    // 4. Return token and data
  }
}
```

#### Controllers (HTTP Layer)
```typescript
// controllers/admin-auth.controller.ts
export async function adminAuthRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const data = RegisterAdminSchema.parse(request.body);
    const admin = await authService.registerAdmin(data);
    return ResponseHandler.created(reply, admin);
  });
}
```

## 🧪 Testing

### Test Structure
```
tests/
└── modules/
    ├── auth/
    │   └── auth.service.test.ts
    └── station/
        └── station.service.test.ts
```

### Running Tests
```bash
npm run test:run     # Run all tests
npm test             # Run tests in watch mode
```

### Example Test
```typescript
describe('StationService', () => {
  it('should create a station', async () => {
    const data = { name: 'Test', ... };
    const station = await stationService.create(data);
    expect(station).toHaveProperty('id');
  });
});
```

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture documentation
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration guide for developers
- [docs/api/](docs/api/) - API documentation
- [docs/guides/](docs/guides/) - Developer guides

## 🔄 Migration Status

### ✅ Phase 1: Core Infrastructure (Complete)
- Core layer (config, database, logger)
- Common layer (types, constants, interfaces)
- Shared layer (errors, middleware, utils)

### ✅ Phase 2: Module Implementation (Partial)
- Auth module (complete)
- Station module (complete)
- Train module (pending)
- Train-route module (pending)
- Compartment module (pending)
- Schedule module (pending)
- Booking module (pending)

### ⏳ Phase 3: Advanced Features (Planned)
- Repository layer
- Comprehensive unit tests
- Integration tests
- Performance optimization

## 🛠️ Development Workflow

### Creating a New Module

1. **Create Structure**
```bash
mkdir -p src/modules/new-feature/{controllers,services,dtos,repositories}
```

2. **Define DTOs**
```typescript
// dtos/create-resource.dto.ts
export const CreateResourceSchema = z.object({
  name: z.string().min(1),
});
```

3. **Implement Service**
```typescript
// services/resource.service.ts
export class ResourceService {
  async create(data: CreateResourceDto) { }
  async findAll() { }
  async findById(id: string) { }
  async update(id: string, data: UpdateResourceDto) { }
  async delete(id: string) { }
}
```

4. **Create Controller**
```typescript
// controllers/resource.controller.ts
export async function resourceRoutes(app: FastifyInstance) {
  app.post('/', createHandler);
  app.get('/', findAllHandler);
  // ...
}
```

5. **Register Routes**
```typescript
// app.ts
import { resourceRoutes } from './modules/new-feature';
app.register(resourceRoutes, { prefix: '/resources' });
```

## 🔐 Security

- JWT-based authentication
- bcrypt password hashing
- Zod input validation
- SQL injection protection (Prisma)
- Rate limiting
- CORS configuration
- Security headers (Helmet)

## 📊 Performance

- Connection pooling (Prisma)
- Async/await patterns
- Efficient database queries
- Pagination for list endpoints
- Structured logging

## 🤝 Contributing

1. Follow the established module structure
2. Use proper TypeScript types
3. Validate all inputs with Zod
4. Handle errors appropriately
5. Write tests for new features
6. Document public APIs
7. Follow naming conventions

## 📞 Support

- **Documentation**: See [ARCHITECTURE.md](ARCHITECTURE.md) and [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Issues**: GitHub Issues
- **Email**: aammojahid@gmail.com

## 📝 License

ISC

---

**Version**: 2.0.0  
**Last Updated**: 2025-11-26  
**Status**: In Development  
**Maintained by**: Team error2k21
