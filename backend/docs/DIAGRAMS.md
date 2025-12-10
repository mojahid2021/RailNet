# RailNet Backend - UML and Activity Diagrams

This directory contains comprehensive UML and activity diagrams for the RailNet backend system. These diagrams provide visual documentation of the system architecture, data models, and key business processes.

## Table of Contents

- [Overview](#overview)
- [Diagram Files](#diagram-files)
- [UML Class Diagram](#uml-class-diagram)
- [Database Entity-Relationship Diagram](#database-entity-relationship-diagram)
- [System Architecture Diagram](#system-architecture-diagram)
- [Activity Diagrams](#activity-diagrams)
  - [Authentication Flow](#authentication-flow)
  - [Ticket Booking Flow](#ticket-booking-flow)
  - [Payment Processing Flow](#payment-processing-flow)
  - [Booking Cleanup Flow](#booking-cleanup-flow)
  - [Train Search and Seat Availability Flow](#train-search-and-seat-availability-flow)
- [How to View Diagrams](#how-to-view-diagrams)
- [Diagram Notation Guide](#diagram-notation-guide)

## Overview

The RailNet backend is a comprehensive railway management system built with:
- **Framework**: Fastify (Node.js/TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role-based access control
- **Payment Gateway**: SSLCommerz integration
- **Architecture**: RESTful API with service layer pattern

## Diagram Files

This directory contains the following diagram files in PlantUML format (`.puml`):

1. **uml-class-diagram.puml** - Complete class diagram showing all models, services, and route handlers
2. **database-erd-diagram.puml** - Entity-Relationship Diagram (ERD) for the database schema
3. **system-architecture-diagram.puml** - High-level system architecture and component interaction
4. **activity-diagram-authentication.puml** - User authentication and registration flow
5. **activity-diagram-ticket-booking.puml** - Ticket booking process with seat reservation
6. **activity-diagram-payment-processing.puml** - SSLCommerz payment integration flow
7. **activity-diagram-booking-cleanup.puml** - Automated booking expiration and cleanup
8. **activity-diagram-train-search.puml** - Train search and seat availability checking

## UML Class Diagram

**File**: `uml-class-diagram.puml`

The class diagram provides a complete overview of the system architecture, including:

### Data Models (Prisma Schema)
The diagram shows all database entities and their relationships:

#### Core Entities
- **User**: System users (passengers and admins) with authentication
- **Station**: Railway stations with geographical coordinates
- **TrainRoute**: Defines train paths between stations
- **RouteStation**: Intermediate stations in a route with distances
- **Compartment**: Train compartment types (class, type, pricing)
- **Train**: Physical trains with associated routes and compartments
- **TrainCompartment**: Junction table linking trains and compartments
- **Seat**: Individual seats within compartments
- **TrainSchedule**: Daily train schedules with timing
- **ScheduleStation**: Station-specific arrival/departure times
- **Ticket**: Passenger bookings with journey details
- **PaymentTransaction**: SSLCommerz payment records
- **PaymentLog**: Audit trail for payment events
- **CompartmentBooking**: Tracks seat availability per schedule

#### Key Relationships
- One-to-Many: User → Tickets, Train → Schedules, TrainSchedule → Tickets
- Many-to-Many: Trains ↔ Compartments (through TrainCompartment)
- One-to-One: Ticket ↔ Seat, Ticket ↔ PaymentTransaction
- Complex: Station relationships through routes and schedules

### Service Layer
Business logic services that orchestrate operations:

- **PaymentService**: Handles SSLCommerz payment gateway integration
  - Payment initiation
  - Success/Fail/Cancel callbacks
  - IPN (Instant Payment Notification) handling
  - Payment validation

- **BookingCleanupService**: Manages expired booking cleanup
  - Identifies expired tickets
  - Cancels associated transactions
  - Frees up seats
  - Provides cleanup statistics

- **CleanupJobs**: Scheduled background tasks
  - Runs cleanup every 5 minutes
  - Logs statistics every 10 minutes
  - Automated resource management

### Route Handlers
RESTful API endpoints organized by domain:

- **AuthRoutes**: User registration and login
- **StationRoutes**: Station CRUD operations
- **TrainRouteRoutes**: Route management
- **CompartmentRoutes**: Compartment type management
- **TrainRoutes**: Train assembly and management
- **TrainScheduleRoutes**: Schedule creation and train search
- **TicketRoutes**: Ticket booking and cancellation
- **PaymentRoutes**: Payment processing and callbacks

### Utilities
Supporting infrastructure:

- **SSLCommerzClient**: HTTP client for payment gateway API
- **PrismaClient**: Database ORM interface

## Database Entity-Relationship Diagram

**File**: `database-erd-diagram.puml`

The ERD provides a detailed view of the database schema with all tables, columns, data types, primary keys, foreign keys, and relationships.

### Key Features
- **Primary Keys (PK)**: Unique identifiers for each table
- **Foreign Keys (FK)**: Relationships between tables
- **Unique Constraints**: Prevent duplicate data
- **Composite Unique Constraints**: Ensure uniqueness across multiple columns

### Table Groups

#### User & Authentication
- **User**: User accounts with role-based access (user/admin)

#### Station & Route Management
- **Station**: Railway stations with geo-coordinates
- **TrainRoute**: Routes connecting start and end stations
- **RouteStation**: Intermediate stations forming route path with distances

#### Train Configuration
- **Compartment**: Compartment types (class, type, pricing, capacity)
- **Train**: Physical trains with unique numbers
- **TrainCompartment**: Junction table linking trains to compartments
- **Seat**: Individual seats (created on-demand during booking)

#### Scheduling
- **TrainSchedule**: Daily train schedules (one per train per date)
- **ScheduleStation**: Station-specific arrival/departure times

#### Booking & Payment
- **Ticket**: Passenger bookings with journey details and status
- **PaymentTransaction**: SSLCommerz payment records (one per ticket)
- **PaymentLog**: Audit trail for payment events
- **CompartmentBooking**: Aggregate seat availability tracking

### Important Business Rules
1. **Unique Constraints**:
   - One schedule per train per date
   - Unique seat numbers per compartment
   - One payment transaction per ticket
   - Unique email addresses

2. **Cascading Deletes**:
   - Deleting a TrainRoute removes all RouteStations
   - Deleting a Train removes all TrainCompartments
   - Deleting a Ticket removes associated Seats and PaymentTransactions

3. **Referential Integrity**:
   - All foreign keys enforce valid references
   - Prevents orphaned records
   - Maintains data consistency

## System Architecture Diagram

**File**: `system-architecture-diagram.puml`

The system architecture diagram shows the high-level component structure and data flow through the system.

### Architecture Layers

#### Client Layer
- **Android App**: Native mobile application
- **Web Dashboard**: Browser-based admin interface
- **Admin Panel**: System administration tools

#### API Layer (Fastify Middleware)
- **JWT Middleware**: Token validation and authentication
- **Rate Limiter**: Request throttling (100 req/min)
- **CORS**: Cross-origin resource sharing
- **Swagger/OpenAPI**: API documentation

#### Route Handler Layer
Organized by domain:
- Auth, Station, Train, Schedule, Ticket, Payment routes

#### Service Layer
Business logic services:
- **Payment Service**: SSLCommerz integration
- **Cleanup Service**: Expired booking management
- **Cleanup Jobs**: Background schedulers

#### Data Layer
- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Relational database

#### External Services
- **SSLCommerz**: Payment gateway for secure transactions

### Data Flow
1. Client sends HTTPS requests with JWT tokens
2. API layer validates and routes requests
3. Route handlers process business logic
4. Services orchestrate complex operations
5. Prisma ORM executes database queries
6. Background jobs run scheduled tasks
7. External services handle payments

## Activity Diagrams

Activity diagrams illustrate the step-by-step flow of key business processes.

### Authentication Flow

**File**: `activity-diagram-authentication.puml`

**Process**: User registration and login

**Key Steps**:
1. User submits credentials (email/password)
2. System validates request type (register vs login)
3. **Registration Path**:
   - Check if email already exists
   - Hash password using bcrypt
   - Create user record in database
   - Generate JWT token
4. **Login Path**:
   - Verify user exists
   - Compare password hashes
   - Generate JWT token
5. Return user data and authentication token

**Security Features**:
- Password hashing with bcrypt
- JWT tokens with expiration
- Role-based access control (user/admin)
- Duplicate email prevention

### Ticket Booking Flow

**File**: `activity-diagram-ticket-booking.puml`

**Process**: Complete ticket booking with seat reservation

**Key Steps**:
1. User selects train schedule and compartment
2. User enters passenger details and seat number
3. System verifies JWT authentication
4. **Database Transaction** (ensures atomicity):
   - Validate schedule exists
   - Verify station sequence in route
   - Check compartment availability
   - Verify seat not already booked
   - Check total capacity not exceeded
   - Calculate journey distance and price
   - Create seat record
   - Generate unique ticket ID
   - Create ticket with pending status
   - Set expiration time (10 minutes)
   - Update compartment booking counter
5. Return booking confirmation

**Concurrency Safety**:
- Uses Prisma transactions for atomicity
- Prevents double-booking through unique constraints
- Real-time capacity checking
- Automatic rollback on any failure

**Business Rules**:
- Tickets expire after 10 minutes if unpaid
- Price = distance × compartment price per km
- Seat numbers must be unique per compartment/schedule
- Booking requires valid from/to station sequence

### Payment Processing Flow

**File**: `activity-diagram-payment-processing.puml`

**Process**: SSLCommerz payment gateway integration

**Key Steps**:

#### Payment Initiation
1. User initiates payment for booked ticket
2. System verifies ticket exists and belongs to user
3. Generate unique transaction ID
4. Create PaymentTransaction record (status: INITIATED)
5. Construct callback URLs (success/fail/cancel/IPN)
6. Send payment request to SSLCommerz API
7. Receive gateway session and URL
8. Redirect user to SSLCommerz payment page

#### Payment Processing
9. User enters payment details (card/mobile banking)
10. SSLCommerz processes payment

#### Success Path
11. Gateway redirects to success URL with payment data
12. System validates payment with SSLCommerz validation API
13. Update PaymentTransaction (status: COMPLETED)
14. Update Ticket (status: confirmed, paymentStatus: paid)
15. Create audit log
16. Display confirmation to user

#### Failure Path
11. Gateway redirects to fail URL
12. Update PaymentTransaction (status: FAILED)
13. Update Ticket (paymentStatus: failed)
14. Create audit log
15. Display failure message with retry option

#### IPN (Instant Payment Notification)
- Parallel server-to-server notification
- Independent of browser redirects
- Provides payment status updates asynchronously
- Ensures payment confirmation even if user closes browser

**Security Features**:
- Payment validation with SSLCommerz API
- Callback URL verification
- Transaction ID uniqueness
- Audit logging for all payment events
- Metadata storage for compliance

### Booking Cleanup Flow

**File**: `activity-diagram-booking-cleanup.puml`

**Process**: Automated and manual cleanup of expired bookings

**Scheduled Cleanup (Every 5 minutes)**:
1. Calculate cutoff time (current time - 10 minutes)
2. Query expired tickets:
   - status = "pending"
   - paymentStatus = "pending"
   - expiresAt < current time
3. For each expired ticket:
   - Update ticket status to "expired"
   - Cancel associated PaymentTransactions
   - Delete seat record (frees seat)
   - Decrement compartment booking counter
   - Create audit log
4. Return cleanup results (counts and errors)

**Manual Cleanup (Admin)**:
1. Admin requests manual cleanup
2. System verifies admin authorization
3. Execute same cleanup process
4. Return detailed cleanup report

**Cleanup Statistics (Admin)**:
1. Admin requests statistics
2. System queries current state:
   - Total pending tickets
   - Tickets expiring soon (< 5 minutes)
   - Already expired tickets
3. Return statistics dashboard

**Statistics Logging (Every 10 minutes)**:
- Automated logging of pending booking counts
- Helps monitor system health
- Identifies booking patterns

**Resource Management**:
- Automatic seat liberation
- Transaction cleanup
- Prevents resource leakage
- Maintains data consistency

### Train Search and Seat Availability Flow

**File**: `activity-diagram-train-search.puml`

**Process**: Search for trains and check seat availability

#### Train Search
1. User enters search criteria:
   - From station
   - To station
   - Travel date
2. System validates stations exist
3. Query TrainSchedules matching criteria:
   - Date matches
   - Route contains both stations
   - From station before to station in sequence
4. For each schedule:
   - Fetch train and route details
   - Calculate journey distance
   - Calculate prices per compartment type
   - Calculate departure/arrival times
5. Return formatted search results

#### Seat Availability Check
1. User selects a train and requests availability
2. System validates schedule and station sequence
3. For each compartment type:
   - Get total seats from compartment definition
   - Query booked seats with **overlapping journeys**
   - Calculate: available = total - booked
   - Generate list of available seat numbers
   - Calculate price for specific journey
4. Return availability data:
   - Compartment details
   - Seat counts (total/booked/available)
   - Available seat numbers
   - Pricing
5. User views seat map and selects seat
6. Proceed to ticket booking

**Journey Overlap Logic**:
A journey overlaps if:
- Booked from station < requested to station, AND
- Booked to station > requested from station

This ensures accurate availability for segment-based bookings.

**Key Features**:
- Segment-based seat availability
- Real-time booking status
- Price calculation per journey
- Visual seat selection
- Prevents overbooking

## How to View Diagrams

### Option 1: PlantUML Online Editor (Easiest)
1. Go to [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Copy the content of any `.puml` file
3. Paste into the editor
4. View the rendered diagram

### Option 2: VS Code with PlantUML Extension
1. Install the [PlantUML extension](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml)
2. Open any `.puml` file
3. Press `Alt+D` to preview

### Option 3: Command Line (Requires Java)
1. Download [PlantUML JAR](https://plantuml.com/download)
2. Run:
   ```bash
   java -jar plantuml.jar diagram-file.puml
   ```
3. Opens PNG/SVG output

### Option 4: IntelliJ IDEA / PyCharm
1. Built-in PlantUML support
2. Right-click `.puml` file → "Show PlantUML Diagram"

### Option 5: Export to Images
Generate PNG/SVG files for documentation:
```bash
# Install PlantUML (requires Java)
# On macOS:
brew install plantuml

# Generate all diagrams
cd backend/docs
plantuml *.puml

# Output: PNG files in same directory
```

## Diagram Notation Guide

### UML Class Diagram
- **Boxes**: Classes/Models
- **Lines with arrows**: Relationships
  - `→`: Association/Reference
  - `--`: Composition/Aggregation
  - `..>`: Dependency
  - `1`, `*`: Cardinality (one, many)
- **+**: Public member
- **-**: Private member
- **Packages**: Logical grouping of related classes

### Activity Diagrams
- **Rounded rectangles**: Activities/Actions
- **Diamonds**: Decision points (if/else)
- **Split arrows**: Parallel flows
- **Vertical bars**: Synchronization points
- **Swim lanes**: Different actors/systems
- **Notes**: Additional explanations

### Color Coding in Activity Diagrams
- **Light Blue**: Backend API processes
- **Orange**: External systems (SSLCommerz)
- **Light Green**: Background jobs/schedulers
- **White**: User actions

## Maintenance

These diagrams should be updated when:
- New database models are added
- New API endpoints are created
- Business logic processes change
- Service architecture is modified
- Payment flow is updated

## Related Documentation

- [API Documentation](./API.md) - Complete API endpoint reference
- [README](./README.md) - Backend setup and usage guide
- [Examples](./examples.md) - API usage examples
- [Main Project README](../../README.md) - Overall project documentation

## Contributors

Created by the RailNet development team for comprehensive system documentation.

## License

Part of the RailNet project - See main project LICENSE for details.
