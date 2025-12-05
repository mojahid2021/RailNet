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
- **Payment Processing**: SSLCommerz integration with automatic booking expiration and cleanup
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
| `SSLCOMMERZ_STORE_ID` | SSLCommerz store ID | Required for payments |
| `SSLCOMMERZ_STORE_PASSWORD` | SSLCommerz store password | Required for payments |
| `SSLCOMMERZ_IS_SANDBOX` | Use SSLCommerz sandbox mode | `true` |
| `SSLCOMMERZ_API_URL` | SSLCommerz API URL | `https://sandbox.sslcommerz.com` |
| `SSLCOMMERZ_SUCCESS_URL` | Payment success callback URL | Required for payments |
| `SSLCOMMERZ_FAIL_URL` | Payment failure callback URL | Required for payments |
| `SSLCOMMERZ_CANCEL_URL` | Payment cancel callback URL | Required for payments |
| `SSLCOMMERZ_IPN_URL` | Instant Payment Notification URL | Required for payments |
| `BOOKING_EXPIRY_MINUTES` | Minutes before unpaid bookings expire | `10` |

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

### Payment Processing

The API includes a complete SSLCommerz payment integration with automatic booking expiration and cleanup.

#### Initiate Payment (Authenticated Users)

```http
POST /payments/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "ticketId": 1,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+8801712345678",
  "customerAddress": "123 Main St",
  "customerCity": "Dhaka",
  "customerCountry": "Bangladesh"
}
```

**Response:**

```json
{
  "paymentUrl": "https://sandbox.sslcommerz.com/gwprocess/...",
  "transactionId": "TXN_1734953100030_1"
}
```

**Features:**

- Creates payment transaction record
- Initiates SSLCommerz payment session
- Returns payment gateway URL for user redirection
- Automatic booking expiration after 10 minutes if unpaid

#### Payment Callbacks (Public Endpoints)

The following endpoints handle SSLCommerz callbacks and do not require authentication:

- `GET /payments/success` - Payment success callback
- `GET /payments/fail` - Payment failure callback
- `GET /payments/cancel` - Payment cancellation callback
- `POST /payments/ipn` - Instant Payment Notification (server-to-server)

#### Admin Payment Management

##### Manual Cleanup (Admin Only)

```http
POST /payments/cleanup
Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "expiredTickets": 5,
  "cancelledTransactions": 5,
  "errors": []
}
```

##### Get Cleanup Statistics (Admin Only)

```http
GET /payments/cleanup/stats
Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "totalPending": 12,
  "expiringSoon": 3,
  "expired": 2
}
```

#### Automatic Cleanup System

- **Scheduled Jobs**: Runs every 5 minutes to clean up expired bookings
- **Statistics Logging**: Logs pending booking statistics every 10 minutes
- **Resource Management**: Automatically frees up seats when bookings expire
- **Transaction Cleanup**: Cancels associated payment transactions for expired bookings

#### Payment Flow

1. **Booking**: User books a ticket (status: `pending`, paymentStatus: `pending`)
2. **Payment Initiation**: User initiates payment with customer details
3. **Gateway Redirect**: User is redirected to SSLCommerz payment gateway
4. **Payment Processing**: User completes payment on SSLCommerz
5. **Callback Handling**: SSLCommerz sends success/failure callbacks
6. **Confirmation**: Ticket status updated to `confirmed`, paymentStatus to `paid`
7. **Auto-Expiration**: Unpaid bookings automatically expire after 10 minutes
8. **Cleanup**: Expired bookings are cleaned up, seats are freed

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
| `npm run lint` | Check code quality with ESLint |
| `npm run lint:fix` | Automatically fix linting issues |
| `npm run format` | Format code with Prettier |
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
│   ├── tickets.ts       # Ticket booking
│   └── payments.ts      # Payment processing and cleanup
├── services/            # Business logic services
│   ├── paymentService.ts # Payment processing logic
│   ├── cleanupService.ts # Booking cleanup utilities
│   └── cleanupJobs.ts   # Scheduled cleanup jobs
├── utils/               # Utility functions
│   └── sslcommerz.ts    # SSLCommerz HTTP client
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
8. **Test Payment Flow**:
   - Book a ticket (remains in `pending` status)
   - Initiate payment with customer details
   - Use the returned payment URL for testing (sandbox mode)
   - Observe automatic expiration after 10 minutes if unpaid
   - Check admin cleanup endpoints for monitoring

## SSLCommerz Integration

### Sandbox Testing

For testing payments without real money:

1. Set `SSLCOMMERZ_IS_SANDBOX=true` in your `.env` file
2. Use test card details provided by SSLCommerz
3. All transactions will be simulated

### Production Setup

For live payments:

1. Set `SSLCOMMERZ_IS_SANDBOX=false`
2. Update all callback URLs to your production domain
3. Use your live SSLCommerz store credentials
4. Ensure HTTPS is enabled for all callback endpoints

### Callback URLs

Configure the following URLs in your SSLCommerz store settings:

- **Success URL**: `https://yourdomain.com/payments/success`
- **Fail URL**: `https://yourdomain.com/payments/fail`
- **Cancel URL**: `https://yourdomain.com/payments/cancel`
- **IPN URL**: `https://yourdomain.com/payments/ipn`

## Contributing

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update API documentation for new endpoints
4. Ensure all TypeScript types are properly defined
5. Test with the OpenAPI documentation interface
