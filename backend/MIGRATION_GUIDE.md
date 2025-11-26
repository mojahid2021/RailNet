# Backend Migration Guide

This guide explains how to migrate from the old structure to the new professional architecture.

## Overview

The backend has been restructured from a flat, mixed-concern architecture to a modular, layered architecture following industry best practices.

## What Changed?

### Old Structure
```
src/
├── admin/          # Mixed admin routes and resources
├── user/           # User routes
├── schedules/      # Schedule routes
├── config/         # Configuration
├── middleware/     # Middleware
├── schemas/        # All schemas in one place
├── utils/          # Utilities
└── app.ts          # Main application
```

### New Structure
```
src/
├── common/         # Types, constants, interfaces
├── core/           # Config, database, logger
├── shared/         # Middleware, errors, utils
├── modules/        # Feature modules
│   ├── auth/       # Authentication (✅ Complete)
│   ├── station/    # Stations (✅ Complete)
│   ├── train/      # Trains (⏳ Pending)
│   └── ...
└── app.new.ts      # New application entry
```

## Migration Status

### ✅ Completed Modules
- **Auth Module**: Admin and user authentication
- **Station Module**: Station management CRUD

### ⏳ Pending Modules
- Train management
- Train routes
- Compartments
- Schedules
- Bookings

### 🔄 In Progress
- Core infrastructure (Config, Database, Logger)
- Shared utilities (Errors, Middleware, Response handlers)
- Common types and constants

## How to Use Both Versions

### Option 1: Use Old Structure (Current Default)
```bash
npm run dev          # Uses src/app.ts
npm run build        # Compiles with old structure
npm start            # Runs old version
```

### Option 2: Use New Structure (Testing)
```bash
# Temporarily rename files
mv src/app.ts src/app.old.ts
mv src/app.new.ts src/app.ts

npm run dev          # Now uses new structure
```

### Option 3: Gradual Migration (Recommended)
Keep both files and gradually migrate routes:

1. Test new modules individually
2. Update `app.ts` to import from new modules
3. Remove old module files after migration
4. Delete `app.new.ts` when complete

## Step-by-Step Migration Guide

### Step 1: Understand the New Structure

Read the [ARCHITECTURE.md](ARCHITECTURE.md) document to understand:
- Layered architecture
- Module organization
- Design patterns
- Best practices

### Step 2: Migrate a Feature Module

Let's migrate the "train" module as an example:

#### 2.1 Create Module Structure
```bash
cd src/modules
mkdir -p train/{controllers,services,dtos,repositories}
```

#### 2.2 Create DTOs
```typescript
// src/modules/train/dtos/train.dto.ts
import { z } from 'zod';

export const CreateTrainSchema = z.object({
  name: z.string().min(1),
  number: z.string().min(1),
  type: z.string().min(1),
  trainRouteId: z.string().uuid().optional(),
  compartmentIds: z.array(z.string().uuid()).optional(),
});

export type CreateTrainDto = z.infer<typeof CreateTrainSchema>;
```

#### 2.3 Create Service
```typescript
// src/modules/train/services/train.service.ts
import { prisma } from '../../../core/database/prisma.service';
import { CreateTrainDto } from '../dtos';

export class TrainService {
  async create(data: CreateTrainDto) {
    return await prisma.train.create({
      data: {
        name: data.name,
        number: data.number,
        type: data.type,
        trainRouteId: data.trainRouteId,
      },
    });
  }
  
  // Add other methods: findAll, findById, update, delete
}

export const trainService = new TrainService();
```

#### 2.4 Create Controller
```typescript
// src/modules/train/controllers/train.controller.ts
import { FastifyInstance } from 'fastify';
import { trainService } from '../services/train.service';
import { CreateTrainSchema } from '../dtos';
import { ResponseHandler } from '../../../shared/utils';
import { authenticateAdmin } from '../../../shared/middleware';

export async function trainRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Create a new train',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const data = CreateTrainSchema.parse(request.body);
      const train = await trainService.create(data);
      return ResponseHandler.created(reply, train);
    } catch (error) {
      return ResponseHandler.error(reply, error.message, 500);
    }
  });
}
```

#### 2.5 Register Routes
```typescript
// src/app.ts or src/app.new.ts
import { trainRoutes } from './modules/train';

app.register(trainRoutes, { prefix: '/trains' });
```

#### 2.6 Remove Old Files
After testing the new module:
```bash
rm src/admin/trains.ts  # Old file
```

### Step 3: Update Existing Code

#### Replace Old Imports
```typescript
// Old
import { ResponseHandler } from './utils/response';
import { JWTUtils } from './utils/jwt';

// New
import { ResponseHandler } from './shared/utils/response.handler';
import { JWTUtil } from './shared/utils/jwt.util';
```

#### Use New Error Classes
```typescript
// Old
throw new Error('Not found');

// New
import { NotFoundError } from './shared/errors';
throw new NotFoundError('Station not found');
```

