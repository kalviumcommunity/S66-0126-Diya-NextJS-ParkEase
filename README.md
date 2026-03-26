# ParkEase - Crowd-Sourced Parking Optimization Platform

## 📋 Project Overview

ParkEase is a digital platform designed to solve the problem of chaotic parking discovery in crowded Indian cities. The system enables drivers to view real-time availability of parking slots in a public parking area, book slots in advance, and contribute crowd-sourced occupancy updates. The platform transforms a small rectangular public parking area, subdivided into individual slots, into an intelligent, user-managed ecosystem.

### Problem Statement
In crowded Indian cities, parking space discovery remains chaotic. Drivers waste time circling for spots, leading to congestion, fuel waste, and frustration. Existing parking systems lack real-time visibility, user-friendly booking mechanisms, and community-driven updates.

### Solution
ParkEase provides:
- **Real-time parking slot visibility** through an interactive grid interface
- **Authenticated booking system** for advance slot reservation
- **Crowd-sourced availability updates** allowing users to report when they vacate or occupy slots
- **Admin dashboard** for parking lot management and monitoring

---

## 🎯 Target Users

| User Type | Key Needs |
|-----------|-----------|
| **Drivers** | Find available slots quickly, book in advance, navigate to reserved slot, report status changes |
| **Parking Administrators** | Manage slot inventory, monitor occupancy trends, handle maintenance, view reports |
| **System Administrators** | Oversee platform operations, manage user accounts, handle disputes |

---

## ✨ Core Features

### MVP Features
1. **User Authentication**
   - Email/password registration and login
   - JWT-based session management with refresh tokens
   - Role-based access (USER, ADMIN)

2. **Interactive Parking Map**
   - Visual grid representation of all parking slots
   - Color-coded slot status (Available, Occupied, Reserved, Maintenance)
   - Real-time availability updates
   - Responsive design for mobile and desktop

3. **Slot Booking**
   - Select a slot and choose future time window
   - Conflict prevention to avoid double-booking
   - View and manage personal bookings
   - Cancel bookings before start time

4. **Crowd-Sourced Updates**
   - Users can report leaving a slot (marks as available)
   - Users can report an occupied slot
   - Rate limiting to prevent abuse
   - Aggregated reporting for status validation

5. **Admin Dashboard**
   - Manage all parking slots (add, edit, mark maintenance)
   - View all bookings and user reports
   - Generate occupancy reports
   - Override slot status when needed

6. **Email Notifications**
   - Welcome email on registration
   - Booking confirmation with slot and time details
   - Reminder before upcoming bookings
   - Cancellation confirmation

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│            Next.js App (React Components)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Vercel (Next.js Application)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App Router Pages (UI)    │   API Routes (Backend)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────┬──────────────────────────┬───────────────────┘
              │                          │
              ▼                          ▼
┌─────────────────────────┐  ┌─────────────────────────────┐
│     Supabase            │  │         Upstash             │
│  (PostgreSQL + Auth)    │  │   (Redis/Vercel KV)        │
│  - User data            │  │   - Slot availability cache│
│  - Booking records      │  │   - Rate limiting          │
│  - Slot inventory       │  │   - Session data           │
│  - Real-time updates    │  └─────────────────────────────┘
└─────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Supabase    │  │  Resend/     │  │  Vercel      │    │
│  │  Storage     │  │  SendGrid    │  │  Analytics   │    │
│  │ (File Store) │  │ (Email)      │  │ (Monitoring) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Scenarios

**Viewing Parking Map:**
1. User navigates to `/map`
2. Client fetches slots via `GET /api/slots`
3. API checks Vercel KV (Redis) cache for availability
4. If cache miss, queries Supabase PostgreSQL and caches result
5. Optional: Subscribe to Supabase real-time for live updates
6. Rendered as interactive grid with real-time status colors

