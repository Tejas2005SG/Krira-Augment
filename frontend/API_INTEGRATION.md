# API Integration Documentation

## Overview
This document describes the production-ready API integration for the Krira AI authentication system, connecting the Next.js frontend with the Express.js backend.

## Architecture

### API Layer Structure
```
frontend/
├── lib/
│   └── api/
│       ├── config.ts           # API configuration and endpoints
│       ├── client.ts           # HTTP client with retry and timeout
│       └── auth.service.ts     # Authentication service methods
├── contexts/
│   └── AuthContext.tsx         # Global authentication state
├── components/
│   └── ProtectedRoute.tsx      # Role-based route protection
└── components/
    └── ui/
        └── use-toast.ts        # Toast notifications (shadcn/ui)
```

## Key Components

### 1. API Client (`lib/api/client.ts`)
Production-ready HTTP client with:
- **Automatic retry logic** (configurable attempts)
- **Request timeout** (30 seconds default)
- **Cookie-based authentication** (accessToken/refreshToken)
- **Error handling** with custom ApiError class
- **Automatic token injection** from cookies

### 2. Auth Service (`lib/api/auth.service.ts`)
Provides methods for all authentication operations:
- `signup(data)` - Register new user
- `verifyOtp(data)` - Verify email with OTP
- `login(data)` - User login
- `logout()` - User logout
- `forgotPassword(data)` - Request password reset
- `resetPassword(token, data)` - Reset password
- `loginWithGoogle(data)` - Google OAuth login
- `signupWithGoogle(data)` - Google OAuth signup
- `getProfile()` - Get user profile
- `getAdminProfile()` - Get admin profile

### 3. Auth Context (`contexts/AuthContext.tsx`)
Global authentication state management:
- User session persistence
- Auto-initialization on app load
- Profile refresh from server
- Logout with cleanup

### 4. Protected Route (`components/ProtectedRoute.tsx`)
Role-based route protection:
- Checks authentication status
- Validates user roles (user/admin)
- Redirects unauthorized users
- Stores intended destination for redirect after login

## API Endpoints

Base URL: `http://localhost:5000/api` (configured in `.env`)

### Authentication Endpoints
- `POST /auth/signup` - Register new user
- `POST /auth/verifybyotp` - Verify OTP
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/forgotpassword` - Forgot password
- `POST /auth/resetpassword/:token` - Reset password
- `POST /auth/loginwithgoogle` - Google login
- `POST /auth/signupwithgoogle` - Google signup
- `GET /auth/profile` - Get user profile (requires auth)
- `GET /auth/admin/profile` - Get admin profile (requires auth + admin role)

## Authentication Flow

### Signup Flow
1. User fills signup form → `signup` page
2. Frontend calls `authService.signup()`
3. Backend sends OTP to email
4. Email stored in sessionStorage
5. Redirect to verification page
6. User enters OTP → `verifyemail` page
7. Frontend calls `authService.verifyOtp()`
8. Backend creates user and returns accessToken
9. Update AuthContext and redirect to dashboard

### Login Flow
1. User fills login form → `login` page
2. Frontend calls `authService.login()`
3. Backend validates credentials
4. Backend returns user data and sets cookies
5. Update AuthContext
6. Redirect to intended page or dashboard

### Password Reset Flow
1. User requests reset → `forgotpassword` page
2. Frontend calls `authService.forgotPassword()`
3. Backend sends reset link to email
4. User clicks link with token → `resetpassword/:token` page
5. User enters new password
6. Frontend calls `authService.resetPassword()`
7. Backend updates password and logs in user
8. Update AuthContext and redirect to dashboard

## Role-Based Access Control

### User Roles
- `user` - Regular user (default)
- `admin` - Administrator

### Dashboard Routing
The dashboard page (`app/dashboard/page.tsx`) automatically renders the correct layout based on user role:
- **Admin users** → `AdminDashboardLayout`
- **Regular users** → `UserDashboardLayout`

### Protected Routes Usage
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

// Protect route for both users and admins
<ProtectedRoute allowedRoles={['user', 'admin']}>
  <YourComponent />
</ProtectedRoute>

// Protect route for admins only
<ProtectedRoute allowedRoles={['admin']}>
  <AdminOnlyComponent />
</ProtectedRoute>
```

## Environment Variables

Create `.env` file in `frontend/` directory:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api
```

For production:
```env
NEXT_PUBLIC_BACKEND_URL=https://your-production-api.com/api
```

## Error Handling

### API Error Structure
```typescript
class ApiError extends Error {
  status: number;      // HTTP status code
  message: string;     // Error message
  data?: any;          // Additional error data
}
```

### Error Handling Pattern
```typescript
try {
  const response = await authService.login(credentials);
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API errors
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
}
```

## Token Management

### Cookie-Based Tokens
- `accessToken` - Short-lived (15 minutes)
- `refreshToken` - Long-lived (7 days)

### Automatic Token Handling
The API client automatically:
1. Reads `accessToken` from cookies
2. Includes it in Authorization header
3. Handles token expiration errors
4. Clears tokens on logout

## Security Features

1. **HTTP-Only Cookies** - Tokens stored in secure cookies
2. **CORS Protection** - Credentials included in requests
3. **Request Timeout** - Prevents hanging requests
4. **Retry Logic** - Handles temporary network failures
5. **Token Blacklisting** - Backend blacklists old tokens
6. **Role Validation** - Frontend and backend role checks

## Toast Notifications

Used for user feedback throughout the authentication flow:
```typescript
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

toast({
  title: "Success",
  description: "Login successful",
  variant: "success",  // or "destructive" for errors
});
```

## Testing Checklist

- [ ] Signup with email/password
- [ ] Email verification with OTP
- [ ] Login with email/password
- [ ] Logout functionality
- [ ] Forgot password flow
- [ ] Reset password with token
- [ ] Protected route access
- [ ] Role-based dashboard rendering
- [ ] Token persistence across page refreshes
- [ ] Error handling and user feedback
- [ ] Google OAuth (if implemented)

## Common Issues & Solutions

### Issue: "Network error occurred"
**Solution:** Check if backend is running and BACKEND_URL is correct

### Issue: "Invalid or missing reset token"
**Solution:** Ensure token is passed in URL properly (query param or path)

### Issue: Protected route redirects immediately
**Solution:** Check if AuthProvider wraps your app in layout.tsx

### Issue: User state not persisting
**Solution:** Verify cookies are being set (check browser DevTools → Application → Cookies)

## Production Deployment

### Frontend
1. Update `.env` with production API URL
2. Build: `npm run build`
3. Deploy to hosting (Vercel, Netlify, etc.)

### Backend
1. Ensure CORS allows frontend domain
2. Set secure cookie options in production
3. Use HTTPS for API endpoints

## Future Enhancements

- [ ] Refresh token rotation
- [ ] Social OAuth providers (GitHub, Facebook)
- [ ] Two-factor authentication
- [ ] Session management page
- [ ] Account deletion flow
- [ ] Email change flow
