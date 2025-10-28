# RailNet — A Comprehensive Railway Management System.

RailNet is a mobile (Android) passenger railway application backed by a robust microservices backend and non relational database (PostgreSQL). It models stations, tracks (graph), trains, schedules and passenger bookings with seat allocation, while providing advanced capabilities: AI-based ETA & demand prediction, simulated real-time train tracking (position interpolation from schedules), dynamic fare pricing, analytics dashboards, and a secure, auditable booking pipeline.

---
### Summary

#### RailNet is built to be:
- Practical — Ready with a working mobile app and backend.
- Scalable — Designed for high-concurrency seat booking using transactional safety and optional distributed locks.
- International-standard — Timezone-aware, i18n-ready, GDPR-like PII protections and WCAG accessibility considerations.
- Futuristic — ML-driven features, intelligent seat allocation and an extensible plugin architecture.

### Technology Stack
- `Mobile`: _Native Android (Java)._
- `Backend`: _Node.js (TypeScript)._
- `Database`: _PostgreSQL (with PostGIS support)._
- `Cache & Locks`:
- `ML/AI`: _Open AI (API)._
- `Storage`: _MinIO / AWS S3 (receipts, audit logs, backups)._
- `Auth`: _OAuth2 + JWT._
- `CI/CD`: _GitHub Actions._
- `Containerization & Infra`: _Docker._
- `Monitoring`: _Logs and Health Checks._
- `Testing`: _Postman for API._

### Core Goals & Non-Functional Requirements
- Accuracy & Timezone correctness: all schedule timestamps are stored as timestamptz. Station timezone metadata is used for presentation.
- Booking concurrency safety: transactional seat holds and atomic seat assignment.
- Scalability & Performance: read-replicas, caching, and asynchronous tasks for heavy computations (ML scoring, analytics).
- Security & Privacy: TLS, RBAC, encrypted PII, audit trails, secure backups.
- Interoperability: OpenAPI-first REST endpoints; mobile SDK / client libraries available.
- Observability: structured logs, metrics, tracing (OpenTelemetry).
- UX: mobile-first, accessible UI, offline support for key flows.

### Product Scope & Feature List
#### Core:
- Stations CRUD + metadata (code, geo point, country, timezone).
- Tracks (edges) forming an undirected graph; distance_km.
- Trains (ID, code, name, type, max_speed).
- Routes & RouteStations (ordered station lists).
- Daily Schedules: schedule per train per service_date with per-station arrival/departure times.
- Coaches & Seats: physical composition of trains.
- Passenger profiles (secure PII handling).
- Bookings: create/confirm/cancel with from/to sequences, coach & seat allocation.
- Seat availability checking (segment overlap logic).
- Admin panel: manage stations, trains, schedules, fares, and bookings.
#### Advanced
- AI/ML
  - ETA & travel-time prediction model using historical schedule, delay, and operational data.
  - Demand forecasting (per-train/per-route) to inform capacity planning & dynamic pricing.
- Simulated Real-time Tracking
  - Position interpolation based on schedule timestamps and optional speed profile (no GPS required).
  - Live map playback on client and admin widgets.
- Dynamic Pricing Engine
  - Fare adjustments based on demand, occupancy, time-to-departure, events and rules engine.
- Intelligent Seat Allocation
  - Minimize fragmentation, prefer contiguous seats for groups, support seat preferences (window/aisle).
- Passenger Analytics Dashboard
  - Real-time KPIs, ridership heatmaps (geospatial), revenue by route/day, cancellation rates.
- Multi-language UI & accessibility
  - Localized strings plus support for RTL if needed; WCAG color/contrast & large text.
- Payment Integration
  - Pluggable gateway architecture (SSLCOMMERZ, bKash). Support for payment webhooks & reconciliation.
- Audit & Compliance
  - Immutable booking event log, right-to-export/delete personal data.