**Booking a Slot:**
1. User selects slot and time window on details page
2. Form validation occurs client-side
3. `POST /api/bookings` with slot ID and time range
4. Server validates availability via Supabase transaction (row-level security)
5. On success, creates booking record, updates slot status to RESERVED
6. Sends confirmation email via Resend/SendGrid
7. Invalidates Vercel KV cache for affected slot

**Crowd-Sourced Update:**
1. User clicks "I just left" button on occupied slot
2. `POST /api/slots/{id}/report` with action=LEFT
3. Server checks rate limiting via Vercel KV
4. Updates slot status to AVAILABLE if sufficient consensus
5. Records report for moderation
6. Invalidates cache and triggers real-time update

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** (App Router) | Full-stack framework with server-side rendering and API routes |
| **TypeScript** | Type safety and developer experience |
| **Tailwind CSS** | Utility-first styling with responsive design |
| **React Hook Form** | Form handling and validation |
| **SWR** | Client-side data fetching with caching and revalidation |
| **Zod** | Schema validation for forms and API inputs |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | RESTful API endpoints |
| **Supabase** | PostgreSQL database with built-in auth, storage, and real-time |
| **Prisma ORM** | Type-safe database client and migrations (optional) |
| **Vercel KV** (Upstash Redis) | Caching, rate limiting, and session management |
| **JWT** | Stateless authentication (access + refresh tokens) |
| **bcrypt** | Password hashing (if using custom auth) |

### Infrastructure & Deployment
| Technology | Purpose |
|------------|---------|
| **Vercel** | Serverless deployment platform with edge network |
| **Supabase** | Managed PostgreSQL, authentication, and storage |
| **Vercel KV** | Serverless Redis for caching and rate limiting |
| **Vercel Postgres** | Alternative managed PostgreSQL (if not using Supabase) |
| **Vercel Blob** | File storage for user uploads |
| **Resend / SendGrid** | Transactional email delivery |
| **GitHub** | Version control and CI/CD |
| **Vercel Analytics** | Performance monitoring and analytics |

### Third-Party Services
| Service | Purpose |
|---------|---------|
| **Supabase Auth** | Built-in authentication (optional alternative to custom JWT) |
| **Supabase Storage** | File storage for user profile images |
| **Supabase Realtime** | Live slot status updates |
| **Resend** | Email delivery (better developer experience) |
| **Upstash** | Redis provider for Vercel KV |

---

## 📊 Database Schema (Supabase PostgreSQL)

### Core Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| **users** | Registered platform users | id (UUID), email, encrypted_password, name, role (USER/ADMIN) |
| **parking_slots** | Individual parking spots | id, row, column, status (AVAILABLE/OCCUPIED/RESERVED/MAINTENANCE) |
| **bookings** | Slot reservations | id, user_id, slot_id, start_time, end_time, status (PENDING/CONFIRMED/CANCELLED/COMPLETED) |
| **crowd_reports** | User-submitted occupancy reports | id, user_id, slot_id, action (LEFT/OCCUPIED), created_at |

### Row Level Security (RLS) Policies
Supabase RLS ensures data security:
- **Users**: Can read own profile, update own profile
- **Parking slots**: Public read access, admin-only write access
- **Bookings**: Users can CRUD own bookings, admins can read all
- **Crowd reports**: Authenticated users can create reports, admins can read all

### Indexes
- `bookings.slot_id` - for availability checks
- `bookings.start_time, end_time` - for conflict detection
- `crowd_reports.slot_id, created_at` - for recent report aggregation
- `users.email` - for fast login lookups

### Real-time Subscriptions
Supabase Realtime enables:
- Live slot status updates across all connected clients
- Booking conflict notifications
- Admin dashboard live metrics

---

## 🔐 Security Architecture

### Authentication
Supabase Auth provides:
- **Email/Password authentication** with built-in security
- **JWT tokens** automatically managed and validated
- **Session handling** with refresh tokens
- **OAuth providers** (Google, GitHub) for social login (optional)

### Authorization
- **Row Level Security (RLS)** policies in Supabase
- **Role-Based Access Control (RBAC)**
  - `USER`: Can view slots, book, view own bookings, report status
  - `ADMIN`: Full access plus slot management, user oversight, reporting

