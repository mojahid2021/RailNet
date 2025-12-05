# RailNet API Postman Collection

This Postman collection provides comprehensive testing coverage for the RailNet Railway Booking System API.

## 📋 What's Included

### Authentication
- User registration (regular user and admin)
- User login with JWT token storage

### Stations Management
- Create stations (Admin only)
- Get all stations
- Get station by ID

### Compartments Management
- Create compartments (Admin only)
- Get all compartments
- Get compartment by ID

### Train Routes Management
- Create train routes with stations (Admin only)
- Get all train routes (Admin only)
- Get train route by ID (Admin only)

### Trains Management
- Create trains with compartments (Admin only)
- Get all trains
- Get train by ID

### Train Schedules Management
- Create train schedules (Admin only)
- Get all schedules
- Get schedule by ID
- Get schedules by date
- Get schedules by route
- Search schedules with filters
- Get seat layout for a schedule
- Get available seats for a schedule

### Ticket Booking
- Book train tickets
- Get user's tickets
- Get ticket by ID
- Cancel tickets

### Payment Integration
- Initiate SSLCommerz payments
- Payment success/fail/cancel callbacks
- IPN (Instant Payment Notification)
- Cleanup expired bookings (Admin)

## 🚀 Getting Started

### Prerequisites
1. RailNet backend server running on `http://localhost:3000`
2. PostgreSQL database with proper schema
3. SSLCommerz payment gateway credentials (for payment testing)

### Setup Steps

1. **Import the Collection**
   - Open Postman
   - Click "Import" button
   - Select "File" tab
   - Choose `RailNet_API_Postman_Collection.json`

2. **Set Environment Variables**
   - Create a new environment in Postman
   - Set `base_url` to your API URL (default: `http://localhost:3000`)

3. **Run Tests in Order**
   - Start with Authentication → Register Admin
   - Then Authentication → Login Admin
   - Create required data (Stations, Compartments, Routes, Trains, Schedules)
   - Test user registration and login
   - Test ticket booking and payment flow

## 🔄 Test Flow

### 1. Setup (Admin Only)
```
Register Admin → Login Admin → Create Stations → Create Compartments → Create Routes → Create Trains → Create Schedules
```

### 2. User Journey
```
Register User → Login User → Search Schedules → Book Ticket → Initiate Payment → Complete Payment
```

### 3. Management
```
View Tickets → Cancel Ticket → Cleanup Expired Bookings
```

## 📊 Collection Variables

The collection automatically stores important data:
- `user_token` - JWT token for regular users
- `admin_token` - JWT token for admin users
- `ticket_id` - Database ID of booked ticket
- `ticket_ticketId` - Human-readable ticket ID
- `payment_url` - SSLCommerz payment URL
- `transaction_id` - Payment transaction ID

## 🔧 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/stations` | Create station | Admin |
| GET | `/stations` | Get all stations | User |
| GET | `/stations/:id` | Get station by ID | User |
| POST | `/compartments` | Create compartment | Admin |
| GET | `/compartments` | Get all compartments | User |
| POST | `/train-routes` | Create train route | Admin |
| GET | `/train-routes` | Get all routes | Admin |
| POST | `/trains` | Create train | Admin |
| GET | `/trains` | Get all trains | User |
| POST | `/train-schedules` | Create schedule | Admin |
| GET | `/train-schedules` | Get all schedules | User |
| GET | `/train-schedules/search` | Search schedules | User |
| GET | `/train-schedules/:id/seats` | Get seat layout | User |
| POST | `/tickets` | Book ticket | User |
| GET | `/tickets` | Get user tickets | User |
| PUT | `/tickets/:id/cancel` | Cancel ticket | User |
| POST | `/payments/initiate` | Initiate payment | User |
| GET | `/payments/success` | Payment success | No |
| GET | `/payments/fail` | Payment failure | No |
| GET | `/payments/cancel` | Payment cancel | No |
| POST | `/payments/ipn` | Payment IPN | No |

## 💡 Testing Tips

1. **Run in Order**: Execute requests in the suggested order to avoid dependency issues
2. **Check Variables**: Monitor collection variables to ensure data flows correctly
3. **Error Handling**: Test error scenarios by modifying request data
4. **Authentication**: Use appropriate tokens for admin vs user endpoints
5. **Payment Testing**: Use SSLCommerz sandbox environment for payment testing

## 🔒 Security Notes

- JWT tokens are automatically stored and used for authenticated requests
- Admin endpoints require admin role tokens
- User endpoints require user role tokens
- Public endpoints (payment callbacks) don't require authentication

## 📝 Sample Data

The collection includes sample data for:
- 3 stations (Dhaka, Chittagong, Sylhet)
- 2 compartment types (AC Business, Economy Non-AC)
- Train routes and schedules
- User registration data
- Ticket booking examples

## 🐛 Troubleshooting

- **401 Unauthorized**: Check if correct token is being used
- **403 Forbidden**: Ensure admin token for admin-only endpoints
- **404 Not Found**: Verify IDs exist in database
- **400 Bad Request**: Check request body format and required fields
- **409 Conflict**: Schedule or seat already booked

## 📞 Support

For API documentation and schema details, refer to the `docs/` folder in the backend repository.