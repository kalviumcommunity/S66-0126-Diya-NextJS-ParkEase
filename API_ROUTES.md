# ParkEase API Routes - Complete Reference

## API Routes Overview

### Authentication Routes

#### `POST /api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "accessToken": "jwt_token",
    "refreshToken": "jwt_token"
  }
}
```

**Status:** ✅ Created - Placeholder implementation

---

#### `POST /api/auth/login`
Authenticate user and retrieve tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_token",
    "userId": "uuid",
    "email": "user@example.com"
  }
}
```

**Status:** ✅ Created - Placeholder implementation

---

#### `POST /api/auth/logout`
Clear user session and invalidate tokens.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User logged out successfully"
}
```

**Status:** ✅ Created - Placeholder implementation

---

### Parking Slots Routes

#### `GET /api/slots`
List all parking slots with optional filters.

**Query Parameters:**
- `status` (optional): Filter by status - `AVAILABLE | OCCUPIED | RESERVED | MAINTENANCE`
- `row` (optional): Filter by row number
- `column` (optional): Filter by column number
- `limit` (optional, default: 50): Maximum number of results
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "row": 1,
      "column": 1,
      "status": "AVAILABLE",
      "createdAt": "2026-02-19T14:12:17Z",
      "updatedAt": "2026-02-19T14:12:17Z"
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0
}
```

**Status:** ✅ Created - Placeholder implementation

---

#### `GET /api/slots/[id]`
Get details of a specific parking slot.

**Path Parameters:**
- `id`: Slot ID (UUID)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "row": 1,
    "column": 1,
    "status": "AVAILABLE",
    "createdAt": "2026-02-19T14:12:17Z",
    "updatedAt": "2026-02-19T14:12:17Z"
  }
}
```

**Status:** ✅ Created - Placeholder implementation

---

### Booking Routes

#### `GET /api/bookings` (Two Modes)

**Mode 1: Get User's Bookings**

**Query Parameters:**
- `userId` (required): User ID to fetch bookings for

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "bookings": [
      {
        "id": "uuid",
        "slotId": "uuid",
        "userId": "uuid",
        "startTime": "2026-02-20T10:00:00Z",
        "endTime": "2026-02-20T12:00:00Z",
        "status": "CONFIRMED",
        "createdAt": "2026-02-19T14:12:17Z"
      }
    ],
    "total": 5
  }
}
```

**Mode 2: Check Slot Availability**

**Query Parameters:**
- `slotId` (required): Slot ID to check
- `startTime` (required): Start time (ISO 8601)
- `endTime` (required): End time (ISO 8601)

**Response (200 OK):**
```json
{
  "success": true,
  "available": true,
  "slotId": "uuid",
  "startTime": "2026-02-20T10:00:00Z",
  "endTime": "2026-02-20T12:00:00Z"
}
```

**Status:** ✅ Created - Updated to support both modes

---

#### `POST /api/bookings`
Create a new parking booking.

**Request Body:**
```json
{
  "userId": "uuid",
  "slotId": "uuid",
  "startTime": "2026-02-20T10:00:00Z",
  "endTime": "2026-02-20T12:00:00Z"
}
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "bookingId": "uuid",
    "slotId": "uuid",
    "startTime": "2026-02-20T10:00:00Z",
    "endTime": "2026-02-20T12:00:00Z",
    "status": "CONFIRMED",
    "createdAt": "2026-02-19T14:12:17Z"
  }
}
```

**Notes:**
- Uses atomic transaction to prevent double-booking
- Automatically checks for time overlaps
- Reserves slot if booking successful

**Status:** ✅ Fully Implemented - Uses `bookParkingSlot()` transaction service

---

#### `DELETE /api/bookings/[id]`
Cancel a parking booking.

**Path Parameters:**
- `id`: Booking ID (UUID)

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking canceled successfully",
  "data": {
    "bookingId": "uuid",
    "status": "CANCELED"
  }
}
```

**Status:** ✅ Created - Placeholder implementation

---

### Admin Routes

#### `PUT /api/admin/slots`
Update parking slot status (admin only).

**Request Body:**
```json
{
  "slotId": "uuid",
  "status": "AVAILABLE | OCCUPIED | RESERVED | MAINTENANCE"
}
```

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "slotId": "uuid",
    "previousStatus": "AVAILABLE",
    "newStatus": "MAINTENANCE",
    "updatedBy": "admin@parkease.com"
  }
}
```

**Status:** ✅ Created - Placeholder implementation

---

### Health Check Route

#### `GET /api/health`
Check if API is running and database is connected.

**Response (200 OK):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-19T14:12:17Z"
}
```

**Status:** ✅ Fully Implemented

---

## Implementation Status Summary

| Route | Method | Status | Notes |
|-------|--------|--------|-------|
| /api/auth/signup | POST | ✅ Placeholder | Needs: Password hashing, JWT generation |
| /api/auth/login | POST | ✅ Placeholder | Needs: Password verification, JWT generation |
| /api/auth/logout | POST | ✅ Placeholder | Needs: Token blacklisting, cookie clearing |
| /api/slots | GET | ✅ Placeholder | Needs: Database query, filtering logic |
| /api/slots/[id] | GET | ✅ Placeholder | Needs: Database query, error handling |
| /api/bookings | GET/POST | ✅ Partial | POST is fully implemented with transactions |
| /api/bookings/[id] | DELETE | ✅ Placeholder | Needs: Authorization, cancel logic |
| /api/admin/slots | PUT | ✅ Placeholder | Needs: Admin authorization, validation |
| /api/health | GET | ✅ Complete | Fully working |

---

## Common Response Format

All API endpoints return responses in the following format:

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

Token should be obtained from `/api/auth/login` endpoint.

---

## Next Steps

1. **Implement Authentication Middleware**
   - Create JWT validation middleware
   - Protect routes that require authentication

2. **Add Input Validation**
   - Create Zod schemas for request bodies
   - Validate query parameters

3. **Implement Database Operations**
   - Connect routes to Prisma client
   - Add filtering and pagination logic

4. **Add Authorization**
   - Implement role-based access control
   - Protect admin-only endpoints

5. **Error Handling**
   - Standardize error responses
   - Add proper error codes

6. **API Documentation**
   - Generate OpenAPI/Swagger docs
   - Create interactive API explorer
