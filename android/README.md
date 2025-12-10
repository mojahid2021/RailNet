# RailNet Android Application

Native Android application for the RailNet railway management system, built with Java.

## Overview

The RailNet Android app provides passengers with a comprehensive mobile interface to search trains, book tickets, make payments, and manage their railway bookings. The application follows modern Android development practices with a clear separation of concerns and robust architecture.

## Features

- **User Authentication**: Secure login and registration with JWT token-based authentication
- **Train Search**: Search for available trains between stations with date selection
- **Real-time Availability**: View seat availability and pricing for different compartments
- **Ticket Booking**: Select seats, enter passenger details, and book tickets
- **Payment Integration**: Secure payment processing through SSLCommerz payment gateway
- **Ticket Management**: View all booked tickets with detailed journey information
- **User Profile**: Manage user profile and view booking history
- **Map Integration**: View station locations and train routes on map

## Technology Stack

- **Language**: Java
- **Minimum SDK**: API 24 (Android 7.0)
- **Target SDK**: API 34 (Android 14)
- **Architecture**: MVP (Model-View-Presenter) pattern
- **Networking**: Retrofit 2 + OkHttp3
- **JSON Parsing**: Gson
- **UI Components**: Material Design 3 components
- **Image Loading**: Glide (for profile images)

## Project Structure

```
android/
├── app/
│   └── src/
│       └── main/
│           └── java/
│               └── com/mojahid2021/railnet/
│                   ├── MainActivity.java           # Main container activity
│                   ├── auth/                       # Authentication
│                   │   ├── LoginActivity.java
│                   │   └── RegisterActivity.java
│                   ├── home/                       # Home and search
│                   │   ├── HomeFragment.java
│                   │   ├── TrainScheduleAdapter.java
│                   │   ├── SeatAdapter.java
│                   │   └── model/
│                   │       ├── Station.java
│                   │       └── TrainSchedule.java
│                   ├── activity/                   # Booking activities
│                   │   ├── TrainsActivity.java
│                   │   ├── CompartmentActivity.java
│                   │   ├── BookingSummaryActivity.java
│                   │   ├── WebviewActivity.java
│                   │   └── myTickets/
│                   │       ├── MyTicketsActivity.java
│                   │       ├── TicketsAdapter.java
│                   │       ├── UserTicket.java
│                   │       └── TicketPrintDocumentAdapter.java
│                   ├── profile/                    # User profile
│                   │   └── ProfileFragment.java
│                   ├── map/                        # Map view
│                   │   └── MapFragment.java
│                   ├── train/                      # Train info
│                   │   └── TrainFragment.java
│                   ├── network/                    # API layer
│                   │   ├── ApiClient.java
│                   │   ├── ApiService.java
│                   │   ├── AuthInterceptor.java
│                   │   └── PaymentInitiateResponse.java
│                   └── util/                       # Utilities
│                       └── DateTimeUtils.java
└── docs/
    └── ANDROID_UML_DIAGRAMS.md                    # UML documentation
```

## Architecture

The application follows a layered architecture with clear separation of concerns:

### Presentation Layer
- **Activities**: Screen containers and navigation coordinators
- **Fragments**: Reusable UI components for bottom navigation
- **Adapters**: RecyclerView adapters for list and grid displays

### Business Logic Layer
- **Network Layer**: API client, service definitions, and interceptors
- **Utilities**: Helper classes for date/time formatting and other utilities

### Data Layer
- **Models**: Data classes representing API responses
- **Storage**: SharedPreferences for token and settings persistence

## Key Flows

### 1. Authentication Flow
1. User opens app → Check for saved token
2. If no token → Show LoginActivity
3. User logs in → Receive JWT token
4. Save token to SharedPreferences
5. Navigate to MainActivity with HomeFragment

### 2. Ticket Booking Flow
1. Select origin and destination stations
2. Choose travel date
3. Search for available trains
4. View train schedule results
5. Select train and compartment
6. Choose seat from availability grid
7. Enter passenger details
8. Confirm booking (creates pending ticket)
9. Initiate payment via SSLCommerz
10. Complete payment in WebView
11. Receive confirmed ticket

### 3. Payment Flow
1. Click "Pay Now" on booking summary
2. App calls backend `/payments/initiate`
3. Backend creates transaction and calls SSLCommerz
4. User redirected to payment gateway
5. User completes payment
6. Gateway calls backend success/fail/cancel endpoint
7. Backend validates and updates ticket status
8. User returned to app with confirmation

