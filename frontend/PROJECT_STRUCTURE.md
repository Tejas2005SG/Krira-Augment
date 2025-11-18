# Project Structure - Frontend Authentication Integration

## Complete Directory Structure

```
frontend/
├── app/
│   ├── dashboard/
│   │   └── page.tsx                    # ✅ Role-based dashboard routing
│   ├── forgotpassword/
│   │   └── page.jsx                    # ✅ Forgot password with API
│   ├── login/
│   │   └── page.tsx                    # ✅ Login page wrapper
│   ├── resetpassword/
│   │   └── page.jsx                    # ✅ Reset password with API
│   ├── signup/
│   │   └── page.tsx                    # ✅ Signup page wrapper
│   ├── verifyemail/
│   │   └── page.tsx                    # ✅ OTP verification with API
│   ├── layout.tsx                      # ✅ Root layout with AuthProvider
│   ├── globals.css                     # Global styles
│   └── page.tsx                        # Home page
│
├── components/
│   ├── dashboard/
│   │   ├── admindashboard-layout.tsx  # Admin dashboard layout
│   │   ├── userdashboard-layout.tsx   # User dashboard layout
│   │   └── ...                         # Other dashboard components
│   ├── ui/                             # shadcn/ui components
│   │   ├── use-toast.ts                # ✅ Toast notifications
│   │   └── ...                         # Other UI components
│   ├── ProtectedRoute.tsx              # ✅ Role-based route protection
│   ├── login.tsx                       # ✅ Login component with API
│   ├── sign-up.tsx                     # ✅ Signup component with API
│   └── ...                             # Other components
│
├── contexts/
│   └── AuthContext.tsx                 # ✅ Global auth state management
│
├── lib/
│   └── api/
│       ├── config.ts                   # ✅ API endpoints and configuration
│       ├── client.ts                   # ✅ HTTP client with retry/timeout
│       ├── auth.service.ts             # ✅ Authentication service methods
│       └── README.md                   # ✅ API usage guide
│
├── hooks/
│   └── ...                             # Other hooks
│
├── .env                                # ✅ Environment variables
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── API_INTEGRATION.md                  # ✅ Complete documentation
└── PROJECT_STRUCTURE.md               # ✅ This file
```

## ✅ Completed Integrations

### 1. API Management Layer
**Location:** `frontend/lib/api/`

- **config.ts**: API endpoints, base URL, timeouts, retry settings
- **client.ts**: Production-ready HTTP client with:
  - Automatic retry on failure (3 attempts)
  - Request timeout (30 seconds)
  - Cookie-based authentication
  - Error handling with custom ApiError class
- **auth.service.ts**: All authentication methods:
  - signup, verifyOtp, login, logout
  - forgotPassword, resetPassword
  - loginWithGoogle, signupWithGoogle
  - getProfile, getAdminProfile

### 2. Global State Management
**Location:** `frontend/contexts/AuthContext.tsx`

- User session state
- Auto-initialization on app load
- Profile fetching from API
- Login/logout methods
- User data persistence in localStorage
- Seamless integration with all auth pages

### 3. Protected Routes
**Location:** `frontend/components/ProtectedRoute.tsx`

- Authentication check
- Role-based access control (user/admin)
- Automatic redirect for unauthorized users
- Loading state while checking auth
- Stores intended destination for post-login redirect

### 4. Authentication Pages

#### Signup (`components/sign-up.tsx`)
- ✅ Form validation
- ✅ Password strength meter
- ✅ API integration (authService.signup)
- ✅ Email storage for verification
- ✅ Toast notifications
- ✅ Loading states
- ✅ Redirect to verification page

#### Email Verification (`app/verifyemail/page.tsx`)
- ✅ OTP input (6 digits)
- ✅ API integration (authService.verifyOtp)
- ✅ Email from sessionStorage
- ✅ Resend OTP functionality
- ✅ Toast notifications
- ✅ Auto-login after verification
- ✅ Redirect to dashboard

#### Login (`components/login.tsx`)
- ✅ Form validation
- ✅ API integration (authService.login)
- ✅ AuthContext update
- ✅ Toast notifications
- ✅ Loading states
- ✅ Redirect to intended page or dashboard
- ✅ Password visibility toggle

#### Forgot Password (`app/forgotpassword/page.jsx`)
- ✅ Email validation
- ✅ API integration (authService.forgotPassword)
- ✅ Toast notifications
- ✅ Loading states
- ✅ User feedback on email sent

#### Reset Password (`app/resetpassword/page.jsx`)
- ✅ Token extraction from URL
- ✅ Password validation
- ✅ API integration (authService.resetPassword)
- ✅ AuthContext update
- ✅ Toast notifications
- ✅ Loading states
- ✅ Auto-login after reset
- ✅ Redirect to dashboard

### 5. Role-Based Dashboard
**Location:** `app/dashboard/page.tsx`

- ✅ Protected route wrapper
- ✅ Role detection from AuthContext
- ✅ Admin dashboard for admin role
- ✅ User dashboard for user role
- ✅ Automatic routing based on role

### 6. Root Layout
**Location:** `app/layout.tsx`

- ✅ AuthProvider wraps entire app
- ✅ Global auth state available everywhere
- ✅ Toaster for notifications

