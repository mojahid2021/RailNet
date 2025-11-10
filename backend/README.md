# RailNet Backend

A production-ready railway management system backend built with Fastify, TypeScript, and PostgreSQL.

## 🚀 Features

- **Fastify Framework**: High-performance Node.js web framework
- **TypeScript**: Full type safety and modern JavaScript features
- **PostgreSQL**: Robust relational database with Prisma ORM
- **Redis**: Caching and session management
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Admin, Staff, and Passenger roles
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
├── config/           # Configuration management
├── controllers/      # Request handlers
├── middleware/       # Custom middleware (auth, security, error handling)
├── routes/          # Route definitions
├── services/        # Business logic
├── utils/           # Utility functions
├── errors/          # Custom error classes
├── prisma/          # Database schema and migrations
└── server.ts        # Application entry point
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

The API will be available at `http://localhost:3000`

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

## 📖 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Health Check

```http
GET /health
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 123.45,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "development",
    "database": "connected",
    "version": "1.0.0"
  }
}
```

### Hello World

```http
GET /api/v1/hello
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "Hello from RailNet API!"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
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
| `PORT` | Server port | `3000` |
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
