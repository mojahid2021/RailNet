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
- **Authentication**: JWT-based admin authentication
- **Station Management**: Full CRUD operations for railway stations

## API Endpoints

### Admin Authentication

- `POST /api/v1/admin/register` - Register a new admin
- `POST /api/v1/admin/login` - Login admin and get JWT token
- `GET /api/v1/admin/profile` - Get admin profile (requires authentication)

### Station Management

- `POST /api/v1/stations` - Create a new station (requires authentication)
- `GET /api/v1/stations` - Get all stations (requires authentication)
- `GET /api/v1/stations/:id` - Get station by ID (requires authentication)
- `PUT /api/v1/stations/:id` - Update station (requires authentication)
- `DELETE /api/v1/stations/:id` - Delete station (requires authentication)

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