## API Endpoints Used

| Endpoint | Method | Used In | Status |
|----------|--------|---------|--------|
| `/auth/signup` | POST | Signup page | ✅ Integrated |
| `/auth/verifybyotp` | POST | Verify email page | ✅ Integrated |
| `/auth/login` | POST | Login page | ✅ Integrated |
| `/auth/logout` | POST | AuthContext | ✅ Integrated |
| `/auth/forgotpassword` | POST | Forgot password page | ✅ Integrated |
| `/auth/resetpassword/:token` | POST | Reset password page | ✅ Integrated |
| `/auth/profile` | GET | AuthContext | ✅ Integrated |
| `/auth/admin/profile` | GET | Auth service | ✅ Available |
| `/auth/loginwithgoogle` | POST | Auth service | ✅ Available |
| `/auth/signupwithgoogle` | POST | Auth service | ✅ Available |

## User Flows

### 1. Signup Flow
```
User → Signup Form 
  → API: /auth/signup 
  → Store email in sessionStorage 
  → Redirect to /verifyemail
  → Enter OTP
  → API: /auth/verifybyotp
  → Update AuthContext
  → Redirect to /dashboard
```

### 2. Login Flow
```
User → Login Form
  → API: /auth/login
  → Update AuthContext
  → Store user in localStorage
  → Redirect to /dashboard (role-based)
```

### 3. Password Reset Flow
```
User → Forgot Password Form
  → API: /auth/forgotpassword
  → Email sent with reset link
  → Click link (with token)
  → Reset Password Form
  → API: /auth/resetpassword/:token
  → Update AuthContext
  → Redirect to /dashboard
```

### 4. Protected Page Access
```
User visits /dashboard
  → ProtectedRoute checks auth
  → If not authenticated → Redirect to /login
  → If authenticated → Check role
  → Render appropriate dashboard (User/Admin)
```

## Security Features

1. **HTTP-Only Cookies**: Tokens stored securely by backend
2. **Token Auto-Injection**: Client automatically includes tokens
3. **Role-Based Access**: Frontend and backend validation
4. **Protected Routes**: Unauthorized access prevention
5. **Token Blacklisting**: Backend invalidates old tokens
6. **Request Timeout**: Prevents hanging requests
7. **Error Handling**: Graceful error management
8. **CORS Protection**: Credentials included in requests

## Environment Configuration

**File:** `frontend/.env`
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api
```

**Production:** Update with production API URL

## Type Safety

All components use TypeScript with proper typing:
- User type
- AuthResponse type
- API error types
- Form data types

## Error Handling Strategy

1. **Try-Catch Blocks**: All API calls wrapped
2. **Toast Notifications**: User-friendly error messages
3. **Loading States**: Prevent duplicate submissions
4. **Validation**: Client-side validation before API calls
5. **Fallback UI**: Loading states and error boundaries

## Documentation Files

1. **API_INTEGRATION.md**: Complete API integration guide
2. **lib/api/README.md**: API usage examples
3. **PROJECT_STRUCTURE.md**: This file

## Testing Recommendations

### Manual Testing Checklist
- [ ] Signup with valid data
- [ ] Signup with invalid data (error handling)
- [ ] Email verification with correct OTP
- [ ] Email verification with wrong OTP
- [ ] Login with correct credentials
- [ ] Login with wrong credentials
- [ ] Forgot password flow
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Access dashboard as user
- [ ] Access dashboard as admin
- [ ] Try accessing dashboard without login
- [ ] Logout functionality
- [ ] Token persistence (refresh page)
- [ ] Role-based rendering

### Automated Testing (Future)
- Unit tests for auth service
- Integration tests for auth flows
- E2E tests for complete user journeys

## Performance Optimizations

1. **Lazy Loading**: User profile fetched on demand
2. **Caching**: User data cached in localStorage
3. **Retry Logic**: Automatic retry on network failures
4. **Timeout**: Prevents long-running requests
5. **Loading States**: Better UX during API calls

## Future Enhancements

- [ ] Refresh token rotation
- [ ] Social OAuth integration (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Session management page
- [ ] Account settings page
- [ ] Email change flow
- [ ] Phone verification
- [ ] Biometric authentication

## Deployment Notes

### Frontend Deployment
1. Update `.env` with production API URL
2. Build: `npm run build`
3. Deploy to Vercel/Netlify/etc.
4. Verify CORS settings on backend

### Backend Configuration
1. Allow frontend domain in CORS
2. Set secure cookie options
3. Use HTTPS for production
4. Configure Redis for production
5. Set up email service (production SMTP)

## Support & Maintenance

### Common Issues
- Network errors: Check backend URL
- Auth not persisting: Check cookie settings
- Protected routes not working: Verify AuthProvider in layout
- Role-based routing fails: Check user.role value

### Debugging
1. Check browser DevTools → Network tab
2. Check browser DevTools → Application → Cookies
3. Check console for error messages
4. Verify API is running and accessible

## Conclusion

✅ **Complete Production-Ready Authentication System**
- All authentication flows implemented
- Role-based access control
- Protected routes
- Global state management
- Error handling
- Loading states
- Toast notifications
- Type-safe TypeScript
- Comprehensive documentation

The system is ready for development and testing. Update environment variables for production deployment.
