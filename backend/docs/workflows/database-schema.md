# Database Schema Documentation

This document provides a comprehensive overview of the RailNet backend database schema, including all tables, relationships, and constraints.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐                    ┌──────────────────┐
│      Admin       │                    │     Station      │
├──────────────────┤                    ├──────────────────┤
│ id (PK)          │                    │ id (PK)          │
│ firstName        │                    │ name             │
│ lastName         │                    │ city             │
│ email (UNIQUE)   │                    │ district         │
│ password         │                    │ division         │
│ createdAt        │                    │ latitude         │
│ updatedAt        │                    │ longitude        │
└──────────────────┘                    │ createdAt        │
                                        │ updatedAt        │
                                        └────────┬─────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────┐
                    │                            │                    │
                    │ startRoutes                │ endRoutes          │ routeStations
                    │                            │                    │
                    ▼                            ▼                    ▼
         ┌──────────────────┐         ┌──────────────────────────────────┐
         │   TrainRoute     │         │      TrainRouteStation           │
         ├──────────────────┤         ├──────────────────────────────────┤
         │ id (PK)          │◀───────┤ id (PK)                          │
         │ name             │         │ trainRouteId (FK)                │
         │ totalDistance    │         │ currentStationId (FK)            │
         │ startStationId(FK)│         │ beforeStationId (FK, nullable)   │
         │ endStationId (FK)│         │ nextStationId (FK, nullable)     │
         │ createdAt        │         │ distance                         │
         │ updatedAt        │         │ distanceFromStart                │
         └────────┬─────────┘         └──────────────────────────────────┘
                  │                                     │
                  │ trains                              │
                  │                                     │
                  ▼                                     │
         ┌──────────────────┐                          │
         │      Train       │                          │
         ├──────────────────┤                          │
         │ id (PK)          │                          │
         │ name             │                          │
         │ number (UNIQUE)  │                          │
         │ type             │                          │
         │ trainRouteId(FK) │                          │
         │ createdAt        │                          │
         │ updatedAt        │                          │
         └────────┬─────────┘                          │
                  │                                     │
                  │ compartments                        │
                  │                                     │
                  ▼                                     │
         ┌──────────────────────┐                      │
         │  TrainCompartment    │                      │
         │  (Junction Table)    │                      │
         ├──────────────────────┤                      │
         │ id (PK)              │                      │
         │ trainId (FK)         │                      │
         │ compartmentId (FK)   │                      │
         └──────────┬───────────┘                      │
                    │                                   │
                    │                                   │
                    ▼                                   │
         ┌──────────────────┐                          │
         │   Compartment    │                          │
         ├──────────────────┤                          │
         │ id (PK)          │                          │
         │ name             │                          │
         │ type             │                          │
         │ price            │                          │
         │ totalSeat        │                          │
         │ createdAt        │                          │
         │ updatedAt        │                          │
         └──────────────────┘                          │

Legend:
  PK = Primary Key
  FK = Foreign Key
  ──▶ = One-to-Many Relationship
  ◀──▶ = Many-to-Many Relationship (via junction table)
