# RailNet Backend Documentation

## Overview

RailNet is a comprehensive train management system built with modern web technologies. This backend API provides complete functionality for managing train stations, routes, compartments, trains, and schedules.

## Features

- 🔐 **JWT Authentication** with role-based access control
- 🚆 **Complete Train Management** - stations, routes, compartments, trains
- 📅 **Schedule Management** with automatic timing calculations
- 🔍 **Advanced Search** - find trains between stations on specific dates
- 📚 **OpenAPI Documentation** with Swagger UI
- 🛡️ **Input Validation** with JSON Schema
- 🗄️ **PostgreSQL Database** with Prisma ORM
- ⚡ **Fastify Framework** for high performance

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

3. **Set up the database:**

   ```bash
   # Configure your DATABASE_URL in .env
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Build and start:**

   ```bash
   npm run build
   npm start
   ```

5. **Access the API:**
   - Server: `http://localhost:3000`
   - Documentation: `http://localhost:3000/documentation`

### First Steps

1. **Register as admin** (first user becomes admin):

   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "firstName": "Admin",
       "lastName": "User",
       "password": "securepassword123"
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
       "startStationId": 1,
       "endStationId": 2,
       "stations": [
         {"stationId": 1, "distanceFromStart": 0},
         {"stationId": 2, "distanceFromStart": 100}
       ]
     }'
   ```

4. **Search for trains:**

   ```bash
   curl "http://localhost:3000/train-schedules/search?fromStationId=1&toStationId=2&date=2025-11-30" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### Stations

- `POST /stations` - Create station (Admin)
- `GET /stations` - Get all stations
- `GET /stations/{id}` - Get station by ID
- `PUT /stations/{id}` - Update station (Admin)
- `DELETE /stations/{id}` - Delete station (Admin)

### Train Routes

- `POST /train-routes` - Create route (Admin)
- `GET /train-routes` - Get all routes
- `GET /train-routes/{id}` - Get route by ID
- `PUT /train-routes/{id}` - Update route (Admin)
- `DELETE /train-routes/{id}` - Delete route (Admin)

### Compartments

- `POST /compartments` - Create compartment (Admin)
- `GET /compartments` - Get all compartments
- `GET /compartments/{id}` - Get compartment by ID
- `PUT /compartments/{id}` - Update compartment (Admin)
- `DELETE /compartments/{id}` - Delete compartment (Admin)

### Trains

- `POST /trains` - Create train (Admin)
- `GET /trains` - Get all trains
- `GET /trains/{id}` - Get train by ID
- `PUT /trains/{id}` - Update train (Admin)
- `DELETE /trains/{id}` - Delete train (Admin)

### Train Schedules

- `POST /train-schedules` - Create schedule (Admin)
- `GET /train-schedules` - Get all schedules
- `GET /train-schedules/{id}` - Get schedule by ID
- `GET /train-schedules/date/{date}` - Get schedules by date
- `GET /train-schedules/route/{routeId}` - Get schedules by route
- `GET /train-schedules/search` - Search trains between stations

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
RouteStation (id, trainRouteId, currentStationId, distanceFromStart)
Compartment (id, name, class, type, price, seats)
Train (id, name, number, trainRouteId)
TrainCompartment (id, trainId, compartmentId)
TrainSchedule (id, trainId, trainRouteId, date, time)
ScheduleStation (id, trainScheduleId, stationId, arrivalTime, departureTime, sequence)
```

### Key Features

- **Role-based Access:** Admin and regular users
- **Data Validation:** Comprehensive input validation
- **Error Handling:** Consistent error responses
- **Automatic Timings:** Schedule station times calculated from distances
- **Route Validation:** Ensures logical station ordering
- **Search Optimization:** Efficient queries for train searches

## Development

### Available Scripts

```bash
npm run build      # Build TypeScript
npm start          # Start production server
npm run dev        # Start development server with hot reload
npm test           # Run tests
npm run lint       # Run ESLint
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/railnet"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

### Database Migrations

```bash
npx prisma migrate dev    # Create and apply migration
npx prisma generate       # Generate Prisma client
npx prisma studio         # Open database GUI
```

## API Documentation

Complete API documentation with examples is available in:

- [API Reference](./API.md) - Detailed endpoint documentation
- Swagger UI: `http://localhost:3000/documentation`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
