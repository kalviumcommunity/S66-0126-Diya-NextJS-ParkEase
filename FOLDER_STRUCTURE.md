# ParkEase - Folder Structure

## Project Structure

```
src/
├── app/                 # Next.js App Router - pages, layouts, and API routes
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   ├── api/            # API routes will be added here
│   ├── auth/           # Authentication pages (login, register)
│   ├── map/            # Parking map pages
│   ├── bookings/       # User bookings pages
│   └── admin/          # Admin dashboard pages
│
├── components/         # Reusable React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ParkingGrid.tsx
│   ├── SlotCard.tsx
│   ├── BookingForm.tsx
│   └── ui/             # UI primitives (buttons, modals, forms, etc.)
│
├── lib/                # Utility functions and configurations
│   ├── db.ts           # Prisma client
│   ├── auth.ts         # Authentication utilities
│   ├── validators.ts   # Zod validation schemas
│   └── utils.ts        # Helper functions
│
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useSlots.ts
│   ├── useBooking.ts
│   └── useFetch.ts
│
├── context/            # React context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── BookingContext.tsx
│
└── types/              # TypeScript type definitions
    ├── index.ts
    ├── user.ts
    ├── slot.ts
    ├── booking.ts
    └── api.ts
```

## Getting Started

### Prerequisites
- Node.js >= 20.9.0 (currently using 18.18.0 - may need upgrade)
- npm 10.9.0+

### Installation

```bash
cd parkease
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Production

```bash
npm run build
npm start
```

## Technology Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM (to be added)
- **Caching**: Redis (to be added)
- **Authentication**: JWT (to be implemented)
- **Validation**: Zod (to be added)
- **File Storage**: AWS S3 / Azure Blob (to be configured)

## Next Steps

1. Install and configure Prisma ORM for PostgreSQL
2. Set up environment variables (.env.local)
3. Create API route handlers in `src/app/api/`
4. Build UI components in `src/components/`
5. Implement authentication with JWT
6. Add database schemas for User, ParkingSlot, Booking, etc.
