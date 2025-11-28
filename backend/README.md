# RailNet Backend

A professional Fastify server with TypeScript, Prisma, and PostgreSQL, featuring role-based authentication with JWT tokens, rate limiting, CORS, and comprehensive API documentation.

## Features

- **Authentication**: JWT-based authentication with role-based access control (user/admin)
- **Security**: Rate limiting, CORS, password hashing with bcrypt
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Request validation with JSON schemas
- **Logging**: Structured logging with Pino
- **Error Handling**: Global error handling and consistent error responses

## Setup

1. Install dependencies: `npm install`

2. Set up your PostgreSQL database and update `.env` with the correct DATABASE_URL, JWT_SECRET, CORS_ORIGIN, and PORT.

3. Run Prisma migrations: `npm run prisma:migrate`

4. Generate Prisma client: `npm run prisma:generate`

5. Start the server: `npm run dev`

6. Access API documentation at: `http://localhost:3000/documentation`

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing
- `CORS_ORIGIN`: Allowed origin for CORS (default: http://localhost:3000)
- `PORT`: Server port (default: 3000)

## API Endpoints

### Authentication

#### Register

POST /register

Body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

Role is optional, defaults to "user". Password must be at least 6 characters.

#### Login

POST /login

Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response includes JWT token.

### Protected Routes

- GET /protected: Requires authentication
- GET /admin: Requires admin role

Include the token in Authorization header: `Authorization: Bearer <token>`

## Stations API

### Create Station (Admin Only)

POST /stations

Body:

```json
{
  "name": "Central Station",
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Get All Stations

GET /stations

### Get Station by ID

GET /stations/{id}

## Train Routes API

### Create Train Route (Admin Only)

POST /train-routes

Body:

```json
{
  "name": "Express Route",
  "stations": [
    { "stationId": 1, "distance": 50.5 },
    { "stationId": 2, "distance": 75.2 },
    { "stationId": 3, "distance": 0 }
  ]
}
```

Response includes startStationId, endStationId, startStation, endStation, and routeStations.

### Get All Train Routes

GET /train-routes

Response includes array of train routes with start/end station details.

### Get Train Route by ID

GET /train-routes/{id}

Response includes train route with start/end station details.

## Scripts

- `npm run build`: Build the project
- `npm run start`: Start the production server
- `npm run dev`: Start the development server with hot reload
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run Prisma migrations
- `npm run prisma:studio`: Open Prisma Studio
