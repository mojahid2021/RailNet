# API Flow Diagrams

This document illustrates the complete request/response flows for major API operations in the RailNet backend system.

## General API Flow Pattern

All API requests follow this general pattern:

```
┌─────────┐                                           ┌──────────┐
│ Client  │                                           │ Database │
└────┬────┘                                           └─────┬────┘
     │                                                       │
     │ 1. HTTP Request                                      │
     │ ──────────────────────────────────────────────▶     │
     │                                                       │
     │              ┌──────────────────────┐               │
     │              │  Fastify Server      │               │
     │              └──────────┬───────────┘               │
     │                         │                            │
     │              2. Security Checks                      │
     │                 • Helmet                             │
     │                 • CORS                               │
     │                 • Rate Limit                         │
     │                         │                            │
     │              3. Authentication?                      │
     │              ┌──────────┴─────────┐                 │
     │         Yes  │                    │ No              │
     │              ▼                    ▼                  │
     │    ┌─────────────────┐   ┌──────────────┐          │
     │    │ JWT Middleware  │   │ Continue     │          │
     │    │ • Verify Token  │   │              │          │
     │    │ • Extract User  │   │              │          │
     │    └────────┬────────┘   └──────┬───────┘          │
     │             │                    │                  │
     │             └─────────┬──────────┘                  │
     │                       │                             │
     │              4. Request Validation                  │
     │                 • Zod Schemas                       │
     │                 • Type Checking                     │
     │                       │                             │
     │              5. Route Handler                       │
     │                 • Business Logic                    │
     │                       │                             │
     │              6. Database Operation                  │
     │                 ─────────────────────────────────▶  │
     │                       │                             │
     │              7. Database Response                   │
     │                 ◀─────────────────────────────────  │
     │                       │                             │
     │              8. Format Response                     │
     │                 • Response Handler                  │
     │                 • Error Handler                     │
     │                       │                             │
     │ 9. HTTP Response                                    │
     │ ◀──────────────────────────────────────────────    │
     │                                                     │
```

## Station Creation Flow

```
┌─────────┐                                           ┌──────────┐
│ Client  │                                           │ Database │
└────┬────┘                                           └─────┬────┘
     │                                                       │
     │ POST /api/v1/stations                                │
     │ Headers: Authorization: Bearer <token>               │
     │ Body: {name, city, district, ...}                    │
     │ ──────────────────────────────────────────────▶     │
     │                                                       │
     │       ┌────────────────────────────┐                 │
     │       │  1. Authentication Check   │                 │
     │       │  • Extract JWT token       │                 │
     │       │  • Verify signature        │                 │
     │       │  • Check expiration        │                 │
     │       │  • Attach admin to request │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  2. Request Validation     │                 │
     │       │  • Check required fields   │                 │
     │       │  • Validate data types     │                 │
     │       │  • Validate lat/long range │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  3. Create Station         │                 │
     │       │  • Prepare data            │                 │
     │       │  INSERT INTO Station       │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │                            │                  │
     │       │  4. Return Created Record  │                 │
     │       │  ◀─────────────────────────────────────────  │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  5. Format Response        │                 │
     │       │  {                         │                 │
     │       │    success: true,          │                 │
     │       │    message: "Created",     │                 │
     │       │    data: {...}             │                 │
     │       │  }                         │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │ 201 Created                                          │
     │ {success: true, data: {...}}                         │
     │ ◀──────────────────────────────────────────────     │
     │                                                       │
```

## Train Route Creation Flow (Complex)

