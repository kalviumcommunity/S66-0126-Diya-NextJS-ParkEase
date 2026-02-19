# Signup API 400 Error - Fix Summary

## Problem
The signup form was returning a **400 (Bad Request)** error when attempting to register a new user.

## Root Cause
The backend signup API (`/api/auth/signup`) requires three fields for validation:
- `email` (string, valid email)
- `password` (string, minimum 6 characters)
- `name` (string, required, minimum 1 character)

The frontend signup form was only collecting and sending `email` and `password`, missing the required `name` field.

## Validation Schema
```typescript
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),  // ← REQUIRED
});
```

## Solution Applied
Updated `src/app/auth/signup/page.tsx` to:

### 1. Added name state
```typescript
const [name, setName] = useState('');
```

### 2. Added name field input
```tsx
<input
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
  placeholder="John Doe"
/>
```

### 3. Updated API request
```typescript
body: JSON.stringify({ email, password, name })  // ← Added name
```

### 4. Added validation
```typescript
if (!name.trim()) {
  setError('Name is required');
  return;
}
```

## API Testing Results

### ✗ Missing name field (400 error)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","password":"pass123"}'

# Response:
{"error":{"message":"name: Invalid input: expected string, received undefined"}}
```

### ✓ With all required fields (201 success)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"password123","name":"New User"}'

# Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "bc5ecc64-4e6d-4e27-a226-ce5a18f47a9d",
      "email": "newuser@test.com",
      "name": "New User",
      "role": "USER"
    }
  }
}
```

## Testing the Fix

### Frontend Test
1. Navigate to `http://localhost:3000/auth/signup`
2. Fill in all three fields:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Sign Up"
4. Should successfully create account and redirect to `/map`

### API Test
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@parkease.com","password":"password123","name":"Test User"}'
```

## Form Validation Rules

| Field | Rules |
|-------|-------|
| Full Name | Required, non-empty |
| Email | Required, valid email format |
| Password | Required, minimum 6 characters |
| Confirm Password | Required, must match password |

## Commit
- **Commit Hash**: bbf6280
- **Message**: Fix signup API 400 error - Add required name field to signup form and API request
- **Files Changed**: src/app/auth/signup/page.tsx

## Related Files
- Backend API: `src/app/api/auth/signup/route.ts`
- Validation Schema: `src/lib/validations/auth.ts`
- Email Service: `src/lib/email.ts` (sends welcome email on signup)

---

**Status**: ✅ Fixed - Signup API now working correctly with proper validation
