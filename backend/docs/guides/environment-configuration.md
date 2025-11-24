# Environment Configuration Guide

This guide explains all environment variables used in the RailNet backend and how to configure them for different environments.

## Environment Files

### Development (.env)
Used for local development. This file should be created in the `backend/` directory and **never committed to version control**.

### Production
Environment variables should be set through your deployment platform (e.g., Heroku, AWS, Docker, etc.)

## Environment Variables Reference

### Complete .env Template

```env
# ========================================
# SERVER CONFIGURATION
# ========================================
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
API_PREFIX=/api/v1
BASE_URL=http://localhost:3000

# ========================================
# DATABASE CONFIGURATION
# ========================================
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# ========================================
# SECURITY CONFIGURATION
# ========================================
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRATION=7d

# ========================================
# CORS CONFIGURATION (Optional)
# ========================================
CORS_ORIGIN=*

# ========================================
# RATE LIMITING (Optional)
# ========================================
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000
```

## Variable Descriptions

### Server Configuration

#### NODE_ENV
- **Type**: String
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Description**: Specifies the environment the application is running in
- **Impact**:
  - `development`: Verbose logging, detailed error messages
  - `production`: Minimal logging, sanitized error messages
  - `test`: Test-specific configurations

**Examples**:
```env
# Development
NODE_ENV=development

# Production
NODE_ENV=production

# Testing
NODE_ENV=test
```

---

#### PORT
- **Type**: Number
- **Default**: `3000`
- **Description**: Port number on which the server listens
- **Range**: 1-65535 (typically use 3000-9999 for development)

**Examples**:
```env
# Default development port
PORT=3000

# Alternative port
PORT=8080

# Production port (often 80 or 443 with reverse proxy)
PORT=80
```

---

#### HOST
- **Type**: String
- **Default**: `0.0.0.0`
- **Description**: Host address to bind the server
- **Values**:
  - `0.0.0.0`: Listen on all network interfaces (recommended)
  - `localhost` or `127.0.0.1`: Listen only on local machine
  - Specific IP: Listen on specific network interface

**Examples**:
```env
# Listen on all interfaces (recommended)
HOST=0.0.0.0

# Local only
HOST=localhost

# Specific interface
HOST=192.168.1.100
```

---

#### LOG_LEVEL
- **Type**: String
- **Values**: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- **Default**: `info`
- **Description**: Minimum log level to output
- **Impact**: Controls verbosity of application logs

**Examples**:
```env
# Development (detailed logs)
LOG_LEVEL=debug

# Production (minimal logs)
LOG_LEVEL=warn

# Maximum verbosity
LOG_LEVEL=trace
```

**Log Levels Hierarchy**:
1. `trace` - Most verbose
2. `debug` - Debugging information
3. `info` - General information
4. `warn` - Warnings
5. `error` - Errors
6. `fatal` - Fatal errors only

---

#### API_PREFIX
- **Type**: String
- **Default**: `/api/v1`
- **Description**: URL prefix for all API routes
- **Usage**: Enables API versioning

**Examples**:
```env
# Version 1 API
API_PREFIX=/api/v1

# Version 2 API
API_PREFIX=/api/v2

# No prefix
API_PREFIX=
```

**Impact on URLs**:
- With `/api/v1`: `http://localhost:3000/api/v1/admin/login`
- Without prefix: `http://localhost:3000/admin/login`

---

#### BASE_URL
- **Type**: String
- **Description**: Base URL of the application
- **Usage**: Used in Swagger documentation and link generation

**Examples**:
```env
# Local development
BASE_URL=http://localhost:3000

# Production with domain
BASE_URL=https://api.railnet.com

# Production with HTTPS
BASE_URL=https://railnet-api.herokuapp.com
```

---

### Database Configuration

#### DATABASE_URL
- **Type**: Connection String
- **Required**: Yes
- **Description**: PostgreSQL database connection string
- **Format**: `postgresql://[user[:password]@][host][:port][/dbname][?params]`

**Format Breakdown**:
```
postgresql://username:password@host:port/database?schema=public
          │         │         │    │    │        │
          │         │         │    │    │        └─ Schema (usually 'public')
          │         │         │    │    └────────── Database name
          │         │         │    └─────────────── Port (default: 5432)
          │         │         └──────────────────── Host/IP address
          │         └────────────────────────────── Password
          └──────────────────────────────────────── Username
```

**Examples**:

1. **Local Development**:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/railnet?schema=public"
```

2. **Local with Custom User**:
```env
DATABASE_URL="postgresql://railnet_user:mypassword@localhost:5432/railnet?schema=public"
```

3. **Docker Container**:
```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/railnet?schema=public"
```

4. **Remote Server**:
```env
DATABASE_URL="postgresql://user:pass@db.example.com:5432/railnet?schema=public"
```

5. **Cloud Provider (Heroku)**:
```env
DATABASE_URL="postgresql://user:pass@ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com:5432/dxxx?ssl=true"
```

6. **SSL Connection**:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"
```

**Connection String Parameters**:
| Parameter | Description | Example |
|-----------|-------------|---------|
| `schema` | Database schema | `schema=public` |
| `sslmode` | SSL connection mode | `sslmode=require` |
| `connect_timeout` | Connection timeout (seconds) | `connect_timeout=10` |
| `pool_timeout` | Pool timeout (seconds) | `pool_timeout=10` |

**Security Note**: 
- Never commit database credentials to version control
- Use strong passwords in production
- Enable SSL for remote connections

---

### Security Configuration

#### JWT_SECRET
- **Type**: String
- **Required**: Yes
- **Description**: Secret key for signing JWT tokens
- **Minimum Length**: 32 characters recommended
- **Security**: **CRITICAL** - Must be kept secret