```
┌─────────┐                                           ┌──────────┐
│ Client  │                                           │ Database │
└────┬────┘                                           └─────┬────┘
     │                                                       │
     │ POST /api/v1/train-routes                            │
     │ Body: {name, startStationId, endStationId,           │
     │        stations[], compartmentIds[]}                 │
     │ ──────────────────────────────────────────────▶     │
     │                                                       │
     │       ┌────────────────────────────┐                 │
     │       │  1. Authenticate Admin     │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  2. Validate Request       │                 │
     │       │  • Check all fields        │                 │
     │       │  • Validate arrays         │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  3. Check Start Station    │                 │
     │       │  SELECT * FROM Station     │                 │
     │       │  WHERE id = startStationId │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │                            │                  │
     │       │  Exists? ─────────────────┘                  │
     │       │  ◀─────────────────────────────────────────  │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  4. Check End Station      │                 │
     │       │  (Similar query)           │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │  ◀─────────────────────────────────────────  │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  5. Validate All Stations  │                 │
     │       │  in stations[] array       │                 │
     │       │  SELECT * FROM Station     │                 │
     │       │  WHERE id IN (...)         │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │  ◀─────────────────────────────────────────  │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  6. Validate Compartments  │                 │
     │       │  SELECT * FROM Compartment │                 │
     │       │  WHERE id IN (...)         │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │  ◀─────────────────────────────────────────  │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  7. Begin Transaction      │                 │
     │       │  BEGIN;                    │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │                            │                  │
     │       │  8. Create TrainRoute      │                 │
     │       │  INSERT INTO TrainRoute    │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │  ◀──── Route ID ───────────────────────────  │
     │       │                            │                  │
     │       │  9. Create Route Stations  │                 │
     │       │  INSERT INTO               │                 │
     │       │  TrainRouteStation (bulk)  │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │  ◀─────────────────────────────────────────  │
     │       │                            │                  │
     │       │  10. Link Compartments     │                 │
     │       │  INSERT INTO junction table│                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │  ◀─────────────────────────────────────────  │
     │       │                            │                  │
     │       │  11. Commit Transaction    │                 │
     │       │  COMMIT;                   │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │                            │                  │
     │       │  12. Fetch Complete Data   │                 │
     │       │  with relationships        │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │  ◀─────────────────────────────────────────  │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  13. Format Response       │                 │
     │       │  with all nested data      │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │ 201 Created                                          │
     │ {success: true, data: {route with stations}}         │
     │ ◀──────────────────────────────────────────────     │
     │                                                       │
```

## Login and Token Generation Flow

```
┌─────────┐                                           ┌──────────┐
│ Client  │                                           │ Database │
└────┬────┘                                           └─────┬────┘
     │                                                       │
     │ POST /api/v1/admin/login                             │
     │ Body: {email, password}                              │
     │ ──────────────────────────────────────────────▶     │
     │                                                       │
     │       ┌────────────────────────────┐                 │
     │       │  1. Validate Request       │                 │
     │       │  • Email format            │                 │
     │       │  • Required fields         │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  2. Find Admin by Email    │                 │
     │       │  SELECT * FROM Admin       │                 │
     │       │  WHERE email = ?           │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │                            │                  │
     │       │  3. Admin Found?           │                 │
     │       │  ◀─────────────────────────────────────────  │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │            ┌───────┴────────┐                        │
     │         No │                │ Yes                    │
     │            ▼                ▼                         │
     │   ┌─────────────┐   ┌──────────────┐               │
     │   │  Return 401 │   │ 4. Verify    │               │
     │   │  Invalid    │   │ Password Hash│               │
     │   │ Credentials │   │ bcrypt.      │               │
     │   └─────────────┘   │ compare()    │               │
     │                     └──────┬───────┘               │
     │                            │                        │
     │                    ┌───────┴────────┐              │
     │                No  │                │ Yes          │
     │                    ▼                ▼               │
     │           ┌─────────────┐   ┌──────────────────┐  │
     │           │  Return 401 │   │ 5. Generate JWT  │  │
     │           └─────────────┘   │ Token            │  │
     │                             │ jwt.sign({       │  │
     │                             │   id,            │  │
     │                             │   email,         │  │
     │                             │   type: "admin"  │  │
     │                             │ })               │  │
     │                             └──────┬───────────┘  │
     │                                    │              │
     │                     ┌──────────────▼─────────┐   │
     │                     │ 6. Format Response     │   │
     │                     │ {                      │   │
     │                     │   token: "jwt...",     │   │
     │                     │   admin: {...}         │   │
     │                     │ }                      │   │
     │                     └──────────┬─────────────┘   │
     │                                │                  │
     │ 200 OK                                            │
     │ {success: true, data: {token, admin}}             │
     │ ◀──────────────────────────────────────────────  │
     │                                                    │
     │ Client stores token                                │
     │                                                    │
```

