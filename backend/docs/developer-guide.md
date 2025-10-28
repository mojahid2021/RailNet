# RailNet Backend Developer Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Environment Setup](#development-environment-setup)
4. [Development Workflow](#development-workflow)
5. [Code Modification Guide](#code-modification-guide)
6. [Database Operations](#database-operations)
7. [Testing](#testing)
8. [API Development](#api-development)
9. [Security](#security)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

## Project Overview

RailNet is a production-ready railway management system backend built with Fastify, TypeScript, and PostgreSQL. It provides a comprehensive API for managing railway operations including user management, train scheduling, booking systems, and payment processing.

### Key Features

- **High-Performance API**: Built with Fastify framework
- **Type Safety**: Full TypeScript implementation
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication with role-based access control
- **Security**: Helmet, CORS, rate limiting, input validation
- **Caching**: Redis integration for performance optimization
- **Monitoring**: Structured logging and health checks
- **Testing**: Comprehensive test suite with Jest
- **Containerization**: Docker support for easy deployment

## Architecture

### Project Structure

```
src/
├── config/           # Configuration management
│   └── index.ts      # Environment variables and app config
├── controllers/      # Request handlers
│   ├── base.ts       # Base controller with common functionality
│   ├── health.controller.ts
│   └── hello.controller.ts
├── middleware/       # Custom middleware
│   ├── auth.ts       # JWT authentication middleware
│   ├── errorHandler.ts # Global error handling
│   └── security.ts   # Security middleware (helmet, cors, rate limiting)
├── routes/          # Route definitions
│   ├── index.ts     # Route registration
│   ├── health/
│   │   └── health.ts
│   └── hello/
│       └── hello.ts
├── services/        # Business logic layer
│   └── health.service.ts
├── utils/           # Utility functions
│   ├── database.ts  # Prisma client instance
│   ├── jwt.ts       # JWT utilities
│   └── logger.ts    # Winston logger configuration
├── errors/          # Custom error classes
│   └── index.ts
├── prisma/          # Database schema and migrations
│   └── schema.prisma
└── server.ts        # Application entry point
```

### Architectural Patterns

- **Layered Architecture**: Controllers → Services → Database
- **Dependency Injection**: Services are injected into controllers
- **Middleware Pattern**: Request/response processing pipeline
- **Repository Pattern**: Database operations abstracted through Prisma
- **Error Handling**: Centralized error handling with custom error types

## Development Environment Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

### Quick Setup with Docker

1. **Clone the repository**

   ```bash
   git clone https://github.com/mojahid2021/RailNet.git
   cd RailNet
   cd backend
   ```

#### for Docker

2. **Start services**

   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

6. **Start development server**

   ```bash
   npm run dev
   ```

### Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL**
   ```sql
   CREATE DATABASE railnet_db;
   CREATE USER railnet_user WITH PASSWORD 'railnet_password';
   GRANT ALL PRIVILEGES ON DATABASE railnet_db TO railnet_user;
   ```

3. **Set up Redis**
   ```bash
   # Install Redis and start service
   redis-server
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Update DATABASE_URL and other variables
   ```

5. **Initialize database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

## Development Workflow

### Daily Development Cycle

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Make changes with TDD approach**
   ```bash
   # Write tests first
   npm run test:watch

   # Implement feature
   # Refactor and ensure tests pass
   ```

5. **Code quality checks**
   ```bash
   npm run lint
   npm run format
   npm run typecheck
   ```

6. **Run full test suite**
   ```bash
   npm run test:coverage
   ```

7. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

8. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio

# Testing
npm test            # Run tests
npm run test:watch  # Watch mode
npm run test:coverage # With coverage

# Code Quality
npm run lint        # ESLint
npm run lint:fix    # Fix linting issues
npm run format      # Prettier formatting
npm run typecheck   # TypeScript checking
```

## Code Modification Guide

### Adding a New Feature

#### 1. Plan Your Feature

- Define the API endpoints needed
- Design the data models
- Plan the business logic
- Consider authentication/authorization requirements

#### 2. Update Database Schema

If your feature requires database changes:

1. **Modify Prisma schema** (`src/prisma/schema.prisma`)
   ```prisma
   model NewModel {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     @@map("new_models")
   }
   ```

2. **Generate migration**
   ```bash
   npx prisma migrate dev --name add_new_model
   ```

3. **Update Prisma client**
   ```bash
   npm run db:generate
   ```

#### 3. Create Service Layer

Create a new service in `src/services/`:

```typescript
// src/services/new.service.ts
import { Injectable } from '@nestjs/common'; // Wait, this is Fastify, not NestJS
import prisma from '../utils/database';
import { logger } from '../utils/logger';

export class NewService {
  async create(data: CreateNewData) {
    try {
      const result = await prisma.newModel.create({ data });
      logger.info('New model created', { id: result.id });
      return result;
    } catch (error) {
      logger.error('Failed to create new model', { error });
      throw error;
    }
  }

  async findById(id: string) {
    return prisma.newModel.findUnique({ where: { id } });
  }

  async findAll() {
    return prisma.newModel.findMany();
  }

  async update(id: string, data: UpdateNewData) {
    return prisma.newModel.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.newModel.delete({ where: { id } });
  }
}

export const newService = new NewService();
```

#### 4. Create Controller

Create a controller in `src/controllers/`:

```typescript
// src/controllers/new.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { newService } from '../services/new.service';
import { logger } from '../utils/logger';

export class NewController {
  async create(request: FastifyRequest<{ Body: CreateNewData }>, reply: FastifyReply) {
    try {
      const data = request.body;
      const result = await newService.create(data);

      return reply.status(201).send({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Create failed', { error });
      throw error;
    }
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const result = await newService.findById(id);

      if (!result) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          timestamp: new Date().toISOString()
        });
      }

      return reply.send({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get by ID failed', { error });
      throw error;
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const results = await newService.findAll();
      return reply.send({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get all failed', { error });
      throw error;
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string }, Body: UpdateNewData }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const data = request.body;
      const result = await newService.update(id, data);

      return reply.send({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Update failed', { error });
      throw error;
    }
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      await newService.delete(id);

      return reply.send({
        success: true,
        message: 'Deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Delete failed', { error });
      throw error;
    }
  }
}

export const newController = new NewController();
```

#### 5. Create Routes

Create route definitions in `src/routes/new/`:

```typescript
// src/routes/new/new.ts
import { FastifyInstance } from 'fastify';
import { newController } from '../../controllers/new.controller';
import { validateCreateNew, validateUpdateNew } from '../../middleware/validation';

export async function newRoutes(server: FastifyInstance) {
  server.post('/', {
    preHandler: validateCreateNew,
    handler: newController.create
  });

  server.get('/', {
    handler: newController.getAll
  });

  server.get('/:id', {
    handler: newController.getById
  });

  server.put('/:id', {
    preHandler: validateUpdateNew,
    handler: newController.update
  });

  server.delete('/:id', {
    handler: newController.delete
  });
}
```

#### 6. Register Routes

Update `src/routes/index.ts`:

```typescript
// src/routes/index.ts
import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health/health';
import { helloRoutes } from './hello/hello';
import { newRoutes } from './new/new'; // Add this

export async function registerRoutes(server: FastifyInstance) {
  // Health check routes (no prefix)
  await server.register(healthRoutes);

  // API routes with version prefix
  await server.register(async (apiServer) => {
    await apiServer.register(helloRoutes, { prefix: '/hello' });
    await apiServer.register(newRoutes, { prefix: '/new' }); // Add this
  }, { prefix: '/api/v1' });
}
```

#### 7. Add Validation

Create validation middleware in `src/middleware/validation.ts`:

```typescript
// src/middleware/validation.ts
import Joi from 'joi';

export const validateCreateNew = {
  schema: {
    body: Joi.object({
      name: Joi.string().required().min(1).max(100),
      // Add other fields
    })
  }
};

export const validateUpdateNew = {
  schema: {
    body: Joi.object({
      name: Joi.string().min(1).max(100),
      // Add other fields
    }),
    params: Joi.object({
      id: Joi.string().required()
    })
  }
};
```

#### 8. Add Tests

Create tests in appropriate directories:

```typescript
// src/controllers/__tests__/new.controller.test.ts
import { newController } from '../new.controller';
import { newService } from '../../services/new.service';

// Mock the service
jest.mock('../../services/new.service');

describe('NewController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new item successfully', async () => {
      // Test implementation
    });

    it('should handle errors', async () => {
      // Test implementation
    });
  });

  // Add more test cases
});
```

### Modifying Existing Code

#### Adding Middleware

1. **Create middleware** in `src/middleware/`
2. **Register in server.ts** or appropriate location
3. **Add tests** for the middleware

#### Updating Dependencies

1. **Update package.json**
2. **Run npm install**
3. **Update TypeScript types** if needed
4. **Test thoroughly**

#### Configuration Changes

1. **Update src/config/index.ts**
2. **Add environment variables** to .env.example
3. **Update documentation**

## Database Operations

### Schema Changes

1. **Modify schema.prisma**
2. **Create migration**: `npx prisma migrate dev --name description`
3. **Generate client**: `npm run db:generate`
4. **Update models** in your code

### Seeding Data

Create seed files in `scripts/`:

```typescript
// scripts/seed.ts
import prisma from '../src/utils/database';

async function main() {
  // Seed data
  await prisma.user.createMany({
    data: [
      // seed data
    ]
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Database Best Practices

- Use transactions for related operations
- Implement proper indexing
- Use Prisma's type safety features
- Handle connection pooling properly
- Implement proper error handling

## Testing

### Test Structure

```
src/
├── controllers/
│   └── __tests__/
├── services/
│   └── __tests__/
├── middleware/
│   └── __tests__/
├── utils/
│   └── __tests__/
└── __tests__/
    └── integration/
```

### Writing Tests

```typescript
// Unit test example
describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = { email: 'test@example.com', password: 'password' };

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });
  });
});

// Integration test example
describe('User API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create user via API', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: { email: 'test@example.com', password: 'password' }
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });
});
```

### Test Coverage

Aim for:
- **Controllers**: 80%+ coverage
- **Services**: 90%+ coverage
- **Utilities**: 95%+ coverage
- **Integration tests**: Cover all major flows

## API Development

### RESTful Design

- Use appropriate HTTP methods
- Implement proper status codes
- Use consistent response format
- Implement pagination for list endpoints
- Use query parameters for filtering/sorting

### Response Format

```typescript
// Success response
{
  success: true,
  data: T,
  timestamp: string
}

// Error response
{
  success: false,
  error: string,
  code?: string,
  timestamp: string
}

// Paginated response
{
  success: true,
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  timestamp: string
}
```

### Authentication & Authorization

- Use JWT tokens for authentication
- Implement role-based access control
- Validate permissions in middleware
- Handle token refresh properly

## Security

### Best Practices

- **Input Validation**: Use Joi schemas for all inputs
- **SQL Injection**: Prisma prevents this automatically
- **XSS Protection**: Sanitize user inputs
- **CSRF Protection**: Implement CSRF tokens for state-changing operations
- **Rate Limiting**: Configure appropriate limits
- **HTTPS**: Always use HTTPS in production
- **Secrets Management**: Never commit secrets to code

### Security Headers

Configured via Helmet:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

## Deployment

### Docker Deployment

1. **Build image**
   ```bash
   docker build -t railnet-backend .
   ```

2. **Run with docker-compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set strong JWT secrets
- [ ] Configure Redis
- [ ] Set up SSL/TLS
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set up health checks

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-production-secret
REDIS_URL=redis://host:6379
LOG_LEVEL=warn
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string
psql "postgresql://user:pass@localhost:5432/db" -c "SELECT 1"

# Reset database
npm run db:migrate:reset
```

#### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
docker logs railnet_redis
```

#### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf dist/
npm run build
```

#### Test Issues

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test
npm test -- --testNamePattern="test name"

# Debug tests
npm test -- --inspect-brk
```

### Logs

Check logs in:
- `logs/` directory
- Docker container logs: `docker logs railnet_app`
- Database logs: `docker logs railnet_postgres`

## Best Practices

### Code Quality

- **TypeScript**: Use strict type checking
- **ESLint**: Follow linting rules
- **Prettier**: Consistent code formatting
- **Pre-commit hooks**: Husky for quality gates

### Performance

- **Database**: Use proper indexing
- **Caching**: Implement Redis caching for frequently accessed data
- **Pagination**: Always paginate large datasets
- **Compression**: Enable response compression
- **Connection pooling**: Configure appropriate pool sizes

### Error Handling

- **Custom errors**: Use custom error classes
- **Logging**: Log errors with context
- **User-friendly messages**: Don't expose internal errors
- **Graceful degradation**: Handle failures gracefully

### Documentation

- **API docs**: Keep Swagger documentation updated
- **Code comments**: Document complex logic
- **README**: Keep setup instructions current
- **Changelogs**: Document changes and migrations

### Git Workflow

- **Branch naming**: `feature/`, `bugfix/`, `hotfix/`
- **Commit messages**: Use conventional commits
- **Pull requests**: Require reviews for main branch
- **Squash merges**: Keep history clean

### Monitoring

- **Health checks**: Implement comprehensive health endpoints
- **Metrics**: Track performance metrics
- **Alerts**: Set up alerts for critical issues
- **Logs**: Structured logging with appropriate levels

---

## Contributing

1. Follow the development workflow
2. Write tests for new features
3. Update documentation
4. Ensure all checks pass
5. Create a pull request

## Support

For questions or issues:
1. Check this documentation
2. Review existing issues
3. Create a new issue with detailed information
4. Contact the development team

---

*Last updated: October 29, 2025*</content>
<parameter name="filePath">/home/mojahid/VS-Code/RailNet/backend/docs/developer-guide.md