### Data Protection
- **Input Validation**: Zod schemas for all API inputs
- **XSS Prevention**: Automatic sanitization of user-generated content
- **SQL Injection**: Supabase parameterized queries
- **Password Storage**: Supabase handles bcrypt hashing automatically
- **HTTPS**: Enforced by Vercel with automatic SSL certificates

### Security Headers
Vercel automatically configures:
- Content Security Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options

---

## 🚀 Deployment Architecture (Vercel + Supabase)

### Environment Strategy
- **Development**: Local Next.js + Supabase local development (Docker)
- **Preview**: Vercel preview deployments for each PR
- **Production**: Vercel production branch with Supabase production project

### Vercel Features
| Feature | Usage |
|---------|-------|
| **Edge Network** | Global CDN for faster asset delivery |
| **Serverless Functions** | API routes scale automatically |
| **Preview Deployments** | Automatic preview for each PR |
| **Environment Variables** | Secure secret management |
| **Analytics** | Core Web Vitals and performance monitoring |
| **Log Drains** | Centralized logging |

### Supabase Configuration
| Component | Configuration |
|-----------|--------------|
| **Database** | PostgreSQL with automatic backups and point-in-time recovery |
| **Auth** | Built-in authentication with email templates |
| **Storage** | S3-compatible storage for user uploads |
| **Realtime** | WebSocket connections for live updates |
| **Edge Functions** | Optional serverless functions (if needed) |

### CI/CD Pipeline (GitHub + Vercel)

1. **On Pull Request**:
   - Vercel creates preview deployment
   - Run TypeScript type checking
   - Execute ESLint
   - Run unit and integration tests
   - Comment preview URL on PR

2. **On Merge to Main**:
   - Vercel automatically deploys to production
   - Run database migrations (if using Prisma)
   - Invalidate cache
   - Deploy to production domain

3. **Rollback Strategy**:
   - Instant rollback via Vercel dashboard
   - Previous deployment instantly available
   - Database migrations must be backward-compatible

---

## 📈 Performance Optimization

### Caching Strategy
- **Vercel KV (Redis)** for slot availability with 30-second TTL
- **Vercel Edge Cache** for static assets
- **SWR** client-side caching with revalidation
- **Supabase Realtime** for live updates without polling

### Database Optimization
- Supabase automatically handles connection pooling
- Strategic indexes on frequently queried columns
- Query optimization through Supabase EXPLAIN ANALYZE
- Materialized views for complex reports

### Frontend Performance
- **Automatic code splitting**: Via Next.js
- **Image optimization**: Next.js Image component with Vercel image optimization
- **Static generation**: Pre-render public pages
- **Edge Functions**: Run API logic closer to users

---

## 📝 API Documentation

### Authentication (Supabase Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user (wraps Supabase Auth) |
| POST | `/api/auth/login` | Login via Supabase Auth |
| POST | `/api/auth/logout` | Logout and clear session |
| GET | `/api/auth/session` | Get current session |

### Parking Slot Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/slots` | List all slots with status | Yes |
| GET | `/api/slots/{id}` | Get slot details | Yes |
| PUT | `/api/slots/{id}` | Update slot status | Admin only |
| POST | `/api/slots/{id}/report` | Report slot status change | Yes |

### Booking Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bookings` | Get user's bookings | Yes |
| POST | `/api/bookings` | Create new booking | Yes |
| GET | `/api/bookings/{id}` | Get booking details | Yes |
| DELETE | `/api/bookings/{id}` | Cancel booking | Yes |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Get platform statistics | Admin only |
| PUT | `/api/admin/slots` | Batch update slots | Admin only |
| GET | `/api/admin/reports` | Get crowd reports | Admin only |

---

## 📱 User Interface

### Pages Structure