## API Integration

The app communicates with the RailNet backend API hosted at `https://rail-net.vercel.app/`.

### Key Endpoints
- `POST /login` - User authentication
- `POST /register` - User registration
- `GET /profile` - Fetch user profile
- `GET /stations` - Get all stations
- `GET /train-schedules/search` - Search trains
- `POST /tickets` - Book ticket
- `GET /tickets` - Get user tickets
- `POST /payments/initiate` - Initiate payment

All authenticated requests include `Authorization: Bearer <token>` header via `AuthInterceptor`.

## UML Documentation

Comprehensive UML diagrams documenting the application architecture are available in:

📄 **[ANDROID_UML_DIAGRAMS.md](./ANDROID_UML_DIAGRAMS.md)**

This documentation includes:
- **Class Diagram**: Complete class structure with relationships
- **Sequence Diagrams**: Authentication, booking, payment, and ticket viewing flows
- **Activity Diagrams**: Detailed process flows for key user journeys
- **Component Diagram**: High-level component structure
- **Package Diagram**: Package organization and dependencies

## Building the App

### Prerequisites
- Android Studio Arctic Fox or later
- JDK 11 or later
- Android SDK with API 34
- Gradle 8.0+

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/mojahid2021/RailNet.git
   cd RailNet/android
   ```

2. Open the project in Android Studio

3. Sync Gradle files

4. Build the project:
   ```bash
   ./gradlew build
   ```

5. Run on device/emulator:
   ```bash
   ./gradlew installDebug
   ```

## Configuration

### API Base URL
The backend API URL is configured in `ApiClient.java`:
```java
.baseUrl("https://rail-net.vercel.app/")
```

### Minimum Requirements
- Android 7.0 (API 24) or higher
- Internet connection for API access
- Location permission for map features (optional)

## Testing

### Unit Tests
Located in `app/src/test/java/`:
```bash
./gradlew test
```

### Instrumented Tests
Located in `app/src/androidTest/java/`:
```bash
./gradlew connectedAndroidTest
```

## Code Style

The project follows standard Java conventions:
- Package names: lowercase
- Class names: PascalCase
- Methods/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Indentation: 4 spaces

## Dependencies

Key dependencies include:
- **Retrofit**: `com.squareup.retrofit2:retrofit:2.9.0`
- **Gson Converter**: `com.squareup.retrofit2:converter-gson:2.9.0`
- **OkHttp**: `com.squareup.okhttp3:okhttp:4.10.0`
- **Material Components**: `com.google.android.material:material:1.9.0`
- **RecyclerView**: `androidx.recyclerview:recyclerview:1.3.1`

See `build.gradle` for complete dependency list.

## Security

- JWT tokens stored securely in SharedPreferences
- HTTPS enforced for all API communication
- Payment processing through certified gateway (SSLCommerz)
- No sensitive data stored in logs
- Authorization header automatically added via interceptor

## Design Documentation

Additional design documentation available:
- [BOOKING_SUMMARY_REDESIGN.md](./BOOKING_SUMMARY_REDESIGN.md) - Booking summary UI redesign
- [COMPARTMENT_ACTIVITY_REDESIGN.md](./COMPARTMENT_ACTIVITY_REDESIGN.md) - Compartment selection UI
- [FRAGMENT_HOME_REDESIGN.md](./FRAGMENT_HOME_REDESIGN.md) - Home fragment improvements
- [PROFILE_DESIGN.md](./PROFILE_DESIGN.md) - Profile screen design
- [PROFILE_REDESIGN_COVER.md](./PROFILE_REDESIGN_COVER.md) - Profile cover photo feature

## Known Issues

See [ERROR_FIXES_SUMMARY.md](./ERROR_FIXES_SUMMARY.md) and [CLASSCASTEXCEPTION_FIX.md](./CLASSCASTEXCEPTION_FIX.md) for resolved issues and fixes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).

See the main [LICENSE](../LICENSE) file for details.

## Support

For issues, questions, or contributions:
- GitHub Issues: [https://github.com/mojahid2021/RailNet/issues](https://github.com/mojahid2021/RailNet/issues)
- Email: aammojahid@gmail.com

---

**© 2025 RailNet Project — Developed by Team error2k21**
