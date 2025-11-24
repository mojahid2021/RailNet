# Database Management Guide

This guide covers database setup, migrations, management, and best practices for the RailNet backend PostgreSQL database.

## Database Overview

- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Schema Location**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`

## Setup

### PostgreSQL Installation

#### macOS
```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb railnet
```

#### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb railnet
```

#### Windows
1. Download from https://www.postgresql.org/download/windows/
2. Run installer
3. Use pgAdmin or command line to create database

#### Docker
```bash
docker run --name railnet-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=railnet \
  -p 5432:5432 \
  -d postgres:14

# Connect to database
docker exec -it railnet-postgres psql -U postgres -d railnet
```

### Database Configuration

Set the DATABASE_URL in your `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/railnet?schema=public"
```

**Format Breakdown**:
```
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

## Prisma Schema

### Schema Location
All database models are defined in `prisma/schema.prisma`

### Key Components

#### Generator Configuration
```prisma
generator client {
  provider = "prisma-client-js"
}
```

#### Database Connection
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Model Definition Example
```prisma
model Station {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  city      String
  district  String
  division  String
  latitude  Float
  longitude Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  startRoutes TrainRoute[] @relation("StartStation")
  endRoutes   TrainRoute[] @relation("EndStation")
}
```

## Prisma Commands

### Generate Client

Generate Prisma Client after schema changes:

```bash
# Using npm script
npm run db:generate

# Or directly
npx prisma generate
```

This creates the type-safe Prisma Client in `node_modules/@prisma/client/`.

### Push Schema

Push schema changes to database without creating migrations (useful for development):

```bash
# Using npm script
npm run db:push

# Or directly
npx prisma db push
```

**When to use**:
- Rapid prototyping
- Development environment
- Schema experimentation

**Warning**: This can result in data loss! Use migrations for production.

### Create Migration

Create a new migration from schema changes:

```bash
# Create and apply migration
npx prisma migrate dev --name add_user_table

# Create migration without applying
npx prisma migrate dev --create-only --name add_user_table
```

**Migration naming conventions**:
- `add_user_table`
- `update_station_fields`
- `remove_old_index`
- Use descriptive names

### Apply Migrations

Apply pending migrations to the database:

```bash
# Production deployment
npx prisma migrate deploy

# Development (creates migration if needed)
npx prisma migrate dev
```

### Migration Status

Check migration status:

```bash
npx prisma migrate status
```

Output shows:
- Applied migrations
- Pending migrations
- Schema drift

### Reset Database

**⚠️ WARNING: This deletes all data!**

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Apply all migrations
4. Run seed script (if configured)

## Prisma Studio

Prisma Studio is a visual database browser.

### Launch Studio

```bash
# Using npm script
npm run db:studio

