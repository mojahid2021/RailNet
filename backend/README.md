# RailNet Backend

A production-ready railway management system backend built with Fastify, TypeScript, and PostgreSQL. Features comprehensive station management, role-based authentication, and robust API infrastructure for railway operations.

## 🚀 Features

- **Fastify Framework**: High-performance Node.js web framework
- **TypeScript**: Full type safety and modern JavaScript features
- **PostgreSQL**: Robust relational database with Prisma ORM
- **Redis**: Caching and session management
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Admin, Staff, and Passenger roles
- **Station Management**: Complete railway station CRUD operations (admin only)
- **Security**: Helmet, CORS, Rate limiting, Input validation
- **Logging**: Structured logging with Winston
- **Health Checks**: Comprehensive health monitoring
- **API Versioning**: Versioned API endpoints
- **Docker Support**: Containerized deployment
- **Testing**: Jest and Supertest for unit and integration tests
- **Code Quality**: ESLint, Prettier, and Husky pre-commit hooks

## 🏗️ Architecture

```
src/
├── core/             # Core application setup (server, config, database)
├── features/         # Feature-based modules
│   ├── auth/         # Authentication & authorization
│   ├── health/       # Health check endpoints
│   └── stations/     # Station management
├── shared/           # Shared utilities and constants
├── types/            # TypeScript type definitions
└── server.ts         # Application entry point
```

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (for local development)

## 🚀 Quick Start

### Local Development with Docker

1. **Clone the repository**

   ```bash
   git clone https://github.com/mojahid2021/RailNet.git
   cd RailNet
   cd backend
   ```

2. **Start services with Docker Compose**

   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:migrate
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

### Manual Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up PostgreSQL and Redis**
   - Install PostgreSQL and create a database
   - Install Redis
   - Update `.env` with your database credentials

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the server**

   ```bash
   npm run dev
   ```

## 🚂 Station Management

RailNet includes comprehensive station management capabilities for railway infrastructure administration.

### Features

- **Station Creation**: Create new railway stations with location coordinates
- **Station Codes**: Auto-generated unique station codes from station names
- **Location Support**: Store latitude and longitude coordinates
- **Search Functionality**: Search stations by name, code, or city
- **Admin Controls**: Full CRUD operations restricted to administrators
- **Soft Deletion**: Stations can be deactivated rather than permanently deleted

### Station Data Model

```typescript
interface Station {
  id: string;           // Unique identifier
  name: string;         // Station name (required)
  code: string;         // Auto-generated code (e.g., "CENTRAL")
  city: string;         // City name
  state: string;        // State/Province
  country: string;      // Country
  latitude?: number;    // GPS latitude (-90 to 90)
  longitude?: number;   // GPS longitude (-180 to 180)
  isActive: boolean;    // Active status
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

### Station Code Generation

Station codes are automatically generated from the station name:

- "Central Station" → "CENTRA"
- "Grand Central Terminal" → "GRANDC"
- "New York Penn Station" → "NEWWYO"

### API Permissions

- **Public Access**: View stations, search stations
- **Admin Only**: Create, update, deactivate stations

### Quick Reference

**Base URL:** `http://localhost:3001/api/v1`

**Authentication Endpoints:**

- `POST /auth/register` - Register new passenger account
- `POST /auth/admin/register` - Register new admin account
- `POST /auth/admin/register-staff` - Register new staff account (admin only)
- `POST /auth/login` - Passenger login
- `POST /auth/admin/login` - Admin login
- `POST /auth/staff/login` - Staff login
- `GET /auth/profile` - Get user profile (authenticated)
- `POST /auth/refresh` - Refresh access token

**Health Endpoints:**

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `GET /health/ready` - Readiness check

**Station Management Endpoints (Admin Only):**

- `POST /stations/admin/stations` - Create new station (admin only)
- `PUT /stations/admin/stations/:id` - Update station (admin only)
- `DELETE /stations/admin/stations/:id` - Deactivate station (admin only)

**Public Station Endpoints:**

- `GET /stations/stations` - Get all active stations
- `GET /stations/stations/:id` - Get station by ID
- `GET /stations/stations/search/:query` - Search stations by name/code/city

### Example Usage

```bash
# Register passenger
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"passenger@example.com","password":"StrongPass123!","firstName":"John","lastName":"Doe"}'

# Register admin
curl -X POST http://localhost:3001/api/v1/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StrongAdminPass123!","firstName":"Admin","lastName":"User"}'

# Admin login
curl -X POST http://localhost:3001/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StrongAdminPass123!"}'

# Register staff (requires admin token)
curl -X POST http://localhost:3001/api/v1/auth/admin/register-staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{"email":"staff@example.com","password":"StrongStaffPass123!","firstName":"Jane","lastName":"Smith"}'

# Staff login
curl -X POST http://localhost:3001/api/v1/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@example.com","password":"StrongStaffPass123!"}'

# Passenger login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"passenger@example.com","password":"StrongPass123!"}'

# Get profile (use token from login response)
curl -X GET http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create station (admin only)
curl -X POST http://localhost:3001/api/v1/stations/admin/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{"name":"Central Station","latitude":40.7128,"longitude":-74.0060}'

# Get all stations (public)
curl -X GET http://localhost:3001/api/v1/stations/stations

# Search stations (public)
curl -X GET http://localhost:3001/api/v1/stations/stations/search/central

# Update station (admin only)
curl -X PUT http://localhost:3001/api/v1/stations/admin/stations/STATION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{"name":"Updated Central Station","latitude":40.7130,"longitude":-74.0065}'

# Deactivate station (admin only)
curl -X DELETE http://localhost:3001/api/v1/stations/admin/stations/STATION_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run format      # Format code with Prettier
npm run typecheck   # Run TypeScript type checking
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `REDIS_URL` | Redis connection URL | Optional |
| `LOG_LEVEL` | Logging level | `info` |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### API Testing with Postman

A comprehensive Postman collection is available for testing all API endpoints:

- **Collection File**: `RailNet_Backend_Postman_Collection.json`
- **Features**: Automated token management, environment variables, comprehensive test coverage
- **Endpoints Covered**: Authentication, health checks, station management
- **Import Instructions**: Import the JSON file into Postman and configure environment variables

**Environment Variables:**

- `baseURL`: `http://localhost:3001` (or your server URL)
- `adminToken`: JWT token for admin operations
- `staffToken`: JWT token for staff operations
- `passengerToken`: JWT token for passenger operations

## 🚀 Deployment

### Docker Deployment

1. **Build the image**

   ```bash
   docker build -t railnet-backend .
   ```

2. **Run with Docker Compose**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set strong `JWT_SECRET`
- [ ] Configure Redis for caching
- [ ] Set up SSL/TLS
- [ ] Configure logging to external service
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy

## 🔒 Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing control
- **Rate Limiting**: Request rate limiting with Redis
- **Input Validation**: Joi schema validation
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password storage
- **SQL Injection Prevention**: Prisma ORM protection

## 📊 Monitoring

- **Health Checks**: `/health` endpoint for load balancers
- **Structured Logging**: Winston with configurable levels
- **Error Tracking**: Comprehensive error handling and logging
- **Performance Monitoring**: Request/response logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, please contact the development team or create an issue in the repository.