```

## Tables

### 1. Admin
Stores admin user accounts with authentication credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | Unique admin identifier |
| firstName | String | NOT NULL | Admin's first name |
| lastName | String | NOT NULL | Admin's last name |
| email | String | NOT NULL, UNIQUE | Admin email (login credential) |
| password | String | NOT NULL | Hashed password (bcrypt) |
| createdAt | DateTime | DEFAULT now() | Account creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last modification timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `email`

**Business Rules:**
- Email must be unique across all admins
- Password is hashed using bcrypt with 10 salt rounds
- Email format validated before storage

---

### 2. Station
Railway stations with geographic location data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | Unique station identifier |
| name | String | NOT NULL | Station name |
| city | String | NOT NULL | City name |
| district | String | NOT NULL | District name |
| division | String | NOT NULL | Division/state name |
| latitude | Float | NOT NULL | Geographic latitude |
| longitude | Float | NOT NULL | Geographic longitude |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last modification timestamp |

**Indexes:**
- Primary Key: `id`

**Relationships:**
- Has many `TrainRoute` as start station (1:N)
- Has many `TrainRoute` as end station (1:N)
- Has many `TrainRouteStation` (1:N)

**Business Rules:**
- Latitude range: -90 to 90
- Longitude range: -180 to 180
- Used for distance calculations and map visualization

---

### 3. TrainRoute
Defines routes between stations with total distance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | Unique route identifier |
| name | String | NOT NULL | Route name/description |
| totalDistance | Float | NOT NULL | Total route distance (km) |
| startStationId | UUID | NOT NULL, FOREIGN KEY | Starting station ID |
| endStationId | UUID | NOT NULL, FOREIGN KEY | Ending station ID |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last modification timestamp |

**Indexes:**
- Primary Key: `id`
- Foreign Key: `startStationId` → Station(id)
- Foreign Key: `endStationId` → Station(id)

**Relationships:**
- Belongs to `Station` (start station) (N:1)
- Belongs to `Station` (end station) (N:1)
- Has many `TrainRouteStation` (1:N, cascade delete)
- Has many `Train` (1:N)

**Business Rules:**
- Start and end stations must be different
- Total distance must match cumulative station distances
- Deleting a route cascades to route stations

---

### 4. TrainRouteStation
Ordered sequence of stations in a train route.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | Unique identifier |
| trainRouteId | UUID | NOT NULL, FOREIGN KEY | Parent route ID |
| currentStationId | UUID | NOT NULL, FOREIGN KEY | Current station in sequence |
| beforeStationId | UUID | NULLABLE, FOREIGN KEY | Previous station (null for first) |
| nextStationId | UUID | NULLABLE, FOREIGN KEY | Next station (null for last) |
| distance | Float | NOT NULL | Distance from previous station (km) |
| distanceFromStart | Float | NOT NULL | Cumulative distance from start (km) |

**Indexes:**
- Primary Key: `id`
- Unique Composite: `(trainRouteId, currentStationId)`
- Foreign Keys:
  - `trainRouteId` → TrainRoute(id) ON DELETE CASCADE
  - `currentStationId` → Station(id)
  - `beforeStationId` → Station(id)
  - `nextStationId` → Station(id)

**Relationships:**
- Belongs to `TrainRoute` (N:1, cascade delete)
- Belongs to `Station` (current) (N:1)
- Belongs to `Station` (before) (N:1, optional)
- Belongs to `Station` (next) (N:1, optional)

**Business Rules:**
- First station: `beforeStationId` is null, `distance` is 0
- Last station: `nextStationId` is null
- Middle stations: both before and next are populated
- `distanceFromStart` increases monotonically
- Unique combination of route and station

---

### 5. Compartment
Train compartment/coach types with pricing and capacity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | Unique compartment type ID |
| name | String | NOT NULL | Display name (e.g., "AC Sleeper") |
| type | String | NOT NULL | Type identifier (e.g., "AC_SLEEPER") |
| price | Float | NOT NULL | Base price per seat |
| totalSeat | Int | NOT NULL | Total seats in compartment |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last modification timestamp |

**Indexes:**
- Primary Key: `id`

**Relationships:**
- Has many `TrainCompartment` (1:N, cascade delete)

**Business Rules:**
- Price must be positive
- Total seats must be positive integer
- Same compartment type can be assigned to multiple trains

---

### 6. Train
Train entities with identification and type.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | Unique train identifier |
| name | String | NOT NULL | Train name |
| number | String | NOT NULL, UNIQUE | Train number (e.g., "701") |
| type | String | NOT NULL | Train category |
| trainRouteId | UUID | NULLABLE, FOREIGN KEY | Assigned route ID |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last modification timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `number`
- Foreign Key: `trainRouteId` → TrainRoute(id)

**Relationships:**
- Belongs to `TrainRoute` (N:1, optional)
- Has many `TrainCompartment` (1:N, cascade delete)

**Business Rules:**
- Train number must be unique
- Route assignment is optional
- Deleting train cascades to compartment assignments

---

### 7. TrainCompartment
Junction table linking trains to compartments (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | Unique identifier |
| trainId | UUID | NOT NULL, FOREIGN KEY | Train ID |
| compartmentId | UUID | NOT NULL, FOREIGN KEY | Compartment type ID |

**Indexes:**
- Primary Key: `id`
- Unique Composite: `(trainId, compartmentId)`
- Foreign Keys:
  - `trainId` → Train(id) ON DELETE CASCADE
  - `compartmentId` → Compartment(id) ON DELETE CASCADE

**Relationships:**
- Belongs to `Train` (N:1, cascade delete)
- Belongs to `Compartment` (N:1, cascade delete)

**Business Rules:**
- Same compartment can be added multiple times to different trains
- Prevents duplicate compartment assignments to same train
- Cascade deletes when train or compartment is deleted

---

## Relationships Summary

### One-to-Many Relationships
1. **Station → TrainRoute (startStation)**
   - One station can be the start of multiple routes
   - Foreign Key: `TrainRoute.startStationId`

2. **Station → TrainRoute (endStation)**
   - One station can be the end of multiple routes
   - Foreign Key: `TrainRoute.endStationId`

3. **Station → TrainRouteStation**
   - One station appears in multiple route sequences
   - Foreign Key: `TrainRouteStation.currentStationId`

4. **TrainRoute → TrainRouteStation**
   - One route has multiple stations in sequence
   - Foreign Key: `TrainRouteStation.trainRouteId`
   - Cascade Delete: Yes

5. **TrainRoute → Train**
   - One route can be assigned to multiple trains
   - Foreign Key: `Train.trainRouteId`

6. **Train → TrainCompartment**
   - One train has multiple compartments
   - Foreign Key: `TrainCompartment.trainId`
   - Cascade Delete: Yes

7. **Compartment → TrainCompartment**
   - One compartment type used by multiple trains
   - Foreign Key: `TrainCompartment.compartmentId`
   - Cascade Delete: Yes

### Many-to-Many Relationships
1. **Train ↔ Compartment** (via TrainCompartment)
   - Junction table: `TrainCompartment`
   - Enables flexible train composition

## Data Integrity Constraints

### Primary Keys
- All tables use UUID as primary key
- Auto-generated using database default

### Unique Constraints
- `Admin.email`: Prevents duplicate admin accounts
- `Train.number`: Ensures unique train identification
- `TrainRouteStation(trainRouteId, currentStationId)`: Prevents duplicate stations in route
- `TrainCompartment(trainId, compartmentId)`: Prevents duplicate compartment assignments

### Foreign Key Constraints
All foreign keys enforce referential integrity with appropriate cascade behaviors.

### Cascade Delete Rules
- `TrainRoute` deleted → `TrainRouteStation` records deleted
- `Train` deleted → `TrainCompartment` records deleted
- `Compartment` deleted → `TrainCompartment` records deleted

## Indexing Strategy

### Current Indexes
1. **Primary Keys**: Automatic B-tree indexes on all `id` columns
2. **Unique Constraints**: Automatic indexes on unique columns
3. **Foreign Keys**: Prisma creates indexes on foreign key columns

### Recommended Additional Indexes (Future)
```sql
-- For station searches by location
CREATE INDEX idx_station_location ON Station(latitude, longitude);

