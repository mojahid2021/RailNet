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

5. Start development server:
   ```bash
   npm run dev
   ```

6. Build for production:
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
- `BASE_URL`: Base URL for the API (default: http://localhost:3000)
- `JWT_SECRET`: Secret key for JWT token signing (required)