# RailNet Backend Documentation

## Overview

RailNet is a comprehensive train management system built with modern web technologies. This backend API provides complete functionality for managing train stations, routes, compartments, trains, schedules, and ticket bookings.

## Features

- 🔐 **JWT Authentication** with role-based access control (user/admin)
- 🚆 **Complete Train Management** - stations, routes, compartments, trains
- 📅 **Schedule Management** with automatic timing calculations
- 🎫 **Ticket Booking System** with seat management and validation
- 🔍 **Advanced Search** - find trains between stations on specific dates
- 💺 **Seat Availability** - check available seats for journey segments
- 📚 **OpenAPI Documentation** with Swagger UI
- 🛡️ **Input Validation** with JSON Schema
- 🗄️ **PostgreSQL Database** with Prisma ORM
- ⚡ **Fastify Framework** for high performance
- 🚦 **Rate Limiting** - 100 requests per minute

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/mojahid2021/RailNet.git
   cd RailNet/backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL connection and JWT secret
   ```

4. **Set up the database:**

   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Start the development server:**

   ```bash
   npm run dev
   ```

6. **Access the API:**
   - Server: `http://localhost:3000`
   - Documentation: `http://localhost:3000/documentation`

### First Steps

1. **Register as admin:**

   ```bash
   curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "firstName": "Admin",
       "lastName": "User",
       "password": "securepassword123",
       "role": "admin"
     }'
   ```

2. **Create stations:**

   ```bash
   curl -X POST http://localhost:3000/stations \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "name": "Central Station",
       "city": "New York",
       "latitude": 40.7128,
       "longitude": -74.0060
     }'
   ```

3. **Create a train route:**

   ```bash
   curl -X POST http://localhost:3000/train-routes \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "name": "NYC to Boston Express",
       "stations": [
         {"stationId": 1, "distance": 0},
         {"stationId": 3, "distance": 50},
         {"stationId": 2, "distance": 50}
       ]
     }'
   ```

4. **Search for trains:**

   ```bash
   curl "http://localhost:3000/train-schedules/search?fromStationId=1&toStationId=2&date=2025-11-30" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

5. **Book a ticket:**

   ```bash
   curl -X POST http://localhost:3000/tickets \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "trainScheduleId": 1,
       "fromStationId": 1,
       "toStationId": 2,
       "compartmentId": 1,
       "seatNumber": "1A",
       "passengerName": "John Doe",
       "passengerAge": 30,
       "passengerGender": "Male"
     }'
   ```

## API Endpoints

### Authentication

| Endpoint | Description |
|----------|-------------|
| `POST /register` | Register new user |
| `POST /login` | User login |

### Stations

| Endpoint | Description | Access |
|----------|-------------|--------|
| `POST /stations` | Create station | Admin |
| `GET /stations` | Get all stations | Authenticated |
| `GET /stations/{id}` | Get station by ID | Authenticated |

### Train Routes

| Endpoint | Description | Access |
|----------|-------------|--------|
| `POST /train-routes` | Create route | Admin |
| `GET /train-routes` | Get all routes | Admin |
| `GET /train-routes/{id}` | Get route by ID | Admin |

### Compartments

| Endpoint | Description | Access |
|----------|-------------|--------|
| `POST /compartments` | Create compartment | Admin |
| `GET /compartments` | Get all compartments | Authenticated |
| `GET /compartments/{id}` | Get compartment by ID | Authenticated |

### Trains

| Endpoint | Description | Access |
|----------|-------------|--------|
| `POST /trains` | Create train | Admin |
| `GET /trains` | Get all trains | Authenticated |
| `GET /trains/{id}` | Get train by ID | Authenticated |

### Train Schedules

| Endpoint | Description | Access |
|----------|-------------|--------|
| `POST /train-schedules` | Create schedule | Admin |
| `GET /train-schedules` | Get all schedules | Authenticated |
| `GET /train-schedules/{id}` | Get schedule by ID | Authenticated |
| `GET /train-schedules/date/{date}` | Get schedules by date | Authenticated |
| `GET /train-schedules/route/{routeId}` | Get schedules by route | Authenticated |
| `GET /train-schedules/search` | Search trains between stations | Authenticated |
| `GET /train-schedules/{id}/seats` | Get seat availability | Authenticated |
| `GET /train-schedules/{id}/available-seats` | Get available seats for journey | Authenticated |

### Tickets

| Endpoint | Description | Access |
|----------|-------------|--------|
| `POST /tickets` | Book a ticket | Authenticated |
| `GET /tickets` | Get user's tickets | Authenticated |
| `GET /tickets/{id}` | Get ticket by ID | Authenticated |
| `PUT /tickets/{id}/cancel` | Cancel a ticket | Authenticated |

## Architecture

### Tech Stack

- **Framework:** Fastify (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT
- **Validation:** JSON Schema
- **Documentation:** Swagger/OpenAPI

### Database Schema

```
User (id, email, firstName, lastName, password, role)
Station (id, name, city, latitude, longitude)
TrainRoute (id, name, startStationId, endStationId)
RouteStation (id, trainRouteId, previousStationId, currentStationId, nextStationId, distance, distanceFromStart)
Compartment (id, name, class, type, price, totalSeats)
Train (id, name, number, trainRouteId)
TrainCompartment (id, trainId, compartmentId, quantity)
Seat (id, trainCompartmentId, seatNumber, seatType, row, column, isAvailable)
TrainSchedule (id, trainId, trainRouteId, date, time)
ScheduleStation (id, trainScheduleId, stationId, arrivalTime, departureTime, sequence)
Ticket (id, userId, trainScheduleId, fromStationId, toStationId, seatId, trainCompartmentId, seatNumber, passengerName, passengerAge, passengerGender, price, status, bookedAt)
```

### Key Features

- **Role-based Access:** Admin and regular users with different permissions
- **Data Validation:** Comprehensive input validation with JSON Schema
- **Error Handling:** Consistent error responses with appropriate status codes
- **Automatic Timings:** Schedule station times calculated from distances (1 min/km)
- **Route Validation:** Ensures logical station ordering
- **Seat Management:** Prevents double bookings with transaction-based booking
- **Cancellation Policy:** Tickets can be cancelled up to 2 hours before departure
- **Search Optimization:** Efficient queries for train searches

## Development

### Available Scripts

```bash
npm run build          # Build TypeScript
npm start              # Start production server
npm run dev            # Start development server with hot reload
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open database GUI
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/railnet"
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:3000"
PORT="3000"
```

### Database Migrations

```bash
npm run prisma:migrate    # Create and apply migration
npm run prisma:generate   # Generate Prisma client
npm run prisma:studio     # Open database GUI
```

## API Documentation

Complete API documentation with examples is available in:

- [API Reference](./API.md) - Detailed endpoint documentation
- [API Examples](./examples.md) - Practical curl examples
- Swagger UI: `http://localhost:3000/documentation`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the CC BY-NC-SA 4.0 License.