#### Use New Middleware
```typescript
// Old
import { authenticateAdmin } from './middleware/auth';

// New
import { authenticateAdmin } from './shared/middleware/auth.middleware';
```

### Step 4: Testing

#### Unit Tests
```typescript
// tests/modules/train/train.service.test.ts
import { trainService } from '../../../src/modules/train/services/train.service';

describe('TrainService', () => {
  it('should create a train', async () => {
    const data = {
      name: 'Express',
      number: 'TR001',
      type: 'Express',
    };
    
    const train = await trainService.create(data);
    expect(train).toHaveProperty('id');
  });
});
```

#### Integration Tests
```typescript
// tests/integration/train.test.ts
import { app } from '../../../src/app';

describe('POST /trains', () => {
  it('should create a train', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/trains',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        name: 'Express',
        number: 'TR001',
        type: 'Express',
      },
    });
    
    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty('data.id');
  });
});
```

### Step 5: Update Documentation

After migrating a module:
1. Update API documentation
2. Update README if needed
3. Add module-specific documentation
4. Update ARCHITECTURE.md

## Common Patterns

### Service Pattern
```typescript
export class ResourceService {
  async create(data: CreateDto) { }
  async findAll() { }
  async findById(id: string) { }
  async update(id: string, data: UpdateDto) { }
  async delete(id: string) { }
}
```

### Controller Pattern
```typescript
export async function resourceRoutes(app: FastifyInstance) {
  app.post('/', { preHandler, schema }, createHandler);
  app.get('/', { preHandler, schema }, findAllHandler);
  app.get('/:id', { preHandler, schema }, findByIdHandler);
  app.put('/:id', { preHandler, schema }, updateHandler);
  app.delete('/:id', { preHandler, schema }, deleteHandler);
}
```

### Error Handling Pattern
```typescript
try {
  const result = await service.operation();
  return ResponseHandler.success(reply, result);
} catch (error) {
  if (error instanceof NotFoundError) {
    return ResponseHandler.notFound(reply, error.message);
  }
  if (error instanceof ConflictError) {
    return ResponseHandler.conflict(reply, error.message);
  }
  return ResponseHandler.error(reply, error.message, 500);
}
```

## Benefits of New Structure

### 1. Separation of Concerns
- Controllers handle HTTP
- Services handle business logic
- Repositories handle data access

### 2. Testability
- Services can be tested independently
- Mock dependencies easily
- Clear test boundaries

### 3. Maintainability
- Find code by feature, not by type
- Each module is self-contained
- Easy to understand and modify

### 4. Scalability
- Add new features without affecting others
- Easy to split into microservices
- Clear module boundaries

### 5. Type Safety
- DTOs with Zod validation
- TypeScript types throughout
- Compile-time error checking

## Troubleshooting

### Import Errors
```typescript
// Error: Cannot find module
import { something } from './wrong/path';

// Fix: Use correct path from new structure
import { something } from '../../../shared/utils';
```

### Circular Dependencies
```typescript
// Avoid importing between modules
// Use shared layer instead

// Bad
import { stationService } from '../station/services/station.service';

// Good
// Pass station data as parameter or use events
```

### Type Errors
```typescript
// Error: Property 'prisma' does not exist
const data = await prisma.model.findMany();

// Fix: Import from new database service
import { prisma } from '../../../core/database/prisma.service';
const data = await prisma.model.findMany();
```

## Rollback Plan

If issues arise during migration:

### Option 1: Revert to Old Structure
```bash
git checkout main -- src/app.ts
git checkout main -- src/admin/
git checkout main -- src/user/
# Keep new structure for future
```

### Option 2: Use Feature Flags
```typescript
// config
const USE_NEW_STRUCTURE = process.env.USE_NEW_STRUCTURE === 'true';

// app.ts
if (USE_NEW_STRUCTURE) {
  app.register(newStationRoutes, { prefix: '/stations' });
} else {
  app.register(oldStationRoutes, { prefix: '/stations' });
}
```

### Option 3: Gradual Rollout
- Keep both versions running
- Route specific endpoints to new structure
- Monitor for issues
- Roll back problematic modules

## Timeline

### Week 1-2: Foundation
- ✅ Core infrastructure
- ✅ Shared utilities
- ✅ Auth module
- ✅ Station module

### Week 3-4: Module Migration
- [ ] Train module
- [ ] Train route module
- [ ] Compartment module

### Week 5-6: Advanced Features
- [ ] Schedule module
- [ ] Booking module
- [ ] Testing

### Week 7-8: Finalization
- [ ] Complete migration
- [ ] Remove old code
- [ ] Documentation updates
- [ ] Performance optimization

## Getting Help

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for design details
- Check [docs/guides/best-practices.md](docs/guides/best-practices.md)
- Review completed modules (auth, station) as examples
- Ask team members for clarification

## Checklist

Before considering migration complete:

- [ ] All modules migrated
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Old code removed
- [ ] Team trained on new structure

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
**Status**: In Progress
