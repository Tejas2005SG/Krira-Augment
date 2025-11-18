# API Usage Guide

## Quick Start

### 1. Import the auth service
```typescript
import { authService } from '@/lib/api/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
```

### 2. Use in your component
```typescript
'use client';

import { authService } from '@/lib/api/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

export default function MyComponent() {
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.user) {
        login(response.user);
        toast({
          title: "Success",
          description: "Logged in successfully",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Your JSX
  );
}
```

## API Methods

### Authentication

#### Signup
```typescript
const response = await authService.signup({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123!'
});

// Response: { success: true, message: string, email: string }
```

#### Verify OTP
```typescript
const response = await authService.verifyOtp({
  email: 'john@example.com',
  otp: '123456'
});

// Response: { success: true, user: User, accessToken: string }
```

#### Login
```typescript
const response = await authService.login({
  email: 'john@example.com',
  password: 'SecurePass123!'
});

// Response: { success: true, user: User, accessToken: string }
```

#### Logout
```typescript
const response = await authService.logout();

// Response: { success: true, message: string }
```

#### Forgot Password
```typescript
const response = await authService.forgotPassword({
  email: 'john@example.com'
});

// Response: { success: true, message: string }
```

#### Reset Password
```typescript
const response = await authService.resetPassword(
  'reset-token-from-email',
  { password: 'NewSecurePass123!' }
);

// Response: { success: true, user: User, accessToken: string }
```

#### Get Profile
```typescript
const response = await authService.getProfile();

// Response: { success: true, user: DetailedUser }
```

### Google OAuth

#### Login with Google
```typescript
const response = await authService.loginWithGoogle({
  idToken: 'google-id-token'
});

// Response: { success: true, user: User, accessToken: string }
```

#### Signup with Google
```typescript
const response = await authService.signupWithGoogle({
  idToken: 'google-id-token'
});

// Response: { success: true, user: User, accessToken: string }
```

## useAuth Hook

### Get current user
```typescript
const { user, isLoading, isAuthenticated } = useAuth();

console.log(user.name);  // User name
console.log(user.role);  // 'user' or 'admin'
console.log(user.email); // User email
```

### Login (update context)
```typescript
const { login } = useAuth();

// After successful API call
login(response.user);
```

### Logout
```typescript
const { logout } = useAuth();

// Call logout (also calls API)
await logout();
```

### Update user data
```typescript
const { updateUser } = useAuth();

updateUser({ plan: 'pro_monthly' });
```

### Refresh user data from server
```typescript
const { refreshUser } = useAuth();

await refreshUser();
```

## Protected Routes

### Basic usage
```typescript
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <YourProtectedContent />
    </ProtectedRoute>
  );
}
```

### Admin-only route
```typescript
<ProtectedRoute allowedRoles={['admin']}>
  <AdminContent />
</ProtectedRoute>
```

### Custom redirect
```typescript
<ProtectedRoute 
  allowedRoles={['user', 'admin']}
  redirectTo="/custom-login"
>
  <Content />
</ProtectedRoute>
```

## Error Handling

### Try-Catch Pattern
```typescript
try {
  const response = await authService.login(credentials);
  // Handle success
} catch (error) {
  // error.status - HTTP status code
  // error.message - Error message
  // error.data - Additional error data
  
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive",
  });
}
```

### Common Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `408` - Request Timeout
- `500` - Server Error

## Toast Notifications

### Success message
```typescript
toast({
  title: "Success",
  description: "Operation completed successfully",
  variant: "success",
});
```

### Error message
```typescript
toast({
  title: "Error",
  description: "Something went wrong",
  variant: "destructive",
});
```

### Custom duration
```typescript
toast({
  title: "Info",
  description: "This will disappear in 3 seconds",
  duration: 3000,
});
```

## Loading States

### Button with loading
```typescript
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

### Input with loading
```typescript
<Input
  disabled={isLoading}
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

## TypeScript Types

### User Type
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plan: string;
  isVerified: boolean;
}
```

### Auth Response Type
```typescript
interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  accessToken?: string;
  email?: string;
}
```

## Best Practices

1. **Always handle errors** - Use try-catch blocks
2. **Show loading states** - Provide user feedback
3. **Use toast notifications** - Inform users of results
4. **Validate before API calls** - Reduce unnecessary requests
5. **Store minimal data** - Don't store sensitive data in localStorage
6. **Use ProtectedRoute** - Protect authenticated pages
7. **Refresh user data** - When needed (e.g., after profile update)
8. **Clear sensitive data** - On logout

## Example: Complete Login Component

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/api/auth.service';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.login(formData);
      
      if (response.success && response.user) {
        toast({
          title: "Success",
          description: "Logged in successfully",
          variant: "success",
        });
        
        login(response.user);
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ 
          ...prev, 
          email: e.target.value 
        }))}
        disabled={isLoading}
      />
      <Input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData(prev => ({ 
          ...prev, 
          password: e.target.value 
        }))}
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}
```
