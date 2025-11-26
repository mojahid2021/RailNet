# RailNet Backend

A production-ready Fastify API server with TypeScript, Zod validation, Swagger documentation, and Prisma ORM for PostgreSQL.

## Features

- **Fastify**: High-performance web framework
- **TypeScript**: Type-safe development
- **Zod**: Schema validation
- **Swagger**: API documentation
- **Prisma**: Database ORM
- **PostgreSQL**: Database
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Pino
- **Authentication**: JWT-based admin and user authentication
- **Train Search**: Comprehensive route discovery with direction validation
- **Ticket Booking**: Secure seat reservation system
- **Station Management**: Full CRUD operations for railway stations
- **Schedule Management**: Detailed train scheduling with station-by-station timing

## API Endpoints

### Admin Authentication

- `POST /api/v1/admin/register` - Register a new admin
- `POST /api/v1/admin/login` - Login admin and get JWT token
- `GET /api/v1/admin/profile` - Get admin profile (requires authentication)

### User Authentication & Booking

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user and get JWT token
- `POST /api/v1/auth/book-ticket` - Book a train ticket (requires user authentication)

### Train Search & Information (User Authentication Required)

- `GET /api/v1/trains/search` - Search trains between stations on a specific date (requires user authentication)
- `GET /api/v1/trains/seat-status/:scheduleId/:compartmentId` - Check seat availability (requires user authentication)

### Train Route Management

- `POST /api/v1/train-routes` - Create a new train route (requires authentication)
- `GET /api/v1/train-routes` - Get all train routes (requires authentication)
- `GET /api/v1/train-routes/:id` - Get train route by ID (requires authentication)
- `PUT /api/v1/train-routes/:id` - Update train route (requires authentication)
- `DELETE /api/v1/train-routes/:id` - Delete train route (requires authentication)

### Train Management

- `POST /api/v1/trains` - Create a new train (requires authentication)
- `GET /api/v1/trains` - Get all trains (requires authentication)
- `GET /api/v1/trains/:id` - Get train by ID (requires authentication)
- `PUT /api/v1/trains/:id` - Update train (requires authentication)
- `DELETE /api/v1/trains/:id` - Delete train (requires authentication)

### Compartment Management

- `POST /api/v1/compartments` - Create a new compartment (requires authentication)
- `GET /api/v1/compartments` - Get all compartments (requires authentication)
- `GET /api/v1/compartments/:id` - Get compartment by ID (requires authentication)
- `PUT /api/v1/compartments/:id` - Update compartment (requires authentication)
- `DELETE /api/v1/compartments/:id` - Delete compartment (requires authentication)

### Station Management

- `POST /api/v1/stations` - Create a new station (requires authentication)
- `GET /api/v1/stations` - Get all stations (requires authentication)
- `GET /api/v1/stations/:id` - Get station by ID (requires authentication)
- `PUT /api/v1/stations/:id` - Update station (requires authentication)
- `DELETE /api/v1/stations/:id` - Delete station (requires authentication)

### Schedule Management (Admin Only for Creation)

- `POST /api/v1/schedules` - Create a new train schedule (admin only)
- `GET /api/v1/schedules` - Get all schedules with filters (requires user authentication)
- `GET /api/v1/schedules/:id` - Get schedule details by ID (requires user authentication)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy `.env` and update the `DATABASE_URL` with your PostgreSQL connection string.

3. Generate Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Push database schema:

   ```bash
   npm run prisma:db:push
   ```

5. (Optional) Open Prisma Studio for database management:

   ```bash
   npm run prisma:studio
   ```

6. Start development server:

   ```bash
   npm run dev
   ```

7. Build for production:

   ```bash
   npm run build
   npm start
   ```

## Testing

The project includes a Jest-based testing setup for unit and integration tests.

### Run Tests

```bash
# Run all tests
npm run test:run

# Setup testing environment (installs Jest and configures TypeScript)
npm run test:setup
```

### Test Structure

- Tests are located in the `tests/` directory
- Use `.test.ts` or `.spec.ts` extensions
- Jest is configured with TypeScript support

## API Documentation

Once the server is running, visit `http://localhost:3000/docs` for Swagger UI.

## Environment Variables

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `LOG_LEVEL`: Logging level (default: info)
- `API_PREFIX`: API route prefix (default: /api/v1)
- `DATABASE_URL`: PostgreSQL connection string
- `BASE_URL`: Base URL for the API (default: `http://localhost:3000`)
- `JWT_SECRET`: Secret key for JWT token signing (required)

