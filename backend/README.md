# RailNet Backend

A comprehensive railway management system API built with Fastify and TypeScript, featuring JWT authentication, PostgreSQL database with Prisma ORM, and complete train scheduling and ticket booking functionality.

## Features

- **Authentication**: JWT-based authentication with role-based access control (user/admin)
- **Station Management**: CRUD operations for railway stations
- **Train Route Management**: Create and manage train routes with station sequences and distances
- **Compartment Management**: Manage different train compartments with pricing and capacity
- **Train Assembly**: Build trains by combining routes and compartments
- **Schedule Management**: Create train schedules with station-specific timing
- **Train Search**: Search for available trains between stations with filters
- **Ticket Booking**: Complete ticket booking system with seat management and validation
- **Security**: Rate limiting, CORS, password hashing with bcrypt
- **Validation**: Request validation with JSON schemas
- **Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Logging**: Structured logging with Pino
- **Error Handling**: Global error handling and consistent error responses

## Quick Start

1. **Install dependencies**: `npm install`

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL connection and JWT secret
   ```

3. **Set up database**:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Start development server**: `npm run dev`

5. **Access API documentation**: [http://localhost:3000/documentation](http://localhost:3000/documentation)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `CORS_ORIGIN` | Allowed origin for CORS | `http://localhost:3000` |
| `PORT` | Server port | `3000` |

## API Endpoints

All endpoints except `/register` and `/login` require authentication. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Authentication

#### Register User

```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

#### Login

```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Stations

#### Create Station (Admin Only)

```http
POST /stations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Central Station",
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Get All Stations

```http
GET /stations
Authorization: Bearer <token>
```

#### Get Station by ID

```http
GET /stations/{id}
Authorization: Bearer <token>
```

### Train Routes

#### Create Train Route (Admin Only)

```http
POST /train-routes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Express Route",
  "stations": [
    { "stationId": 1, "distance": 0 },
    { "stationId": 2, "distance": 50 },
    { "stationId": 3, "distance": 50 }
  ]
}
```

#### Get All Train Routes (Admin Only)

```http
GET /train-routes
Authorization: Bearer <token>
```

#### Get Train Route by ID (Admin Only)

```http
GET /train-routes/{id}
Authorization: Bearer <token>
```

### Compartments

#### Create Compartment (Admin Only)

```http
POST /compartments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "First Class AC",
  "class": "First",
  "type": "AC",
  "price": 150.00,
  "totalSeats": 50
}
```

#### Get All Compartments

```http
GET /compartments
Authorization: Bearer <token>
```

#### Get Compartment by ID

```http
GET /compartments/{id}
Authorization: Bearer <token>
```

### Trains

#### Create Train (Admin Only)

```http
POST /trains
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Express Train 101",
  "number": "EXP101",
  "trainRouteId": 1,
  "compartments": [
    { "compartmentId": 1, "quantity": 2 },
    { "compartmentId": 2, "quantity": 3 }
  ]
}
```

#### Get All Trains

```http
GET /trains
Authorization: Bearer <token>
```

#### Get Train by ID

```http
GET /trains/{id}
Authorization: Bearer <token>
```

### Train Schedules

#### Create Train Schedule (Admin Only)

```http
POST /train-schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "trainId": 1,
  "date": "2025-12-01",
  "time": "08:00"
}
```

**Note:** Station times are automatically calculated based on route distances (1 minute per km + 5 minute stop at each station).

#### Get All Train Schedules

```http
GET /train-schedules
Authorization: Bearer <token>
```

#### Get Train Schedule by ID

```http
GET /train-schedules/{id}
Authorization: Bearer <token>
```

#### Get Schedules by Date

```http
GET /train-schedules/date/2025-12-01
Authorization: Bearer <token>
```

#### Get Schedules by Route

```http
GET /train-schedules/route/1
Authorization: Bearer <token>
```

#### Search Trains

```http
GET /train-schedules/search?fromStationId=1&toStationId=3&date=2025-12-01
Authorization: Bearer <token>
```

#### Get Seat Availability for Schedule

```http
GET /train-schedules/{scheduleId}/seats
Authorization: Bearer <token>
```

**Response includes:**

- Schedule details (train name, date, time)
- Compartment information with seat availability
- Individual seat details for booked seats plus available seat slots
- Seat numbers, types, and passenger information for booked seats

#### Get Available Seats for Journey Segment

```http
GET /train-schedules/{scheduleId}/available-seats?fromStationId=1&toStationId=3
Authorization: Bearer <token>
```

**Features:**

- Checks for overlapping journeys to ensure accurate availability
- Excludes seats booked for journeys that conflict with the requested segment
- Shows seat counts (total/booked/available) per compartment
- Users can choose any seat number not already booked for that date/compartment
- Optimized database queries with trainCompartmentId and seatNumber for better performance

**Response includes:**

- Schedule and journey segment details
- Compartment availability with total/booked/available seat counts
- Users can choose any seat number not already booked

### Ticket Booking

#### Book Ticket (Authenticated Users)

```http
POST /tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "trainScheduleId": 1,
  "fromStationId": 1,
  "toStationId": 3,
  "compartmentId": 1,
  "seatNumber": "A1",
  "passengerName": "John Doe",
  "passengerAge": 30,
  "passengerGender": "Male"
}
```

**Features:**

- Seat number provided by user in request
- Checks seat availability by date and TrainCompartment
- Validates that specific seat number isn't already booked
- Ensures total booked seats don't exceed compartment capacity
- Transaction-based booking to prevent race conditions
- Seat records created only when booked

#### Get User's Tickets

```http
GET /tickets
Authorization: Bearer <token>
```

#### Get Ticket by ID

```http
GET /tickets/{id}
Authorization: Bearer <token>
```

#### Cancel Ticket

```http
PUT /tickets/{id}/cancel
Authorization: Bearer <token>
```

**Note:** Tickets can only be cancelled up to 2 hours before departure.

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (business logic violations)
- `500` - Internal Server Error

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build the project |
| `npm run start` | Start the production server |
| `npm run dev` | Start the development server with hot reload |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:push` | Push schema changes to database |

### Project Structure

```bash
src/
├── index.ts              # Main application entry point
├── routes/               # API route handlers
│   ├── auth.ts          # Authentication routes
│   ├── stations.ts      # Station management
│   ├── trainRoutes.ts   # Train route management
│   ├── compartments.ts  # Compartment management
│   ├── trains.ts        # Train assembly
│   ├── trainSchedules.ts # Schedule management
│   └── tickets.ts       # Ticket booking
├── schemas/             # JSON schema validations
├── decorators/          # Custom Fastify decorators
└── plugins/             # Fastify plugins
prisma/
├── schema.prisma       # Database schema
└── migrations/         # Database migrations
```

## Testing the API

1. Start the server: `npm run dev`
2. Visit [http://localhost:3000/documentation](http://localhost:3000/documentation) for interactive API docs
3. Register a user and get a JWT token
4. Use the token to access protected endpoints
5. Create stations, routes, compartments, and trains (admin required)
6. Create schedules and search for trains
7. Book tickets and manage bookings

## Contributing

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update API documentation for new endpoints
4. Ensure all TypeScript types are properly defined
5. Test with the OpenAPI documentation interface