## Update Operation Flow

```
┌─────────┐                                           ┌──────────┐
│ Client  │                                           │ Database │
└────┬────┘                                           └─────┬────┘
     │                                                       │
     │ PUT /api/v1/stations/:id                             │
     │ Headers: Authorization: Bearer <token>               │
     │ Body: {name: "Updated Name"}                         │
     │ ──────────────────────────────────────────────▶     │
     │                                                       │
     │       ┌────────────────────────────┐                 │
     │       │  1. Authenticate           │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  2. Validate Request       │                 │
     │       │  • Extract ID from params  │                 │
     │       │  • Validate update data    │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  3. Check Station Exists   │                 │
     │       │  SELECT * FROM Station     │                 │
     │       │  WHERE id = ?              │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │                            │                  │
     │       │  Found? ──────────────────┘                  │
     │       │  ◀─────────────────────────────────────────  │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │            ┌───────┴────────┐                        │
     │         No │                │ Yes                    │
     │            ▼                ▼                         │
     │   ┌─────────────┐   ┌──────────────┐               │
     │   │  Return 404 │   │ 4. Update    │               │
     │   │  Not Found  │   │ Station      │               │
     │   └─────────────┘   │ UPDATE       │               │
     │                     │ Station      │               │
     │                     │ SET ...      │               │
     │                     │ WHERE id = ? │               │
     │                     │ ────────────────────────────▶│
     │                     │              │                │
     │                     │ 5. Return    │                │
     │                     │ Updated      │                │
     │                     │ ◀────────────────────────────│
     │                     └──────┬───────┘                │
     │                            │                        │
     │              ┌─────────────▼──────────┐            │
     │              │ 6. Format Response     │            │
     │              │ {                      │            │
     │              │   success: true,       │            │
     │              │   message: "Updated",  │            │
     │              │   data: {...}          │            │
     │              │ }                      │            │
     │              └─────────────┬──────────┘            │
     │                            │                        │
     │ 200 OK                                              │
     │ {success: true, data: {...}}                        │
     │ ◀──────────────────────────────────────────────    │
     │                                                      │
```

## Error Handling Flow

```
┌─────────┐                                           ┌──────────┐
│ Client  │                                           │ Database │
└────┬────┘                                           └─────┬────┘
     │                                                       │
     │ Request                                              │
     │ ──────────────────────────────────────────────▶     │
     │                                                       │
     │       ┌────────────────────────────┐                 │
     │       │  Processing...             │                 │
     │       │                            │                 │
     │       │  Error Occurs!             │                 │
     │       │  • Validation Error        │                 │
     │       │  • Not Found               │                 │
     │       │  • Conflict                │                 │
     │       │  • Database Error          │                 │
     │       │  • Unexpected Error        │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │                    ▼                                  │
     │       ┌────────────────────────────┐                 │
     │       │  Error Handler             │                 │
     │       │  ────────────────          │                 │
     │       │                            │                 │
     │       │  Is it AppError?           │                 │
     │       │  ┌──────────┴──────────┐   │                 │
     │       │  │ Yes              No │   │                 │
     │       │  ▼                    ▼ │   │                 │
     │       │ ┌────────┐  ┌──────────┐│   │                 │
     │       │ │Use     │  │ 500      ││   │                 │
     │       │ │defined │  │ Internal ││   │                 │
     │       │ │status  │  │ Server   ││   │                 │
     │       │ │& msg   │  │ Error    ││   │                 │
     │       │ └────┬───┘  └─────┬────┘│   │                 │
     │       │      └──────┬─────┘     │   │                 │
     │       │             ▼           │   │                 │
     │       │   ┌──────────────────┐ │   │                 │
     │       │   │ Log Error        │ │   │                 │
     │       │   │ (if unexpected)  │ │   │                 │
     │       │   └──────┬───────────┘ │   │                 │
     │       │          ▼             │   │                 │
     │       │   ┌──────────────────┐ │   │                 │
     │       │   │ Format Response  │ │   │                 │
     │       │   │ {                │ │   │                 │
     │       │   │  success: false, │ │   │                 │
     │       │   │  error: "..."    │ │   │                 │
     │       │   │ }                │ │   │                 │
     │       │   └──────┬───────────┘ │   │                 │
     │       └──────────┴─────────────┘   │                 │
     │                  │                  │                 │
     │ Error Response (4xx/5xx)                             │
     │ {success: false, error: "..."}                       │
     │ ◀──────────────────────────────────────────────     │
     │                                                       │
```