| Route | Page | Description | Auth |
|-------|------|-------------|------|
| `/` | Landing | Introduction and call to action | No |
| `/login` | Login | User authentication | No |
| `/signup` | Signup | New user registration | No |
| `/map` | Parking Map | Interactive slot grid | Yes |
| `/slots/[id]` | Slot Details | Slot info and booking form | Yes |
| `/bookings` | My Bookings | View/manage reservations | Yes |
| `/admin` | Admin Dashboard | Slot and user management | Admin only |
| `/profile` | Profile | User settings and preferences | Yes |

### Key UI Components
- **ParkingGrid**: Interactive grid showing all slots with status indicators
- **SlotCard**: Individual slot details with quick actions
- **BookingForm**: Date/time picker with validation
- **ToastNotifications**: System feedback messages
- **Modal**: Confirmations and forms
- **LoadingSkeleton**: Placeholder for async content

### Responsive Breakpoints
- **Mobile**: < 768px (2-column slot grid)
- **Tablet**: 768px - 1024px (3-column grid)
- **Desktop**: > 1024px (5-column grid)

---

## 🔍 Monitoring & Observability

### Vercel Analytics
- **Core Web Vitals**: LCP, FID, CLS metrics
- **Page views and user sessions**
- **API function performance**
- **Error tracking and debugging**

### Supabase Monitoring
- **Database performance metrics**
- **Auth usage statistics**
- **Storage usage**
- **Real-time connection count**
- **Query performance insights**

### Logging
- Vercel Log Drains for centralized logging
- Supabase audit logs for database operations
- Structured logging with console (development) and log drains (production)

### Alerts
- Vercel deployment failure notifications
- High error rate alerts (via custom monitoring)
- Supabase database CPU/memory thresholds

---

## 📋 Crowd-Sourcing Logic

### Report Aggregation
- Multiple reports required for status change (configurable)
- Time-weighted recency for reports
- Admin override capability for disputed reports

### Abuse Prevention
- **Vercel KV** for rate limiting: 5 reports per user per hour
- Cooldown: Users can't report same slot within 10 minutes
- Reputation scoring based on report accuracy
- Flagged users require manual admin verification

### Report Validation
- Cross-reference with active bookings
- Timestamp validation (reports must be within reasonable timeframe)
- Geofencing to ensure reporter is near the location (future enhancement)

---

## 🔮 Future Enhancements

1. **Real-time Updates**
   - Supabase Realtime for live slot status changes
   - Push notifications via web push API

2. **Payment Integration**
   - Razorpay/PayTM for advance payments
   - Hourly/daily pricing models
   - Refund processing for cancellations

3. **Mobile Application**
   - PWA capabilities for mobile web
   - GPS-based parking suggestions
   - Turn-by-turn navigation to reserved slot

4. **Advanced Analytics**
   - Predictive availability based on historical data
   - Demand forecasting
   - Dynamic pricing based on occupancy

5. **Integration Capabilities**
   - Government parking authority APIs
   - IoT sensor integration for automated occupancy detection
   - Google Maps/Waze integration

6. **User Experience Enhancements**
   - Favorite slots and quick booking
   - Parking history and receipts
   - Multi-language support (regional Indian languages)

---

## 📄 Environment Variables

### Required Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin operations) | Supabase Dashboard |
| `JWT_SECRET` | Secret for JWT tokens | Generate via `openssl rand -base64 32` |
| `RESEND_API_KEY` | Email service API key | Resend Dashboard |
| `KV_REST_API_URL` | Vercel KV REST API URL | Vercel Dashboard |
| `KV_REST_API_TOKEN` | Vercel KV API token | Vercel Dashboard |

### Optional Variables
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL for email links |
| `RATE_LIMIT_REQUESTS` | Requests per time window (default: 5) |
| `RATE_LIMIT_WINDOW_MS` | Time window in ms (default: 3600000) |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- Git
- Supabase CLI (for local database)
- Vercel CLI (optional)

### Installation Steps
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in variables
4. Start Supabase locally: `supabase start`
5. Run database migrations: `supabase db reset`
6. Start development server: `npm run dev`
7. Open `http://localhost:3000`

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---