**Generating a Secure Secret**:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64

# Using pwgen (if installed)
pwgen -s 64 1
```

**Examples**:
```env
# Development (weak - DO NOT USE IN PRODUCTION)
JWT_SECRET=dev-secret-key-change-in-production

# Production (strong)
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c3b7c1c9b7c8d1f3a8f5f167f44f4964e6c998dee827110c3b7c1c9b7c8d1f3a
```

**Important**:
- Different secret for each environment
- Never reuse secrets across projects
- Rotate secrets periodically
- Store securely (use secret management services in production)

---

#### JWT_EXPIRATION
- **Type**: String
- **Default**: `7d`
- **Description**: JWT token expiration time
- **Format**: Uses [ms](https://github.com/vercel/ms) library format

**Time Format Options**:
| Format | Description | Example |
|--------|-------------|---------|
| `60` | Milliseconds | 60 milliseconds |
| `2m` | Minutes | 2 minutes |
| `1h` | Hours | 1 hour |
| `7d` | Days | 7 days |
| `1y` | Years | 1 year |

**Examples**:
```env
# Short-lived (15 minutes)
JWT_EXPIRATION=15m

# Medium-lived (24 hours)
JWT_EXPIRATION=1d

# Long-lived (7 days) - default
JWT_EXPIRATION=7d

# Very long-lived (30 days)
JWT_EXPIRATION=30d
```

**Recommendations**:
- **Development**: `7d` (convenient for testing)
- **Production**: `1h` to `24h` (balanced security)
- **High Security**: `15m` (with refresh token mechanism)

---

### CORS Configuration

#### CORS_ORIGIN
- **Type**: String or Array
- **Default**: `*` (allow all origins)
- **Description**: Allowed origins for CORS requests

**Examples**:

1. **Allow All (Development)**:
```env
CORS_ORIGIN=*
```

2. **Single Origin**:
```env
CORS_ORIGIN=https://railnet-admin.com
```

3. **Multiple Origins (comma-separated)**:
```env
CORS_ORIGIN=https://railnet.com,https://admin.railnet.com,https://mobile.railnet.com
```

4. **Localhost for Development**:
```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

**Production Security**:
- Never use `*` in production
- Specify exact origins
- Use HTTPS only

---

### Rate Limiting Configuration

#### RATE_LIMIT_MAX
- **Type**: Number
- **Default**: `100`
- **Description**: Maximum number of requests per time window

#### RATE_LIMIT_TIME_WINDOW
- **Type**: Number (milliseconds)
- **Default**: `60000` (1 minute)
- **Description**: Time window for rate limiting

**Examples**:

1. **Strict Limiting**:
```env
RATE_LIMIT_MAX=50
RATE_LIMIT_TIME_WINDOW=60000  # 50 requests per minute
```

2. **Moderate Limiting**:
```env
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000  # 100 requests per minute
```

3. **Lenient Limiting**:
```env
RATE_LIMIT_MAX=1000
RATE_LIMIT_TIME_WINDOW=60000  # 1000 requests per minute
```

---

## Environment-Specific Configurations

### Development Environment

```env
# Development .env file
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=debug
API_PREFIX=/api/v1
BASE_URL=http://localhost:3000

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/railnet_dev?schema=public"

JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRATION=7d

CORS_ORIGIN=*
RATE_LIMIT_MAX=1000
```

### Production Environment

```env
# Production environment variables
NODE_ENV=production
PORT=80
HOST=0.0.0.0
LOG_LEVEL=warn
API_PREFIX=/api/v1
BASE_URL=https://api.railnet.com

DATABASE_URL="postgresql://prod_user:strong_password@db.railnet.com:5432/railnet?schema=public&sslmode=require"

JWT_SECRET=<generated-64-character-secret>
JWT_EXPIRATION=1d

CORS_ORIGIN=https://railnet.com,https://admin.railnet.com
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000
```

### Testing Environment

```env
# Testing .env.test file
NODE_ENV=test
PORT=3001
HOST=localhost
LOG_LEVEL=error
API_PREFIX=/api/v1
BASE_URL=http://localhost:3001

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/railnet_test?schema=public"

JWT_SECRET=test-secret-key
JWT_EXPIRATION=1h

CORS_ORIGIN=*
RATE_LIMIT_MAX=10000
```

## Loading Environment Variables

### In Code (config/index.ts)

```typescript
import dotenv from 'dotenv';

dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
};

// Validation
if (!config.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

if (!config.DATABASE_URL) {
  throw new Error('DATABASE_URL must be defined in environment variables');
}

export default config;
```

## Security Best Practices

### 1. Never Commit Secrets
```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

### 2. Use Environment-Specific Files
- `.env.development`
- `.env.production`
- `.env.test`

### 3. Validate Required Variables
```typescript
const required = ['DATABASE_URL', 'JWT_SECRET'];
required.forEach(key => {
  if (!process.env[key]) {
    throw new Error(`${key} is required`);
  }
});
```

### 4. Use Secret Management Services
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Cloud Secret Manager**

### 5. Rotate Secrets Regularly
- Change JWT_SECRET periodically
- Update database passwords
- Invalidate old tokens

## Troubleshooting

### Variables Not Loading
1. Check file name is exactly `.env`
2. Verify file is in correct directory
3. Restart the application
4. Check for syntax errors in `.env`

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Test connection manually:
   ```bash
   psql "postgresql://user:pass@host:port/db"
   ```

### JWT Issues
1. Ensure JWT_SECRET is set
2. Check JWT_SECRET length (minimum 32 chars)
3. Verify token expiration format

## Related Documentation
- [Getting Started Guide](getting-started.md)
- [Database Guide](database-guide.md)
- [Best Practices](best-practices.md)

---

**Last Updated**: 2025-11-24