## Rate Limiting Flow

```
┌─────────┐                                           ┌──────────┐
│ Client  │                                           │  Redis   │
└────┬────┘                                           │ (Memory) │
     │                                                 └─────┬────┘
     │ Request                                              │
     │ ──────────────────────────────────────────────▶     │
     │                                                       │
     │       ┌────────────────────────────┐                 │
     │       │  Rate Limit Middleware     │                 │
     │       │  ────────────────────────  │                 │
     │       │                            │                 │
     │       │  1. Get Client IP          │                 │
     │       │                            │                 │
     │       │  2. Check Request Count    │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │                            │                  │
     │       │  3. Current Count?         │                 │
     │       │  ◀─────────────────────────────────────────  │
     │       │                            │                  │
     │       │  4. Exceeds Limit?         │                 │
     │       │  ┌──────────┴──────────┐   │                 │
     │       │  │ Yes              No │   │                 │
     │       │  ▼                    ▼ │   │                 │
     │       │ ┌────────┐  ┌──────────┐│   │                 │
     │       │ │Return  │  │ Increment││   │                 │
     │       │ │429 Too │  │ Counter  ││   │                 │
     │       │ │Many    │  │ Continue ││   │                 │
     │       │ │Requests│  │ Request  ││   │                 │
     │       │ └────────┘  └──────────┘│   │                 │
     │       └─────────────────────────┘   │                 │
     │                                      │                 │
```

## Pagination Flow

```
┌─────────┐                                           ┌──────────┐
│ Client  │                                           │ Database │
└────┬────┘                                           └─────┬────┘
     │                                                       │
     │ GET /api/v1/stations?page=2&limit=10                 │
     │ ──────────────────────────────────────────────▶     │
     │                                                       │
     │       ┌────────────────────────────┐                 │
     │       │  1. Parse Query Params     │                 │
     │       │  • page = 2                │                 │
     │       │  • limit = 10              │                 │
     │       │  • Calculate skip = 10     │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  2. Query with Pagination  │                 │
     │       │  SELECT * FROM Station     │                 │
     │       │  ORDER BY createdAt DESC   │                 │
     │       │  LIMIT 10 OFFSET 10        │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │                            │                  │
     │       │  3. Get Results (10 items) │                 │
     │       │  ◀─────────────────────────────────────────  │
     │       │                            │                  │
     │       │  4. Count Total Records    │                 │
     │       │  SELECT COUNT(*) FROM      │                 │
     │       │  Station                   │                 │
     │       │  ─────────────────────────────────────────▶  │
     │       │                            │                  │
     │       │  5. Total = 45             │                 │
     │       │  ◀─────────────────────────────────────────  │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │       ┌────────────▼───────────────┐                 │
     │       │  6. Format Response        │                 │
     │       │  {                         │                 │
     │       │    data: [...],            │                 │
     │       │    pagination: {           │                 │
     │       │      page: 2,              │                 │
     │       │      limit: 10,            │                 │
     │       │      total: 45,            │                 │
     │       │      pages: 5              │                 │
     │       │    }                       │                 │
     │       │  }                         │                 │
     │       └────────────┬───────────────┘                 │
     │                    │                                  │
     │ 200 OK                                               │
     │ {data: [...], pagination: {...}}                     │
     │ ◀──────────────────────────────────────────────     │
     │                                                       │
```

## Related Documentation
- [System Architecture](system-architecture.md)
- [Database Schema](database-schema.md)
- [Authentication Flow](authentication-flow.md)
- [All API Documentation](../api/)

---

**Last Updated**: 2025-11-24
