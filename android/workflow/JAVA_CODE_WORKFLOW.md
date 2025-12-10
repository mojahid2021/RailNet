# RailNet Android Application - Java Code Workflow Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Package Structure](#package-structure)
3. [Application Flow](#application-flow)
4. [Component Details](#component-details)
5. [Network Communication](#network-communication)
6. [Data Models](#data-models)
7. [UI Components](#ui-components)
8. [User Journey](#user-journey)
9. [Code Interactions](#code-interactions)
10. [Best Practices](#best-practices)

---

## 1. Architecture Overview

The RailNet Android application follows a **layered architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│  (Activities, Fragments, Adapters, Views)               │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                    Business Logic                        │
│     (Event Handlers, Validation, Data Processing)       │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                    Network Layer                         │
│   (Retrofit, ApiService, ApiClient, Interceptors)       │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│    (Models, SharedPreferences, Local Storage)           │
└─────────────────────────────────────────────────────────┘
```

### Key Design Patterns Used:
- **MVC (Model-View-Controller)**: Activities/Fragments act as controllers
- **Singleton Pattern**: ApiClient provides single Retrofit instance
- **Adapter Pattern**: RecyclerView adapters for list displays
- **Observer Pattern**: Retrofit callbacks for async operations
- **Factory Pattern**: BitmapDescriptorFactory for map markers

---

## 2. Package Structure

```
com.mojahid2021.railnet/
├── activity/               # Secondary activities (booking, tickets, trains)
│   ├── BookingSummaryActivity.java
│   ├── CompartmentActivity.java
│   ├── MyTicketsActivity.java
│   ├── TrainsActivity.java
│   └── WebviewActivity.java
│
├── adapter/                # RecyclerView adapters for lists
│   ├── SeatAdapter.java
│   ├── TicketPrintDocumentAdapter.java
│   ├── TicketsAdapter.java
│   └── TrainScheduleAdapter.java
│
├── auth/                   # Authentication activities
│   ├── LoginActivity.java
│   └── RegisterActivity.java
│
├── home/                   # Home screen fragment
│   └── HomeFragment.java
│
├── map/                    # Map fragment for station locations
│   └── MapFragment.java
│
├── model/                  # Data models (POJOs)
│   ├── Station.java
│   ├── TrainSchedule.java
│   └── UserTicket.java
│
├── network/                # Network layer components
│   ├── ApiClient.java
│   ├── ApiService.java
│   ├── AuthInterceptor.java
│   └── PaymentInitiateResponse.java
│
├── profile/                # User profile fragment
│   └── ProfileFragment.java
│
├── train/                  # Train fragment (legacy/future use)
│   └── TrainFragment.java
│
├── util/                   # Utility classes
│   └── DateTimeUtils.java
│
└── MainActivity.java       # Main container activity
```

---

## 3. Application Flow

### 3.1 App Launch Flow

```
Application Start
      ↓
MainActivity.onCreate()
      ↓
Check Authentication Token in SharedPreferences
      ↓
  ┌───────────────┐
  │ Token exists? │
  └───────────────┘
    ↓           ↓
   YES          NO
    ↓           ↓
Show Main     Navigate to
Navigation    LoginActivity
    ↓
Load HomeFragment
```

### 3.2 Authentication Flow

```
LoginActivity
      ↓
User enters email & password
      ↓
Validate input (non-empty)
      ↓
Create credentials Map<String, String>
      ↓
Call ApiService.login(credentials)
      ↓
  ┌─────────────────┐
  │ Response Success? │
  └─────────────────┘
    ↓           ↓
   YES          NO
    ↓           ↓
Parse JSON    Show error
Extract token  message
    ↓
Save token to SharedPreferences
    ↓
Navigate to MainActivity
    ↓
Load HomeFragment
```

### 3.3 Main Navigation Flow

```
MainActivity (Bottom Navigation)
      ↓
┌──────────────────────────────────────┐
│  Home  │  Map  │  Profile  │         │
└──────────────────────────────────────┘
    ↓        ↓         ↓
HomeFragment  MapFragment  ProfileFragment
```

---

## 4. Component Details

### 4.1 MainActivity

**Purpose**: Main container activity with bottom navigation

**Key Responsibilities**:
- Check authentication status on launch
- Manage fragment navigation (Home, Map, Profile)
- Handle bottom navigation UI state
- Setup edge-to-edge display with system bars

**Key Methods**:
- `onCreate()`: Initialize views, check authentication, setup navigation
- `loadFragment(Fragment)`: Replace current fragment in container
- `highLightNavigation(LinearLayout)`: Update selected navigation item UI
- `configureNavigation()`: Setup click listeners for navigation items

**Navigation Flow**:
```java
homeLayout.setOnClickListener(v -> {
    loadFragment(new HomeFragment());
    highLightNavigation(homeLayout);
});
```

### 4.2 LoginActivity

**Purpose**: User authentication screen

**Key Responsibilities**:
- Validate user credentials
- Make login API call
- Store authentication token
- Navigate to MainActivity on success

**Network Interaction**:
```java
// 1. Prepare credentials
Map<String, String> credentials = new HashMap<>();
credentials.put("email", email);
credentials.put("password", password);

// 2. Call API
ApiService apiService = ApiClient.getRetrofit(this).create(ApiService.class);
Call<ResponseBody> call = apiService.login(credentials);

// 3. Handle response
call.enqueue(new Callback<ResponseBody>() {
    @Override
    public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
        // Parse token, save to SharedPreferences, navigate to MainActivity
    }
    
    @Override
    public void onFailure(Call<ResponseBody> call, Throwable t) {
        // Show error message
    }
});
```

### 4.3 HomeFragment

**Purpose**: Main search interface for finding trains

**Key Responsibilities**:
- Display station selection dropdowns (From/To)
- Date picker for travel date
- Fetch stations from API
- Validate search criteria
- Navigate to TrainsActivity with search parameters

**Lifecycle Flow**:
```
onCreateView()
    ↓
initializeViews()
    ↓
setupEventListeners()
    ↓
initializeDate()
    ↓
fetchStations() [API Call]
    ↓
processStations() [Update UI]
    ↓
User interacts
    ↓
performSearch()
    ↓
Navigate to TrainsActivity
```

**Key Features**:
- **Station Selection**: AutoCompleteTextView with dropdown
- **Date Selection**: DatePickerDialog with minimum date validation
- **Data Persistence**: Save/restore selections using SharedPreferences
- **Validation**: Ensure both stations selected and different

**Code Example - Station Fetching**:
```java
private void fetchStations() {
    ApiService apiService = ApiClient.getRetrofit(requireActivity()).create(ApiService.class);
    Call<List<Station>> call = apiService.getStations();
    
    call.enqueue(new Callback<List<Station>>() {
        @Override
        public void onResponse(Call<List<Station>> call, Response<List<Station>> response) {
            if (response.isSuccessful() && response.body() != null) {
                processStations(response.body());
            }
        }
        
        @Override
        public void onFailure(Call<List<Station>> call, Throwable t) {
            Log.e(TAG, "Failed to fetch stations", t);
        }
    });
}
```

### 4.4 TrainsActivity

**Purpose**: Display available train schedules for selected route

**Key Responsibilities**:
- Receive search parameters from HomeFragment
- Fetch train schedules from API
- Display schedules in RecyclerView
- Handle loading, empty, and error states
- Navigate to CompartmentActivity when train selected

**Data Flow**:
```
Intent Extras → Extract Data → Validate → Fetch Schedules → Parse Response → Display
```

**State Management**:
- **Loading State**: Show progress indicator
- **Success State**: Display train list with count
- **Empty State**: Show "no trains found" message
- **Error State**: Show error message

**Code Example - Schedule Fetching**:
```java
private void fetchTrainSchedules() {
    showLoading(true);
    
    ApiService apiService = ApiClient.getRetrofit(this).create(ApiService.class);
    Call<ResponseBody> call = apiService.searchTrainSchedules(fromId, toId, date);
    
    call.enqueue(new Callback<ResponseBody>() {
        @Override
        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
            showLoading(false);
            
            if (response.isSuccessful() && response.body() != null) {
                String body = response.body().string();
                List<TrainSchedule> schedules = parseSchedulesResponse(body);
                
                if (schedules != null && !schedules.isEmpty()) {
                    showSchedules(schedules);
                } else {
                    showEmptyState();
                }
            }
        }
        
        @Override
        public void onFailure(Call<ResponseBody> call, Throwable t) {
            showLoading(false);
            showEmptyState();
        }
    });
}
```

### 4.5 CompartmentActivity

**Purpose**: Select train compartment and seat

**Key Responsibilities**:
- Display available compartments as chips
- Show seat grid for selected compartment
- Handle seat selection with visual feedback
- Validate selection before proceeding
- Navigate to BookingSummaryActivity

**UI Components**:
- **ChipGroup**: Display compartment options
- **RecyclerView with GridLayoutManager**: Display seats in 4-column grid
- **SeatAdapter**: Handle seat selection state

**Seat Selection Flow**:
```
Select Compartment Chip
    ↓
Load Seats for Compartment
    ↓
Display in Grid (4 columns)
    ↓
User Selects Seat
    ↓
Visual Feedback (highlight selected)
    ↓
Enable "Next" Button
    ↓
Navigate to BookingSummaryActivity
```

### 4.6 BookingSummaryActivity

**Purpose**: Collect passenger details and complete booking

**Key Responsibilities**:
- Display booking summary (train, seat, price)
- Collect passenger information (name, age, gender)
- Submit booking request to API
- Handle payment initiation
- Show booking confirmation

**Booking Flow**:
```
Display Summary
    ↓
User Enters Passenger Details
    ↓
Validate Input
    ↓
Submit Booking (POST /tickets)
    ↓
Receive Ticket ID & Status
    ↓
  ┌────────────────┐
  │ Payment Required? │
  └────────────────┘
    ↓           ↓
   YES          NO
    ↓           ↓
Initiate     Show Success
Payment      Message
    ↓
Open WebView for Payment
    ↓
Handle Payment Callback
    ↓
Update Ticket Status
```

**Code Example - Booking Submission**:
```java
private void submitBooking() {
    // Collect form data
    String name = etName.getText().toString();
    String age = etAge.getText().toString();
    String gender = spinnerGender.getText().toString();
    
    // Create JSON body
    JSONObject json = new JSONObject();
    json.put("trainScheduleId", trainScheduleId);
    json.put("compartmentId", compartmentId);
    json.put("seatNumber", seatNumber);
    json.put("fromStationId", fromStationId);
    json.put("toStationId", toStationId);
    json.put("passengerName", name);
    json.put("passengerAge", age);
    json.put("passengerGender", gender);
    
    // Make API call
    RequestBody body = RequestBody.create(json.toString(), JSON_MEDIA_TYPE);
    Call<ResponseBody> call = apiService.bookTicket(body);
    
    call.enqueue(new Callback<ResponseBody>() {
        @Override
        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
            // Parse response, show confirmation, handle payment
        }
        
        @Override
        public void onFailure(Call<ResponseBody> call, Throwable t) {
            // Show error
        }
    });
}
```

### 4.7 MyTicketsActivity

**Purpose**: Display user's booked tickets

**Key Responsibilities**:
- Fetch user tickets from API
- Display tickets in RecyclerView
- Show ticket statistics (total, upcoming)
- Handle loading and empty states
- Enable ticket printing/viewing

**Ticket Display Flow**:
```
onCreate()
    ↓
Fetch Tickets (GET /tickets)
    ↓
Parse Response
    ↓
Display in RecyclerView
    ↓
Show Statistics
```

### 4.8 ProfileFragment

**Purpose**: Display user profile and menu options

**Key Responsibilities**:
- Fetch user profile data from API
- Display user information (name, email, phone, location)
- Show member since date
- Provide navigation to My Tickets
- Handle logout (future implementation)

**Profile Loading Flow**:
```
onViewCreated()
    ↓
loadUserData()
    ↓
GET /profile
    ↓
Parse User Data
    ↓
Update UI with user info
```

### 4.9 MapFragment

**Purpose**: Display railway stations on Google Maps

**Key Responsibilities**:
- Initialize Google Maps
- Request location permissions
- Show user's current location
- Display station markers on map
- Animate camera to user location
- Handle map interactions

**Map Features**:
- **Current Location**: Blue pulsing circle indicator
- **Station Markers**: Custom markers for railway stations
- **Camera Animation**: Smooth camera movements
- **Custom Styling**: Apply map style JSON
- **Location Updates**: Real-time location tracking

---

## 5. Network Communication

### 5.1 Network Architecture

```
Activity/Fragment
      ↓
ApiClient.getRetrofit(context)
      ↓
AuthInterceptor (adds token)
      ↓
OkHttpClient
      ↓
Retrofit
      ↓
ApiService Interface
      ↓
HTTP Request
      ↓
Backend API (https://rail-net.vercel.app/)
      ↓
HTTP Response
      ↓
Retrofit Callback
      ↓
Handle Response in Activity/Fragment
```

### 5.2 ApiClient Class

**Purpose**: Provides configured Retrofit instance

**Key Features**:
- **Singleton Pattern**: Single Retrofit instance for entire app
- **Authentication**: AuthInterceptor adds token to requests
- **Base URL**: https://rail-net.vercel.app/
- **JSON Conversion**: Gson converter for serialization/deserialization

**Code Structure**:
```java
public class ApiClient {
    private static Retrofit secureRetrofit = null;
    
    public static Retrofit getRetrofit(Context context) {
        if (secureRetrofit == null) {
            OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(chain -> {
                    // Get token from SharedPreferences
                    String token = getTokenFromPreferences(context);
                    
                    // Add Authorization header
                    Request.Builder builder = chain.request().newBuilder();
                    if (token != null) {
                        builder.header("Authorization", "Bearer " + token);
                    }
                    
                    return chain.proceed(builder.build());
                })
                .build();
            
            secureRetrofit = new Retrofit.Builder()
                .baseUrl("https://rail-net.vercel.app/")
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        }
        return secureRetrofit;
    }
}
```

### 5.3 ApiService Interface

**Purpose**: Define API endpoints

**Endpoints**:

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | /login | User authentication | No |
| POST | /register | User registration | No |
| GET | /profile | Get user profile | Yes |
| GET | /stations | Fetch all stations | Yes |
| GET | /train-schedules/search | Search trains | Yes |
| POST | /tickets | Book ticket | Yes |
| GET | /tickets | Get user tickets | Yes |
| GET | /tickets/{id} | Get ticket details | Yes |
| POST | /payments/initiate | Initiate payment | Yes |

**Code Example**:
```java
public interface ApiService {
    @POST("login")
    Call<ResponseBody> login(@Body Map<String, String> credentials);
    
    @GET("stations")
    Call<List<Station>> getStations();
    
    @GET("train-schedules/search")
    Call<ResponseBody> searchTrainSchedules(
        @Query("fromStationId") String fromStationId,
        @Query("toStationId") String toStationId,
        @Query("date") String date
    );
    
    @POST("tickets")
    Call<ResponseBody> bookTicket(@Body RequestBody body);
    
    @GET("tickets")
    Call<ResponseBody> getTickets();
}
```

### 5.4 Authentication Flow

**Token Storage**:
```java
// Save token after login
SharedPreferences prefs = getSharedPreferences("UserPreferences", MODE_PRIVATE);
prefs.edit().putString("token", token).apply();
```

**Token Retrieval**:
```java
// Interceptor retrieves token for each request
SharedPreferences prefs = context.getSharedPreferences("UserPreferences", MODE_PRIVATE);
String token = prefs.getString("token", null);
```

**Request Header**:
```
Authorization: Bearer <token>
```

---

## 6. Data Models

### 6.1 Station Model

**File**: `model/Station.java`

**Purpose**: Represents a railway station

**Fields**:
```java
public class Station {
    public int id;              // Unique station ID
    public String name;         // Station name
    public String city;         // City location
    public double latitude;     // GPS latitude
    public double longitude;    // GPS longitude
    public String createdAt;    // Creation timestamp
    public String updatedAt;    // Update timestamp
}
```

**Usage**:
- HomeFragment: Populate station dropdowns
- MapFragment: Display station markers on map
- TrainsActivity: Display route information

### 6.2 TrainSchedule Model

**File**: `model/TrainSchedule.java`

**Purpose**: Represents a train schedule with route details

**Key Fields**:
- Train information (id, name, type)
- Schedule timing (departure, arrival)
- Route information (from/to stations)
- Compartments (available seats)
- Pricing information

**Usage**:
- TrainsActivity: Display available trains
- CompartmentActivity: Show train details and compartments

### 6.3 UserTicket Model

**File**: `model/UserTicket.java`

**Purpose**: Represents a booked ticket

**Key Fields**:
- Ticket ID and status
- Passenger details
- Train and route information
- Booking and travel dates
- Payment status

**Usage**:
- MyTicketsActivity: Display user's tickets
- TicketsAdapter: Render ticket cards

---

## 7. UI Components

### 7.1 RecyclerView Adapters

#### TrainScheduleAdapter
**Purpose**: Display list of train schedules

**Key Features**:
- ViewHolder pattern for performance
- Click listener for train selection
- Bind train data to views

#### SeatAdapter
**Purpose**: Display grid of seats

**Key Features**:
- Grid layout support
- Selection state management
- Visual feedback for selected seat
- Efficient updates (only affected items)

#### TicketsAdapter
**Purpose**: Display list of booked tickets

**Key Features**:
- Display ticket details
- Handle ticket actions (view, print)
- Status indicators

### 7.2 Utility Classes

#### DateTimeUtils
**File**: `util/DateTimeUtils.java`

**Purpose**: Date and time formatting utilities

**Key Methods**:
- `parseIsoToDate(String)`: Parse ISO date strings
- `formatDisplayDate(Date)`: Format for UI display
- `formatApiDate(Date)`: Format for API requests
- `formatTimeForDisplay(String)`: Format time strings

**Usage Example**:
```java
// In HomeFragment
SimpleDateFormat apiFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
String dateString = apiFormat.format(selectedDate.getTime());

// In TrainScheduleAdapter
String displayDate = DateTimeUtils.formatDisplayDateFromIso(schedule.date);
String displayTime = DateTimeUtils.formatTimeForDisplay(schedule.departureTime);
```

---

## 8. User Journey

### 8.1 Complete Booking Journey

```
1. Launch App
   ↓
2. Login/Register
   ↓
3. HomeFragment
   - Select From Station
   - Select To Station
   - Select Date
   - Click Search
   ↓
4. TrainsActivity
   - View available trains
   - See departure/arrival times
   - Check prices
   - Select a train
   ↓
5. CompartmentActivity
   - Select compartment type
   - View seat layout
   - Select seat
   - Click Next
   ↓
6. BookingSummaryActivity
   - Review booking details
   - Enter passenger info
   - Confirm booking
   ↓
7. Payment (if required)
   - Initiate payment
   - Complete in WebView
   - Return to app
   ↓
8. Booking Confirmation
   - View ticket details
   - Ticket ID displayed
   ↓
9. My Tickets
   - View all tickets
   - Print/Download ticket
```

### 8.2 Alternative Flows

#### View Past Tickets
```
ProfileFragment → Click "My Tickets" → MyTicketsActivity → View ticket list
```

#### View Stations on Map
```
MainActivity → Click Map Tab → MapFragment → View station markers
```

#### Logout (Future)
```
ProfileFragment → Click Logout → Clear SharedPreferences → Navigate to Login
```

---

## 9. Code Interactions

### 9.1 Fragment-Activity Communication

**Method 1: Intent with Extras**
```java
// From HomeFragment to TrainsActivity
Intent intent = new Intent(requireContext(), TrainsActivity.class);
intent.putExtra("fromStationId", fromId);
intent.putExtra("toStationId", toId);
intent.putExtra("date", date);
startActivity(intent);
```

**Method 2: Shared Preferences**
```java
// Save data
SharedPreferences prefs = requireContext().getSharedPreferences("UserPreferences", MODE_PRIVATE);
prefs.edit().putInt("selected_from_id", station.id).apply();

// Retrieve data
int savedId = prefs.getInt("selected_from_id", -1);
```

### 9.2 Adapter-Activity Communication

**Using Listener Interface**
```java
// In Adapter
public interface OnItemClickListener {
    void onItemClick(TrainSchedule schedule);
}

// In Activity
adapter = new TrainScheduleAdapter(schedule -> {
    navigateToCompartmentActivity(schedule);
});
```

### 9.3 Network-UI Communication

**Using Retrofit Callbacks**
```java
call.enqueue(new Callback<ResponseBody>() {
    @Override
    public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
        // Update UI on main thread
        runOnUiThread(() -> updateUI(response));
    }
    
    @Override
    public void onFailure(Call<ResponseBody> call, Throwable t) {
        // Show error on main thread
        runOnUiThread(() -> showError(t.getMessage()));
    }
});
```

---

## 10. Best Practices

### 10.1 Code Organization

✅ **Do**:
- Separate concerns into packages (auth, network, model, etc.)
- Use meaningful class and method names
- Keep methods small and focused
- Use constants for magic strings and numbers

❌ **Don't**:
- Put all code in one file
- Use vague variable names
- Create god classes with too many responsibilities

### 10.2 Network Calls

✅ **Do**:
- Always handle both success and failure cases
- Show loading indicators during network operations
- Validate data before making API calls
- Use proper error messages

❌ **Don't**:
- Make network calls on main thread
- Ignore error cases
- Assume network is always available

### 10.3 UI/UX

✅ **Do**:
- Provide visual feedback for user actions
- Show loading states for async operations
- Validate user input before submission
- Handle empty states gracefully

❌ **Don't**:
- Leave users wondering if action succeeded
- Submit without validation
- Crash on empty data

### 10.4 Data Persistence

✅ **Do**:
- Use SharedPreferences for small data (tokens, preferences)
- Clear sensitive data on logout
- Use proper keys for stored values

❌ **Don't**:
- Store large objects in SharedPreferences
- Keep sensitive data longer than needed
- Use hardcoded strings as keys

### 10.5 Memory Management

✅ **Do**:
- Clean up resources in onDestroy()
- Use weak references when needed
- Cancel network calls when activity destroyed

❌ **Don't**:
- Hold references to activities in static fields
- Forget to unregister listeners
- Let network calls run after activity finished

---

## Summary

The RailNet Android application is a well-structured railway ticket booking system that follows modern Android development practices. The app uses a layered architecture with clear separation between UI, business logic, network, and data layers.

**Key Takeaways**:
1. **Authentication-first**: App checks token before allowing access
2. **Fragment-based navigation**: Main screens are fragments in MainActivity
3. **Retrofit for networking**: Type-safe HTTP client with interceptors
4. **RecyclerView for lists**: Efficient list display with adapters
5. **SharedPreferences for persistence**: Store user preferences and auth token
6. **Proper error handling**: Network errors and empty states handled
7. **Modern UI**: Edge-to-edge display with Material Design components

This documentation provides a comprehensive guide to understanding, maintaining, and extending the RailNet Android application.