# Or directly
npx prisma studio
```

Opens browser at http://localhost:5555

### Features
- View all tables and data
- Edit records directly
- Filter and search
- View relationships
- Create new records

## Database Operations

### Querying Data

#### Find Unique
```typescript
const station = await prisma.station.findUnique({
  where: { id: stationId }
});
```

#### Find Many
```typescript
const stations = await prisma.station.findMany({
  where: { city: 'Dhaka' },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

#### Find with Relations
```typescript
const train = await prisma.train.findUnique({
  where: { id: trainId },
  include: {
    trainRoute: true,
    compartments: {
      include: {
        compartment: true
      }
    }
  }
});
```

### Creating Data

#### Create Single
```typescript
const station = await prisma.station.create({
  data: {
    name: 'Dhaka Station',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'Dhaka',
    latitude: 23.7104,
    longitude: 90.4074
  }
});
```

#### Create Many
```typescript
await prisma.station.createMany({
  data: [
    { name: 'Station 1', city: 'City 1', /* ... */ },
    { name: 'Station 2', city: 'City 2', /* ... */ },
  ],
  skipDuplicates: true // Skip records that violate unique constraints
});
```

### Updating Data

#### Update Single
```typescript
const station = await prisma.station.update({
  where: { id: stationId },
  data: {
    name: 'Updated Name'
  }
});
```

#### Update Many
```typescript
await prisma.station.updateMany({
  where: { city: 'Dhaka' },
  data: {
    division: 'Dhaka Division'
  }
});
```

### Deleting Data

#### Delete Single
```typescript
await prisma.station.delete({
  where: { id: stationId }
});
```

#### Delete Many
```typescript
await prisma.station.deleteMany({
  where: { city: 'TestCity' }
});
```

### Transactions

#### Sequential Operations
```typescript
const result = await prisma.$transaction(async (tx) => {
  // All operations must succeed or all will rollback
  const route = await tx.trainRoute.create({
    data: routeData
  });

  await tx.trainRouteStation.createMany({
    data: stationsData.map(s => ({
      ...s,
      trainRouteId: route.id
    }))
  });

  return route;
});
```

#### Independent Operations
```typescript
// Both must succeed or both rollback
const [admin, station] = await prisma.$transaction([
  prisma.admin.create({ data: adminData }),
  prisma.station.create({ data: stationData })
]);
```

## Schema Modifications

### Adding a Field

1. **Edit schema**:
```prisma
model Station {
  // ... existing fields
  timezone String @default("UTC") // New field
}
```

2. **Create migration**:
```bash
npx prisma migrate dev --name add_station_timezone
```

3. **Update TypeScript code** to use new field

### Modifying a Field

1. **Edit schema**:
```prisma
model Station {
  name String @db.VarChar(500) // Changed from default
}
```

2. **Create migration**:
```bash
npx prisma migrate dev --name update_station_name_length
```

**Note**: May require data migration if incompatible change

### Adding a Relation

1. **Edit schema**:
```prisma
model Station {
  // ... existing fields
  schedules Schedule[] // New relation
}

model Schedule {
  id        String  @id @default(uuid())
  stationId String
  station   Station @relation(fields: [stationId], references: [id])
}
```

2. **Create migration**:
```bash
npx prisma migrate dev --name add_schedule_model
```

### Removing a Field

1. **Edit schema** (remove the field)

2. **Create migration**:
```bash
npx prisma migrate dev --name remove_station_old_field
```

**Warning**: This will delete data! Backup first.

## Backup and Restore

### Backup Database

#### Full Backup
```bash
# Backup to file
pg_dump -U postgres -d railnet -F c -f backup.dump

# Backup to SQL file
pg_dump -U postgres -d railnet -f backup.sql
```

#### Backup with Docker
```bash
docker exec railnet-postgres pg_dump -U postgres railnet > backup.sql
```

### Restore Database

#### From Custom Format
```bash
pg_restore -U postgres -d railnet_new -F c backup.dump
```

#### From SQL File
```bash
psql -U postgres -d railnet_new -f backup.sql
```

#### Restore with Docker
```bash
docker exec -i railnet-postgres psql -U postgres railnet < backup.sql
```

### Automated Backups

Create a backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
BACKUP_FILE="$BACKUP_DIR/railnet_$DATE.dump"

pg_dump -U postgres -d railnet -F c -f "$BACKUP_FILE"

# Keep only last 7 days
find $BACKUP_DIR -name "railnet_*.dump" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

Schedule with cron:
```cron
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## Database Maintenance

### Analyze Query Performance

```sql
-- Explain query execution
EXPLAIN ANALYZE SELECT * FROM "Station" WHERE city = 'Dhaka';

-- View slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Vacuum Database

```bash
# Analyze tables
psql -U postgres -d railnet -c "VACUUM ANALYZE;"

# Full vacuum (requires more locks)
psql -U postgres -d railnet -c "VACUUM FULL;"
```

### Reindex

```bash
# Reindex a table
psql -U postgres -d railnet -c "REINDEX TABLE \"Station\";"

# Reindex entire database
psql -U postgres -d railnet -c "REINDEX DATABASE railnet;"
```

### Check Database Size

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('railnet'));

-- Table sizes
SELECT 
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

## Common Issues

### Issue 1: Connection Refused

**Problem**: Can't connect to PostgreSQL

**Solutions**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check port
netstat -an | grep 5432
```

### Issue 2: Authentication Failed

**Problem**: Password authentication failed

**Solutions**:
1. Check username/password in DATABASE_URL
2. Check `pg_hba.conf` for authentication method
3. Reset password:
```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD 'newpassword';
```

### Issue 3: Migration Out of Sync

**Problem**: Migrations don't match database state

**Solutions**:
```bash
# Check status
npx prisma migrate status

# Resolve by re-syncing (development only)
npx prisma migrate resolve --applied <migration_name>

# Or reset (deletes data!)
npx prisma migrate reset
```

### Issue 4: Schema Drift

**Problem**: Database schema doesn't match Prisma schema

**Solutions**:
```bash
# Development only: Push current schema
npx prisma db push

# Production: Create migration first, test on staging, then deploy
npx prisma migrate dev --create-only --name fix_schema_drift
# Review and test migration
npx prisma migrate deploy
```

## Best Practices

### 1. Always Use Migrations in Production

```bash
# ❌ DON'T use in production
npx prisma db push

# ✅ DO use migrations
npx prisma migrate deploy
```

### 2. Backup Before Migrations

```bash
# Create backup
pg_dump -U postgres -d railnet -F c -f pre_migration_backup.dump

# Apply migration
npx prisma migrate deploy

# If issues, restore
pg_restore -U postgres -d railnet -F c pre_migration_backup.dump
```

### 3. Test Migrations on Staging

1. Apply migration to staging database
2. Test thoroughly
3. Apply to production

### 4. Use Transactions for Data Migrations

```typescript
// Data migration example
async function migrateData() {
  await prisma.$transaction(async (tx) => {
    // Complex data transformation
    const oldRecords = await tx.oldTable.findMany();
    
    for (const record of oldRecords) {
      await tx.newTable.create({
        data: transformRecord(record)
      });
    }
  });
}
```

### 5. Index Frequently Queried Fields

```prisma
model Station {
  id   String @id @default(uuid())
  code String @unique // Automatically indexed
  name String
  
  @@index([name]) // Explicit index
  @@index([city, district]) // Composite index
}
```

### 6. Use Connection Pooling

```typescript
// Configure in Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection pool size via DATABASE_URL
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
```

## Useful PostgreSQL Commands

### Database Operations
```sql
-- List databases
\l

-- Connect to database
\c railnet

-- List tables
\dt

-- Describe table
\d "Station"

-- List indexes
\di

-- Show table sizes
\dt+

-- Quit
\q
```

### Query Shortcuts
```sql
-- Current database
SELECT current_database();

-- All tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Row counts
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

## Related Documentation
- [Database Schema](../workflows/database-schema.md)
- [System Architecture](../workflows/system-architecture.md)
- [Getting Started Guide](getting-started.md)
- [Environment Configuration](environment-configuration.md)

---

**Last Updated**: 2025-11-24