- DevOps & CI/CD
  - Containerized services, GitHub Actions, Infrastructure as Code (Terraform), DB migration tool (Flyway/Liquibase).
- Monitoring & Ops
  - Centralized logs (ELK / Loki), healthchecks & alerting.
- APIs
  - Support for REST gateway for aggregated queries.

### High-level Architecture (modules)
  1. **Mobile Client (Java)** — single codebase Android
  2. **API Gateway** — rate-limiting, auth, routing (NGINX+JWT).
  3. **Auth Service** — OAuth2 / JWT for clients & admin; role-based access control (Admin, Operator, Passenger).
  4. **Core Services (microservices or modular monolith):**
      - Stations & Tracks
      - Trains & Route Management
      - Scheduling Service (builds daily schedules)
      - Booking Service (transactional seat assignment)
      - Pricing Service (dynamic pricing & fare rules)
      - ML Service (prediction models)
      - Notification Service (push, SMS, email)
      - Analytics Service

  5. **Database Layer:**
      - **Primary DB**: PostgreSQL (timestamptz, PostGIS for location if needed)
      - **Redis**: caching & distributed seat locks (Not integrated)
      - **Object store**: S3-compatible for receipts & logs (Not integrated)

  6. **Integrations** — Payment Gateway, Push Notification provider (FCM / Worker), Mapping APIs for UI base maps.
  7. **Observability** — Logs, Health Checks.

### System Architecture & Workflow

For a detailed view of the system architecture and workflows, please refer to [WORKFLOW.md](WORKFLOW.md).

#### High-level System Overview
```
┌─────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│  Mobile App     │◄────►│  API Gateway    │◄────►│  Microservices   │
│  (Android)      │      │  (NGINX + JWT)  │      │  (Node.js/TS)    │
└─────────────────┘      └─────────────────┘      └──────────────────┘
                                  │                         │
                                  ▼                         ▼
                         ┌─────────────────────────────────────┐
                         │  Data Layer                         │
                         │  • PostgreSQL (Primary DB)          │
                         │  • Redis (Cache & Locks)            │
                         │  • MinIO/S3 (Object Storage)        │
                         └─────────────────────────────────────┘

┌─────────────────┐      
│  Admin Dashboard│◄───── Connected to same backend infrastructure
│  (Web)          │      
└─────────────────┘      
```

### Contributors & Team

#### Core Team (Team error2k21)
- **Project Lead & Architect**: [Mojahid](https://github.com/mojahid2021)
- **Backend Development**: Team error2k21
- **Mobile Development**: Team error2k21
- **Database & Infrastructure**: Team error2k21

#### Contributing
We welcome contributions from the community! If you'd like to contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes with proper documentation
4. Submit a pull request
5. Ensure all tests pass and code follows project standards

### License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**.

#### What this means:
- **Free for personal, educational, and non-commercial use**
- **You can modify and share** under the same license
- **Attribution required** - credit must be given to RailNet Project and Team error2k21
- **Commercial use requires permission** - contact us for commercial licensing

#### Commercial Use
If you plan to use RailNet for commercial purposes (selling, deploying in a commercial product, or using in a commercial service), you **MUST**:

1. **Contact us for commercial licensing**
   - Email: aammojahid@gmail.com
   - GitHub: https://github.com/mojahid2021/RailNet

2. **Provide attribution and credit** to Team error2k21

3. **Notify us** of your commercial use

Commercial licenses are granted on a case-by-case basis and may involve licensing fees or other agreements.

#### Attribution Requirements
When using this software, you must:
- Clearly state that the original work is by RailNet Project and Team error2k21
- Include a link to: https://github.com/mojahid2021/RailNet
- Indicate any modifications made
- Maintain all copyright notices

See the [LICENSE](LICENSE) file for the full legal text.

---

#### © 2025 RailNet Project — Developed by Team error2k21
_An open, scalable, and intelligent railway management ecosystem for the next generation of smart transport._
