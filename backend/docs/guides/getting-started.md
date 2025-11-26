# Getting Started Guide

This guide will help you set up and run the RailNet backend on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)
- **PostgreSQL**: v14.0 or higher
- **Git**: Latest version

### Verify Installation
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check PostgreSQL version
psql --version

# Check Git version
git --version
```

## Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/mojahid2021/RailNet.git

# Navigate to backend directory
cd RailNet/backend
```

### 2. Install Dependencies

```bash
# Install all npm dependencies
npm install
```

This will install:
- Fastify (web framework)
- Prisma (ORM)
- TypeScript and type definitions
- All other dependencies listed in package.json

### 3. Setup PostgreSQL Database

#### Option A: Local PostgreSQL Installation

1. **Create a new database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE railnet;

# Create user (optional)
CREATE USER railnet_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE railnet TO railnet_user;

# Exit psql
\q
```

#### Option B: Using Docker (Alternative)

```bash
# Run PostgreSQL in Docker
docker run --name railnet-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=railnet \
  -p 5432:5432 \
  -d postgres:14

# Verify container is running
docker ps
```

### 4. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
# Copy environment template (if exists)
cp .env.example .env

# Or create new .env file
touch .env
```

Add the following configuration to `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
API_PREFIX=/api/v1
BASE_URL=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/railnet?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important**: 
- Replace `postgres:postgres` with your PostgreSQL username and password
- Generate a strong JWT secret for production
- Never commit `.env` file to version control

### 5. Setup Database Schema

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push
```

Alternative using Prisma CLI directly:
```bash
npx prisma generate
npx prisma db push
```

### 6. Start Development Server

```bash
# Start the development server with auto-reload
npm run dev
```

The server should start on `http://localhost:3000`

You should see output similar to:
```
Server listening on http://0.0.0.0:3000
API documentation available at http://0.0.0.0:3000/docs
```

### 7. Verify Installation

Open your browser and navigate to:
- **API Server**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs

You should see:
- Root endpoint returning `{ status: "Server is running..." }`
- Swagger UI with all available endpoints

## Project Structure

```
backend/
├── src/
│   ├── admin/              # Admin routes and controllers
│   │   ├── routes.ts       # Authentication endpoints
│   │   ├── stations.ts     # Station management
│   │   ├── trains.ts       # Train management
│   │   ├── trainRoutes.ts  # Train route management
│   │   └── compartments.ts # Compartment management
│   ├── config/             # Configuration
│   │   └── index.ts        # Environment config
│   ├── errors/             # Custom error classes
│   │   └── index.ts        # Error definitions
│   ├── middleware/         # Middleware functions
│   │   └── auth.ts         # JWT authentication
│   ├── schemas/            # Zod validation schemas
│   │   └── admin.ts        # Request/response schemas
│   ├── utils/              # Utility functions
│   │   ├── jwt.ts          # JWT utilities
│   │   └── response.ts     # Response formatters
│   └── app.ts              # Application entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── docs/                   # Documentation
├── dist/                   # Compiled JavaScript (auto-generated)
├── node_modules/           # Dependencies (auto-generated)
├── package.json            # Project metadata and scripts
├── tsconfig.json           # TypeScript configuration
└── .env                    # Environment variables (create this)
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with auto-reload

# Building
npm run build            # Compile TypeScript to JavaScript
npm start                # Run compiled production build

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio (visual DB editor)

# Testing
npm test                 # Run tests (not yet configured)
```

## Testing the API

### Using Swagger UI (Recommended for Beginners)

1. Open http://localhost:3000/docs in your browser
2. You'll see all available endpoints
3. Click on an endpoint to expand it
4. Click "Try it out" button
5. Fill in required parameters
6. Click "Execute" to send the request

### Using cURL (Command Line)

#### 1. Register an Admin
```bash
curl -X POST http://localhost:3000/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

Save the token from the response!

#### 3. Create a Station (Authenticated)
```bash
curl -X POST http://localhost:3000/api/v1/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Dhaka Railway Station",
    "city": "Dhaka",
    "district": "Dhaka",
    "division": "Dhaka",
    "latitude": 23.7104,
    "longitude": 90.4074
  }'
```

### Using Postman

1. Import the OpenAPI specification from http://localhost:3000/docs/json
2. Set up environment variables for base URL and token
3. Test all endpoints interactively

## Common Issues and Solutions

### Issue 1: Port Already in Use
**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=3001
```

### Issue 2: Database Connection Failed
**Error**: `Can't reach database server`

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   # On macOS/Linux
   pg_isready
   
   # Or check service status
   sudo service postgresql status
   ```

2. Check DATABASE_URL in `.env` file
3. Verify PostgreSQL credentials
4. Ensure database `railnet` exists

### Issue 3: Prisma Client Not Generated
**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npm run db:generate
```

### Issue 4: TypeScript Errors
**Error**: Various TypeScript compilation errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild TypeScript
npm run build
```

### Issue 5: JWT Secret Not Set
**Error**: `JWT_SECRET is not defined`

**Solution**:
Ensure `.env` file has `JWT_SECRET` set:
```env
JWT_SECRET=your-secret-key-here
```

## Database Management

### Using Prisma Studio

Prisma Studio provides a visual interface to view and edit database data:

```bash
npm run db:studio
```

This opens a browser window at http://localhost:5555 with:
- Visual table browser
- Easy data editing
- Relationship visualization

### Resetting Database

To reset the database and start fresh:

```bash
# Delete all data and recreate tables
npx prisma migrate reset

# Or manually drop and recreate
psql -U postgres -d postgres
DROP DATABASE railnet;
CREATE DATABASE railnet;
\q

# Then push schema again
npm run db:push
```

## Next Steps

After successfully setting up the backend:

1. **Read the API Documentation**
   - [Authentication API](../api/admin-auth.md)
   - [Station Management API](../api/stations.md)
   - [Train Management API](../api/trains.md)

2. **Explore the Database Schema**
   - [Database Schema Documentation](../workflows/database-schema.md)

3. **Learn About Authentication**
   - [Authentication Flow](../workflows/authentication-flow.md)

4. **Configure Your Environment**
   - [Environment Configuration Guide](environment-configuration.md)

5. **Test the APIs**
   - [API Testing Guide](api-testing-guide.md)

6. **Understand Best Practices**
   - [Development Best Practices](best-practices.md)

## Development Workflow

### Typical Development Cycle

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Code Changes**
   - Server auto-reloads on file changes
   - TypeScript errors shown in console

3. **Test Changes**
   - Use Swagger UI or cURL
   - Verify response in browser/console

4. **Update Database Schema** (if needed)
   ```bash
   # Edit prisma/schema.prisma
   npm run db:push
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

## Getting Help

If you encounter issues:

1. **Check Documentation**
   - Read relevant guides in `docs/` directory
   - Review API documentation

2. **Check Logs**
   - Server logs in console
   - Database logs (if enabled)

3. **Common Solutions**
   - Restart server: `Ctrl+C` then `npm run dev`
   - Regenerate Prisma client: `npm run db:generate`
   - Clear node_modules: `rm -rf node_modules && npm install`

4. **Contact Support**
   - GitHub Issues: https://github.com/mojahid2021/RailNet/issues
   - Email: aammojahid@gmail.com

## Additional Resources

- [Fastify Documentation](https://www.fastify.io/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Last Updated**: 2025-11-24

**Contributors**: Team error2k21