-- For route queries
CREATE INDEX idx_train_route_stations ON TrainRoute(startStationId, endStationId);

-- For route station ordering
CREATE INDEX idx_route_station_order ON TrainRouteStation(trainRouteId, distanceFromStart);

-- For train searches
CREATE INDEX idx_train_type ON Train(type);
CREATE INDEX idx_train_route ON Train(trainRouteId);
```

## Database Statistics

### Current Schema Size
- **7 Tables**
- **3 Junction Tables** (many-to-many relationships)
- **10+ Indexes** (including auto-generated)
- **Multiple Foreign Key Constraints**

### Storage Estimates (per 1000 records)
- Stations: ~100 KB
- Routes: ~50 KB
- Route Stations: ~200 KB (assuming 5 stations/route)
- Trains: ~80 KB
- Compartments: ~40 KB
- Admins: ~60 KB

## Migration Management

### Prisma Migrations
All schema changes are managed through Prisma migrations:

```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# View migration status
npx prisma migrate status
```

### Current Migrations
Located in `prisma/migrations/` directory, tracking all schema changes.

## Database Backup Strategy

### Recommended Practices
1. **Daily Backups**: Full database backup
2. **Point-in-Time Recovery**: Enable WAL archiving
3. **Replication**: Setup read replicas
4. **Monitoring**: Track database performance and size

## Related Documentation
- [System Architecture](system-architecture.md)
- [API Documentation](../api/)
- [Database Guide](../guides/database-guide.md)

---

**Last Updated**: 2025-11-24
