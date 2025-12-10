# RailNet Backend - UML and Activity Diagrams

This document contains comprehensive UML and activity diagrams for the RailNet backend system, created using Mermaid syntax.

## Table of Contents
- [Class Diagram (Database Schema)](#class-diagram-database-schema)
- [System Architecture Diagram](#system-architecture-diagram)
- [Authentication Flow](#authentication-flow)
- [Ticket Booking Flow](#ticket-booking-flow)
- [Payment Processing Flow](#payment-processing-flow)
- [Train Search Flow](#train-search-flow)
- [API Routes Component Diagram](#api-routes-component-diagram)

---

## Class Diagram (Database Schema)

This diagram shows the database models and their relationships using Prisma ORM.

```mermaid
classDiagram
    class User {
        +Int id PK
        +String email UK
        +String? firstName
        +String? lastName
        +String? phone
        +String? address
        +String password
        +String role
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Station {
        +Int id PK
        +String name UK
        +String city
        +Float latitude
        +Float longitude
        +DateTime createdAt
        +DateTime updatedAt
    }

    class TrainRoute {
        +Int id PK
        +String name UK
        +Int startStationId FK
        +Int endStationId FK
        +DateTime createdAt
        +DateTime updatedAt
    }

    class RouteStation {
        +Int id PK
        +Int trainRouteId FK
        +Int? previousStationId FK
        +Int currentStationId FK
        +Int? nextStationId FK
        +Float? distance
        +Float distanceFromStart
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Compartment {
        +Int id PK
        +String name
        +String class
        +String type
        +Float price
        +Int totalSeats
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Train {
        +Int id PK
        +String name
        +String number UK
        +Int trainRouteId FK
        +DateTime createdAt
        +DateTime updatedAt
    }

    class TrainCompartment {
        +Int id PK
        +Int trainId FK
        +Int compartmentId FK
        +Int quantity
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Seat {
        +Int id PK
        +Int trainCompartmentId FK
        +String seatNumber
        +Boolean isAvailable
        +DateTime createdAt
        +DateTime updatedAt
    }

    class TrainSchedule {
        +Int id PK
        +Int trainId FK
        +Int trainRouteId FK
        +DateTime date
        +String time
        +DateTime createdAt
        +DateTime updatedAt
    }

    class ScheduleStation {
        +Int id PK
        +Int trainScheduleId FK
        +Int stationId FK
        +String? arrivalTime
        +String? departureTime
        +Int sequence
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Ticket {
        +Int id PK
        +String ticketId UK
        +Int userId FK
        +Int trainScheduleId FK
        +Int fromStationId FK
        +Int toStationId FK
        +Int seatId FK UK
        +Int trainCompartmentId FK
        +String seatNumber
        +String passengerName
        +Int passengerAge
        +String passengerGender
        +Float price
        +String status
        +String paymentStatus
        +DateTime? expiresAt
        +DateTime? confirmedAt
        +DateTime createdAt
        +DateTime updatedAt
    }

    class PaymentTransaction {
        +String id PK
        +Int ticketId FK UK
        +String transactionId UK
        +String? sessionKey
        +Float amount
        +String currency
        +String status
        +String? paymentMethod
        +String? bankTransactionId
        +String? valId
        +String? cardType
        +DateTime? completedAt
        +String? gatewayUrl
        +String? errorMessage
        +Json? metadata
        +Json? sslcommerzData
        +DateTime createdAt
        +DateTime updatedAt
    }

    class PaymentLog {
        +String id PK
        +String transactionId
        +String action
        +Json details
        +DateTime createdAt
    }

    class CompartmentBooking {
        +Int id PK
        +Int trainScheduleId FK
        +Int trainCompartmentId FK
        +Int bookedSeats
        +Int totalSeats
        +DateTime createdAt
        +DateTime updatedAt
    }

    %% Relationships
    User "1" --o "many" Ticket : books
    
    Station "1" --o "many" RouteStation : previousStation
    Station "1" --o "many" RouteStation : currentStation
    Station "1" --o "many" RouteStation : nextStation
    Station "1" --o "many" TrainRoute : startStation
    Station "1" --o "many" TrainRoute : endStation
    Station "1" --o "many" ScheduleStation : station
    Station "1" --o "many" Ticket : fromStation
    Station "1" --o "many" Ticket : toStation
    
    TrainRoute "1" --o "many" RouteStation : has
    TrainRoute "1" --o "many" Train : uses
    TrainRoute "1" --o "many" TrainSchedule : schedules
    
    Train "1" --o "many" TrainCompartment : has
    Train "1" --o "many" TrainSchedule : schedules
    
    Compartment "1" --o "many" TrainCompartment : type
    
    TrainCompartment "1" --o "many" Seat : contains
    TrainCompartment "1" --o "many" Ticket : tickets
    TrainCompartment "1" --o "many" CompartmentBooking : bookings
    
    TrainSchedule "1" --o "many" ScheduleStation : stationTimes
    TrainSchedule "1" --o "many" Ticket : tickets
    TrainSchedule "1" --o "many" CompartmentBooking : bookings
    
    Seat "1" -- "0..1" Ticket : assigned
    
    Ticket "1" -- "1" PaymentTransaction : payments
    
    PaymentTransaction "1" --o "many" PaymentLog : logs
```

---

## System Architecture Diagram

This diagram shows the high-level architecture of the RailNet backend system.

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Dashboard]
        B[Android App]
        C[External Apps]
    end

    subgraph "API Layer - Fastify"
        D[API Gateway]
        E[Authentication Middleware]
        F[Rate Limiter]
        G[CORS Handler]
        H[Content Type Parser]
    end

    subgraph "Route Handlers"
        I[Auth Routes]
        J[Station Routes]
        K[Train Route Routes]
        L[Compartment Routes]
        M[Train Routes]
        N[Schedule Routes]
        O[Ticket Routes]
        P[Payment Routes]
    end

    subgraph "Business Logic Services"
        Q[PaymentService]
        R[CleanupService]
        S[CleanupJobs]
    end

    subgraph "Data Access Layer"
        T[Prisma ORM]
    end

    subgraph "External Services"
        U[SSLCommerz Payment Gateway]
    end

    subgraph "Database"
        V[(PostgreSQL)]
    end

    subgraph "Documentation"
        W[Swagger/OpenAPI]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    
    H --> I
    H --> J
    H --> K
    H --> L
    H --> M
    H --> N
    H --> O
    H --> P
    
    I --> T
    J --> T
    K --> T
    L --> T
    M --> T
    N --> T
    O --> T
    P --> Q
    
    Q --> T
    Q --> U
    R --> T
    S --> R
    
    T --> V
    
    D --> W

    style D fill:#4A90E2
    style T fill:#50C878
    style V fill:#E85D75
    style U fill:#FFB84D
    style W fill:#9B59B6
```

---

## Authentication Flow

This activity diagram shows the user authentication process including registration and login.

```mermaid
flowchart TD
    Start([User Starts]) --> CheckAction{Action Type?}
    
    CheckAction -->|Register| RegStart[Provide Registration Details]
    CheckAction -->|Login| LoginStart[Provide Login Credentials]
    
    RegStart --> RegValidate{Valid Input?}
    RegValidate -->|No| RegError[Return Validation Error]
    RegValidate -->|Yes| CheckExists{User Exists?}
    
    CheckExists -->|Yes| RegExists[Return User Exists Error]
    CheckExists -->|No| HashPass[Hash Password with bcrypt]
    
    HashPass --> CreateUser[Create User in Database]
    CreateUser --> GenToken1[Generate JWT Token]
    GenToken1 --> ReturnAuth1[Return User Info + Token]
    ReturnAuth1 --> End([Authentication Complete])
    
    LoginStart --> LoginValidate{Valid Input?}
    LoginValidate -->|No| LoginError[Return Validation Error]
    LoginValidate -->|Yes| FindUser[Find User by Email]
    
    FindUser --> UserFound{User Found?}
    UserFound -->|No| LoginFail[Return Invalid Credentials]
    UserFound -->|Yes| VerifyPass[Verify Password with bcrypt]
    
    VerifyPass --> PassValid{Password Valid?}
    PassValid -->|No| LoginFail
    PassValid -->|Yes| GenToken2[Generate JWT Token]
    
    GenToken2 --> ReturnAuth2[Return User Info + Token]
    ReturnAuth2 --> End
    
    RegError --> End
    RegExists --> End
    LoginError --> End
    LoginFail --> End

    style Start fill:#90EE90
    style End fill:#90EE90
    style RegError fill:#FFB6C1
    style RegExists fill:#FFB6C1
    style LoginError fill:#FFB6C1
    style LoginFail fill:#FFB6C1
    style GenToken1 fill:#87CEEB
    style GenToken2 fill:#87CEEB
    style ReturnAuth1 fill:#98FB98
    style ReturnAuth2 fill:#98FB98
```

---

## Ticket Booking Flow

This activity diagram illustrates the complete ticket booking process with validation and seat management.

```mermaid
flowchart TD
    Start([User Initiates Booking]) --> Auth{Authenticated?}
    Auth -->|No| AuthError[Return 401 Unauthorized]
    Auth -->|Yes| ValidateInput{Valid Input?}
    
    ValidateInput -->|No| InputError[Return 400 Bad Request]
    ValidateInput -->|Yes| FetchSchedule[Fetch Train Schedule]
    
    FetchSchedule --> ScheduleExists{Schedule Exists?}
    ScheduleExists -->|No| NotFound[Return 404 Not Found]
    ScheduleExists -->|Yes| ValidateStations[Validate From/To Stations in Route]
    
    ValidateStations --> StationsValid{Stations Valid?}
    StationsValid -->|No| StationError[Return 400 Invalid Stations]
    StationsValid -->|Yes| CheckOrder{Correct Order?}
    
    CheckOrder -->|No| OrderError[Return 400 Invalid Order]
    CheckOrder -->|Yes| FindCompartment[Find Train Compartment]
    
    FindCompartment --> CompExists{Compartment Exists?}
    CompExists -->|No| CompError[Return 400 Compartment Not Available]
    CompExists -->|Yes| CheckSeatBooked[Check if Seat Already Booked]
    
    CheckSeatBooked --> SeatBooked{Seat Available?}
    SeatBooked -->|No| SeatError[Return 409 Seat Already Booked]
    SeatBooked -->|Yes| GetCompBooking[Get/Create Compartment Booking]
    
    GetCompBooking --> CheckCapacity{Has Available Seats?}
    CheckCapacity -->|No| CapacityError[Return 409 No Seats Available]
    CheckCapacity -->|Yes| CalcDistance[Calculate Journey Distance]
    
    CalcDistance --> CalcPrice[Calculate Distance-Based Price]
    CalcPrice --> ValidatePrice{Price Valid?}
    ValidatePrice -->|No| PriceError[Return 400 Invalid Price]
    ValidatePrice -->|Yes| GenTicketId[Generate Unique Ticket ID]
    
    GenTicketId --> StartTx[Start Database Transaction]
    StartTx --> FindSeat[Find or Create Seat Record]
    FindSeat --> MarkUnavailable[Mark Seat as Unavailable]
    MarkUnavailable --> CreateTicket[Create Ticket Record]
    CreateTicket --> SetExpiry[Set Expiry Time +10 minutes]
    SetExpiry --> TryCommit{Commit Success?}
    
    TryCommit -->|Yes| UpdateCount[Update Compartment Booking Count]
    TryCommit -->|No| RollbackTx[Rollback Transaction]
    RollbackTx --> TxError[Return 500 Transaction Failed]
    TxError --> End
    
    UpdateCount --> FetchComplete[Fetch Complete Ticket Data]
    FetchComplete --> FormatResponse[Format Booking Response]
    FormatResponse --> ReturnSuccess[Return 201 Created with Ticket]
    ReturnSuccess --> End([Booking Complete])
    
    AuthError --> End
    InputError --> End
    NotFound --> End
    StationError --> End
    OrderError --> End
    CompError --> End
    SeatError --> End
    CapacityError --> End
    PriceError --> End
    TxError --> End

    style Start fill:#90EE90
    style End fill:#90EE90
    style ReturnSuccess fill:#98FB98
    style AuthError fill:#FFB6C1
    style InputError fill:#FFB6C1
    style NotFound fill:#FFB6C1
    style StationError fill:#FFB6C1
    style OrderError fill:#FFB6C1
    style CompError fill:#FFB6C1
    style SeatError fill:#FFB6C1
    style CapacityError fill:#FFB6C1
    style PriceError fill:#FFB6C1
    style TxError fill:#FFB6C1
    style StartTx fill:#87CEEB
    style TryCommit fill:#87CEEB
    style RollbackTx fill:#FFE4B5
```

---

## Payment Processing Flow

This activity diagram shows the complete payment processing workflow with SSLCommerz integration.

```mermaid
flowchart TD
    Start([Initiate Payment]) --> Auth{Authenticated?}
    Auth -->|No| AuthError[Return 401 Unauthorized]
    Auth -->|Yes| FetchUser[Fetch User Details]
    
    FetchUser --> FetchTicket[Fetch Ticket by Ticket ID]
    FetchTicket --> TicketExists{Ticket Exists?}
    TicketExists -->|No| NotFound[Return 404 Ticket Not Found]
    TicketExists -->|Yes| CheckStatus{Payment Status = Pending?}
    
    CheckStatus -->|No| StatusError[Return 400 Invalid Status]
    CheckStatus -->|Yes| CheckOwner{User is Owner?}
    CheckOwner -->|No| UnauthorizedAccess[Return 403 Unauthorized]
    CheckOwner -->|Yes| GenTxId[Generate Transaction ID]
    
    GenTxId --> CreateTx[Create Payment Transaction Record]
    CreateTx --> PrepareSSL[Prepare SSLCommerz Request]
    PrepareSSL --> CallSSL[Call SSLCommerz API]
    
    CallSSL --> SSLSuccess{API Success?}
    SSLSuccess -->|No| UpdateFailed[Update Transaction Status to FAILED]
    SSLSuccess -->|Yes| UpdateSession[Update Transaction with Session Key]
    
    UpdateFailed --> ReturnFail[Return Payment Initiation Failed]
    UpdateSession --> LogInitiate[Log Payment Initiation]
    LogInitiate --> ReturnURL[Return Payment Gateway URL]
    ReturnURL --> UserRedirect([User Redirected to SSLCommerz])
    
    UserRedirect --> PaymentGateway{User Completes Payment?}
    PaymentGateway -->|Cancel| CancelCallback[SSLCommerz Cancel Callback]
    PaymentGateway -->|Fail| FailCallback[SSLCommerz Fail Callback]
    PaymentGateway -->|Success| SuccessCallback[SSLCommerz Success Callback]
    
    SuccessCallback --> ValidatePayment[Validate Payment with SSLCommerz]
    ValidatePayment --> ValidationValid{Validation Success?}
    ValidationValid -->|No| ValidationFail[Log Validation Failure]
    ValidationValid -->|Yes| UpdateTxSuccess[Update Transaction to COMPLETED]
    
    UpdateTxSuccess --> UpdateTicketStatus[Update Ticket Status to CONFIRMED]
    UpdateTicketStatus --> UpdatePaymentStatus[Update Payment Status to PAID]
    UpdatePaymentStatus --> SetConfirmedAt[Set Confirmed Timestamp]
    SetConfirmedAt --> LogSuccess[Log Successful Payment]
    LogSuccess --> PaymentComplete([Payment Complete])
    
    FailCallback --> UpdateTxFail[Update Transaction to FAILED]
    UpdateTxFail --> UpdateTicketFail[Update Ticket Payment Status to FAILED]
    UpdateTicketFail --> LogFail[Log Failed Payment]
    LogFail --> PaymentFailed([Payment Failed])
    
    CancelCallback --> UpdateTxCancel[Update Transaction to CANCELLED]
    UpdateTxCancel --> UpdateTicketCancel[Update Ticket Payment Status to CANCELLED]
    UpdateTicketCancel --> LogCancel[Log Cancelled Payment]
    LogCancel --> PaymentCancelled([Payment Cancelled])
    
    subgraph "Background Process"
        Scheduler[Cleanup Job Scheduler<br/>Runs Every 5 Minutes]
        Scheduler --> FindExpired[Find Expired Unpaid Tickets]
        FindExpired --> ExpiredExists{Expired Tickets?}
        ExpiredExists -->|Yes| ExpireTickets[Update Tickets to EXPIRED]
        ExpireTickets --> FreeSeat[Mark Seats as Available]
        FreeSeat --> DecrementCount[Decrement Compartment Booking Count]
        DecrementCount --> CancelTx[Cancel Payment Transactions]
        CancelTx --> LogCleanup[Log Cleanup Statistics]
        ExpiredExists -->|No| Wait[Wait for Next Run]
        LogCleanup --> Wait
        Wait --> Scheduler
    end
    
    AuthError --> End([End])
    NotFound --> End
    StatusError --> End
    UnauthorizedAccess --> End
    ReturnFail --> End
    ValidationFail --> PaymentFailed
    PaymentComplete --> End
    PaymentFailed --> End
    PaymentCancelled --> End

    style Start fill:#90EE90
    style End fill:#90EE90
    style PaymentComplete fill:#98FB98
    style PaymentFailed fill:#FFB6C1
    style PaymentCancelled fill:#FFA500
    style AuthError fill:#FFB6C1
    style NotFound fill:#FFB6C1
    style StatusError fill:#FFB6C1
    style UnauthorizedAccess fill:#FFB6C1
    style ReturnFail fill:#FFB6C1
    style ValidationFail fill:#FFB6C1
    style Scheduler fill:#E6E6FA
    style CallSSL fill:#87CEEB
    style ValidatePayment fill:#87CEEB
```

---

## Train Search Flow

This activity diagram shows how users can search for available trains between stations.

```mermaid
flowchart TD
    Start([User Initiates Search]) --> Auth{Authenticated?}
    Auth -->|No| AuthError[Return 401 Unauthorized]
    Auth -->|Yes| ValidateParams{Valid Parameters?}
    
    ValidateParams -->|No| ValidationError[Return 400 Bad Request]
    ValidateParams -->|Yes| ParseDate[Parse Search Date]
    
    ParseDate --> QuerySchedules[Query Train Schedules for Date]
    QuerySchedules --> FetchSchedules[Fetch Schedules with Train/Route Data]
    
    FetchSchedules --> HasSchedules{Schedules Found?}
    HasSchedules -->|No| EmptyResult[Return Empty Array]
    HasSchedules -->|Yes| FilterLoop[Loop Through Each Schedule]
    
    FilterLoop --> CheckFromStation{From Station in Route?}
    CheckFromStation -->|No| NextSchedule1[Skip to Next Schedule]
    CheckFromStation -->|Yes| CheckToStation{To Station in Route?}
    
    CheckToStation -->|No| NextSchedule2[Skip to Next Schedule]
    CheckToStation -->|Yes| CheckOrder{To After From?}
    
    CheckOrder -->|No| NextSchedule3[Skip to Next Schedule]
    CheckOrder -->|Yes| GetStationTimes[Get From/To Station Times]
    
    GetStationTimes --> CalcDuration[Calculate Journey Duration]
    CalcDuration --> GetCompartments[Get Train Compartments]
    
    GetCompartments --> LoopCompartments[Loop Through Compartments]
    LoopCompartments --> CalcDistance[Calculate Distance]
    CalcDistance --> CalcCompPrice[Calculate Compartment Price]
    CalcCompPrice --> GetAvailability[Get Seat Availability]
    
    GetAvailability --> AddCompartmentInfo[Add Compartment to Result]
    AddCompartmentInfo --> MoreCompartments{More Compartments?}
    MoreCompartments -->|Yes| LoopCompartments
    MoreCompartments -->|No| AddToResults[Add Train to Results]
    
    AddToResults --> MoreSchedules{More Schedules?}
    MoreSchedules -->|Yes| FilterLoop
    MoreSchedules -->|No| SortResults[Sort Results by Time]
    
    SortResults --> FormatResults[Format Search Results]
    FormatResults --> ReturnResults[Return 200 OK with Results]
    ReturnResults --> End([Search Complete])
    
    NextSchedule1 --> MoreSchedules
    NextSchedule2 --> MoreSchedules
    NextSchedule3 --> MoreSchedules
    
    AuthError --> End
    ValidationError --> End
    EmptyResult --> End

    style Start fill:#90EE90
    style End fill:#90EE90
    style ReturnResults fill:#98FB98
    style AuthError fill:#FFB6C1
    style ValidationError fill:#FFB6C1
    style FilterLoop fill:#E6E6FA
    style LoopCompartments fill:#E6E6FA
```

---

## API Routes Component Diagram

This diagram shows the structure of API routes and their dependencies.

```mermaid
graph TB
    subgraph "Authentication Routes (/)"
        A1[POST /register]
        A2[POST /login]
        A3[GET /profile]
        A4[GET /admin/users]
    end

    subgraph "Station Routes (/stations)"
        B1[POST /]
        B2[GET /]
        B3[GET /:id]
        B4[PUT /:id]
        B5[DELETE /:id]
    end

    subgraph "Train Route Routes (/train-routes)"
        C1[POST /]
        C2[GET /]
        C3[GET /:id]
        C4[PUT /:id]
        C5[DELETE /:id]
    end

    subgraph "Compartment Routes (/compartments)"
        D1[POST /]
        D2[GET /]
        D3[GET /:id]
        D4[PUT /:id]
        D5[DELETE /:id]
    end

    subgraph "Train Routes (/trains)"
        E1[POST /]
        E2[GET /]
        E3[GET /:id]
        E4[PUT /:id]
        E5[DELETE /:id]
    end

    subgraph "Schedule Routes (/train-schedules)"
        F1[POST /]
        F2[GET /]
        F3[GET /:id]
        F4[GET /date/:date]
        F5[GET /route/:routeId]
        F6[GET /search]
        F7[GET /:id/seats]
        F8[GET /:id/available-seats]
    end

    subgraph "Ticket Routes (/tickets)"
        G1[POST /]
        G2[GET /]
        G3[GET /:id]
        G4[PUT /:id/cancel]
        G5[GET /admin/tickets]
    end

    subgraph "Payment Routes (/payments)"
        H1[POST /initiate]
        H2[GET /success]
        H3[GET /fail]
        H4[GET /cancel]
        H5[POST /ipn]
        H6[POST /cleanup]
        H7[GET /cleanup/stats]
    end

    subgraph "Middleware"
        M1[authenticate]
        M2[requireAdmin]
        M3[Rate Limiter]
        M4[CORS]
    end

    subgraph "Services"
        S1[PaymentService]
        S2[CleanupService]
        S3[CleanupJobs]
    end

    subgraph "Database Access"
        DB[Prisma Client]
    end

    subgraph "External"
        EX[SSLCommerz API]
    end

    A1 --> DB
    A2 --> DB
    A3 --> M1
    A3 --> DB
    A4 --> M2
    A4 --> DB

    B1 --> M2
    B2 --> M1
    B3 --> M1
    B4 --> M2
    B5 --> M2
    B1 --> DB
    B2 --> DB
    B3 --> DB
    B4 --> DB
    B5 --> DB

    C1 --> M2
    C2 --> M2
    C3 --> M2
    C4 --> M2
    C5 --> M2
    C1 --> DB
    C2 --> DB
    C3 --> DB
    C4 --> DB
    C5 --> DB

    D1 --> M2
    D2 --> M1
    D3 --> M1
    D4 --> M2
    D5 --> M2
    D1 --> DB
    D2 --> DB
    D3 --> DB
    D4 --> DB
    D5 --> DB

    E1 --> M2
    E2 --> M1
    E3 --> M1
    E4 --> M2
    E5 --> M2
    E1 --> DB
    E2 --> DB
    E3 --> DB
    E4 --> DB
    E5 --> DB

    F1 --> M2
    F2 --> M1
    F3 --> M1
    F4 --> M1
    F5 --> M1
    F6 --> M1
    F7 --> M1
    F8 --> M1
    F1 --> DB
    F2 --> DB
    F3 --> DB
    F4 --> DB
    F5 --> DB
    F6 --> DB
    F7 --> DB
    F8 --> DB

    G1 --> M1
    G2 --> M1
    G3 --> M1
    G4 --> M1
    G5 --> M2
    G1 --> DB
    G2 --> DB
    G3 --> DB
    G4 --> DB
    G5 --> DB

    H1 --> M1
    H1 --> S1
    H6 --> M2
    H7 --> M2
    S1 --> DB
    S1 --> EX
    S2 --> DB
    S3 --> S2

    style M1 fill:#FFE4B5
    style M2 fill:#FFE4B5
    style M3 fill:#FFE4B5
    style M4 fill:#FFE4B5
    style S1 fill:#98FB98
    style S2 fill:#98FB98
    style S3 fill:#98FB98
    style DB fill:#87CEEB
    style EX fill:#FFB84D
```

---

## Entity Relationship Diagram (ERD)

This diagram shows the relationships between database entities in a simplified format.

```mermaid
erDiagram
    USER ||--o{ TICKET : books
    USER {
        int id PK
        string email UK
        string firstName
        string lastName
        string phone
        string address
        string password
        string role
        datetime createdAt
        datetime updatedAt
    }

    STATION ||--o{ ROUTE_STATION : "previous"
    STATION ||--o{ ROUTE_STATION : "current"
    STATION ||--o{ ROUTE_STATION : "next"
    STATION ||--o{ TRAIN_ROUTE : "start"
    STATION ||--o{ TRAIN_ROUTE : "end"
    STATION ||--o{ SCHEDULE_STATION : includes
    STATION ||--o{ TICKET : "from"
    STATION ||--o{ TICKET : "to"
    STATION {
        int id PK
        string name UK
        string city
        float latitude
        float longitude
        datetime createdAt
        datetime updatedAt
    }

    TRAIN_ROUTE ||--o{ ROUTE_STATION : contains
    TRAIN_ROUTE ||--o{ TRAIN : uses
    TRAIN_ROUTE ||--o{ TRAIN_SCHEDULE : schedules
    TRAIN_ROUTE {
        int id PK
        string name UK
        int startStationId FK
        int endStationId FK
        datetime createdAt
        datetime updatedAt
    }

    ROUTE_STATION {
        int id PK
        int trainRouteId FK
        int previousStationId FK
        int currentStationId FK
        int nextStationId FK
        float distance
        float distanceFromStart
        datetime createdAt
        datetime updatedAt
    }

    COMPARTMENT ||--o{ TRAIN_COMPARTMENT : type
    COMPARTMENT {
        int id PK
        string name
        string class
        string type
        float price
        int totalSeats
        datetime createdAt
        datetime updatedAt
    }

    TRAIN ||--o{ TRAIN_COMPARTMENT : has
    TRAIN ||--o{ TRAIN_SCHEDULE : schedules
    TRAIN {
        int id PK
        string name
        string number UK
        int trainRouteId FK
        datetime createdAt
        datetime updatedAt
    }

    TRAIN_COMPARTMENT ||--o{ SEAT : contains
    TRAIN_COMPARTMENT ||--o{ TICKET : "booked-in"
    TRAIN_COMPARTMENT ||--o{ COMPARTMENT_BOOKING : tracks
    TRAIN_COMPARTMENT {
        int id PK
        int trainId FK
        int compartmentId FK
        int quantity
        datetime createdAt
        datetime updatedAt
    }

    SEAT ||--|| TICKET : assigned
    SEAT {
        int id PK
        int trainCompartmentId FK
        string seatNumber
        boolean isAvailable
        datetime createdAt
        datetime updatedAt
    }

    TRAIN_SCHEDULE ||--o{ SCHEDULE_STATION : "station-times"
    TRAIN_SCHEDULE ||--o{ TICKET : bookings
    TRAIN_SCHEDULE ||--o{ COMPARTMENT_BOOKING : tracks
    TRAIN_SCHEDULE {
        int id PK
        int trainId FK
        int trainRouteId FK
        datetime date
        string time
        datetime createdAt
        datetime updatedAt
    }

    SCHEDULE_STATION {
        int id PK
        int trainScheduleId FK
        int stationId FK
        string arrivalTime
        string departureTime
        int sequence
        datetime createdAt
        datetime updatedAt
    }

    TICKET ||--|| PAYMENT_TRANSACTION : payments
    TICKET {
        int id PK
        string ticketId UK
        int userId FK
        int trainScheduleId FK
        int fromStationId FK
        int toStationId FK
        int seatId FK UK
        int trainCompartmentId FK
        string seatNumber
        string passengerName
        int passengerAge
        string passengerGender
        float price
        string status
        string paymentStatus
        datetime expiresAt
        datetime confirmedAt
        datetime createdAt
        datetime updatedAt
    }

    PAYMENT_TRANSACTION ||--o{ PAYMENT_LOG : logs
    PAYMENT_TRANSACTION {
        string id PK
        int ticketId FK UK
        string transactionId UK
        string sessionKey
        float amount
        string currency
        string status
        string paymentMethod
        string bankTransactionId
        string valId
        string cardType
        datetime completedAt
        string gatewayUrl
        string errorMessage
        json metadata
        json sslcommerzData
        datetime createdAt
        datetime updatedAt
    }

    PAYMENT_LOG {
        string id PK
        string transactionId FK
        string action
        json details
        datetime createdAt
    }

    COMPARTMENT_BOOKING {
        int id PK
        int trainScheduleId FK
        int trainCompartmentId FK
        int bookedSeats
        int totalSeats
        datetime createdAt
        datetime updatedAt
    }
```

---

## Sequence Diagram: Complete Ticket Booking and Payment

This diagram shows the interaction between different components during the complete booking and payment process.

```mermaid
sequenceDiagram
    actor User
    participant API as API Gateway
    participant Auth as Auth Middleware
    participant TicketRoute as Ticket Routes
    participant PaymentRoute as Payment Routes
    participant PaymentSvc as Payment Service
    participant DB as Prisma/Database
    participant SSL as SSLCommerz Gateway
    participant Cleanup as Cleanup Job

    %% Ticket Booking
    User->>API: POST /tickets (booking details)
    API->>Auth: Verify JWT Token
    Auth-->>API: User Authenticated
    API->>TicketRoute: Handle Booking Request
    
    TicketRoute->>DB: Fetch Train Schedule
    DB-->>TicketRoute: Schedule Data
    
    TicketRoute->>DB: Validate Stations & Route
    DB-->>TicketRoute: Validation OK
    
    TicketRoute->>DB: Check Seat Availability
    DB-->>TicketRoute: Seat Available
    
    TicketRoute->>DB: Start Transaction
    TicketRoute->>DB: Create/Update Seat Record
    TicketRoute->>DB: Create Ticket (status: pending)
    TicketRoute->>DB: Set Expiry (+10 min)
    TicketRoute->>DB: Commit Transaction
    DB-->>TicketRoute: Ticket Created
    
    TicketRoute-->>User: 201 Created (Ticket Details)
    
    %% Payment Initiation
    User->>API: POST /payments/initiate (ticket ID)
    API->>Auth: Verify JWT Token
    Auth-->>API: User Authenticated
    API->>PaymentRoute: Handle Payment Request
    
    PaymentRoute->>PaymentSvc: initiatePayment()
    PaymentSvc->>DB: Fetch User Details
    DB-->>PaymentSvc: User Data
    
    PaymentSvc->>DB: Fetch Ticket Details
    DB-->>PaymentSvc: Ticket Data
    
    PaymentSvc->>DB: Validate Ticket Status
    PaymentSvc->>DB: Create Payment Transaction
    DB-->>PaymentSvc: Transaction Created
    
    PaymentSvc->>SSL: POST /gwprocess/v4.php (payment data)
    SSL-->>PaymentSvc: Session Key & Gateway URL
    
    PaymentSvc->>DB: Update Transaction (session key)
    PaymentSvc->>DB: Log Payment Initiation
    DB-->>PaymentSvc: Updated
    
    PaymentSvc-->>User: Payment Gateway URL
    
    %% User Payment
    User->>SSL: Navigate to Payment Gateway
    User->>SSL: Complete Payment
    
    %% Payment Success Callback
    SSL->>API: GET /payments/success?val_id=xxx&tran_id=yyy
    API->>PaymentRoute: Handle Success Callback
    PaymentRoute->>PaymentSvc: handlePaymentSuccess()
    
    PaymentSvc->>SSL: POST /validator/api/validationserverAPI.php
    SSL-->>PaymentSvc: Validation Response
    
    PaymentSvc->>DB: Update Transaction (COMPLETED)
    PaymentSvc->>DB: Update Ticket (status: confirmed)
    PaymentSvc->>DB: Update Payment Status (paid)
    PaymentSvc->>DB: Set Confirmed Timestamp
    PaymentSvc->>DB: Log Success
    DB-->>PaymentSvc: Updated
    
    PaymentRoute-->>User: Success Page/Redirect
    
    %% Background Cleanup Process
    loop Every 5 Minutes
        Cleanup->>DB: Find Expired Unpaid Tickets
        DB-->>Cleanup: List of Expired Tickets
        
        alt Has Expired Tickets
            Cleanup->>DB: Update Tickets to EXPIRED
            Cleanup->>DB: Mark Seats as Available
            Cleanup->>DB: Decrement Booking Count
            Cleanup->>DB: Cancel Payment Transactions
            Cleanup->>DB: Log Cleanup Statistics
        end
    end
```

---

## Use Case Diagram

This diagram shows the various use cases and actors in the RailNet system.

```mermaid
graph TB
    subgraph "RailNet System"
        UC1[Register Account]
        UC2[Login]
        UC3[View Profile]
        UC4[Search Trains]
        UC5[Check Seat Availability]
        UC6[Book Ticket]
        UC7[View My Tickets]
        UC8[Cancel Ticket]
        UC9[Initiate Payment]
        UC10[Manage Stations]
        UC11[Manage Train Routes]
        UC12[Manage Compartments]
        UC13[Manage Trains]
        UC14[Manage Schedules]
        UC15[View All Users]
        UC16[View All Tickets]
        UC17[Cleanup Expired Bookings]
        UC18[View Cleanup Statistics]
    end
    
    User([Regular User])
    Admin([Admin User])
    System([System/Scheduler])
    PaymentGateway([SSLCommerz Gateway])
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    
    Admin --> UC2
    Admin --> UC3
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
    Admin --> UC18
    
    System --> UC17
    
    UC9 -.-> PaymentGateway
    PaymentGateway -.-> UC9
    
    style User fill:#87CEEB
    style Admin fill:#FFB84D
    style System fill:#98FB98
    style PaymentGateway fill:#FFE4B5
```

---

## Deployment Architecture

This diagram shows how the backend system can be deployed in a production environment.

```mermaid
graph TB
    subgraph "Client Tier"
        C1[Web Browser]
        C2[Android App]
        C3[iOS App]
    end
    
    subgraph "Load Balancer"
        LB[Nginx/HAProxy]
    end
    
    subgraph "Application Tier"
        subgraph "Backend Instances"
            APP1[Fastify Node.js<br/>Instance 1]
            APP2[Fastify Node.js<br/>Instance 2]
            APP3[Fastify Node.js<br/>Instance N]
        end
        
        subgraph "Background Services"
            CRON[Cleanup Job<br/>Scheduler]
        end
    end
    
    subgraph "Data Tier"
        subgraph "Database Cluster"
            DB_PRIMARY[(PostgreSQL<br/>Primary)]
            DB_REPLICA1[(PostgreSQL<br/>Replica 1)]
            DB_REPLICA2[(PostgreSQL<br/>Replica 2)]
        end
        
        REDIS[(Redis Cache)]
    end
    
    subgraph "External Services"
        SSL[SSLCommerz<br/>Payment Gateway]
    end
    
    subgraph "Monitoring & Logging"
        LOG[Pino Logger]
        MONITOR[Application Monitoring]
    end
    
    C1 --> LB
    C2 --> LB
    C3 --> LB
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> DB_PRIMARY
    APP2 --> DB_PRIMARY
    APP3 --> DB_PRIMARY
    
    APP1 --> DB_REPLICA1
    APP2 --> DB_REPLICA1
    APP3 --> DB_REPLICA2
    
    APP1 --> REDIS
    APP2 --> REDIS
    APP3 --> REDIS
    
    APP1 --> SSL
    APP2 --> SSL
    APP3 --> SSL
    
    CRON --> DB_PRIMARY
    
    APP1 --> LOG
    APP2 --> LOG
    APP3 --> LOG
    CRON --> LOG
    
    DB_PRIMARY -.->|Replication| DB_REPLICA1
    DB_PRIMARY -.->|Replication| DB_REPLICA2
    
    LOG --> MONITOR
    
    style LB fill:#4A90E2
    style APP1 fill:#50C878
    style APP2 fill:#50C878
    style APP3 fill:#50C878
    style CRON fill:#98FB98
    style DB_PRIMARY fill:#E85D75
    style DB_REPLICA1 fill:#FFB6C1
    style DB_REPLICA2 fill:#FFB6C1
    style REDIS fill:#DC143C
    style SSL fill:#FFB84D
    style LOG fill:#9B59B6
    style MONITOR fill:#8B4789
```

---

## Notes

- All diagrams are created using Mermaid syntax and can be rendered in GitHub, GitLab, or any Mermaid-compatible viewer
- The class diagram shows the Prisma schema with all relationships
- Activity diagrams illustrate the business logic flow for key operations
- Sequence diagrams show the interaction between components
- The system architecture provides a high-level overview of the backend structure
- Color coding is used to distinguish different types of components and outcomes

### Important Design Decisions

1. **Ticket-Seat Relationship (One-to-One with Unique Constraint)**:
   - The `seatId` field in the Ticket model has a unique constraint (UK), enforcing that each seat can only be assigned to one active ticket at a time
   - This prevents double-booking of seats for the same train schedule
   - When a ticket expires or is cancelled, the seat becomes available for booking again

2. **Ticket-PaymentTransaction Relationship (One-to-One)**:
   - Each ticket has exactly one payment transaction
   - The `ticketId` field in PaymentTransaction is unique, ensuring one-to-one mapping
   - This simplifies payment tracking and prevents multiple payment attempts for the same ticket

## How to Use These Diagrams

1. **In GitHub/GitLab**: These diagrams will render automatically in markdown preview
2. **In VS Code**: Install the "Markdown Preview Mermaid Support" extension
3. **Online**: Copy the mermaid code blocks to https://mermaid.live/ for interactive editing
4. **In Documentation**: These diagrams can be embedded in any documentation that supports Mermaid

## Diagram Maintenance

When updating the codebase, remember to update these diagrams:
- Add new models to the Class Diagram
- Update activity flows when business logic changes
- Reflect new routes in the API Routes diagram
- Update the architecture diagram when adding new services
