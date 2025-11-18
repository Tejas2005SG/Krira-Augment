// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    VERIFY_OTP: '/auth/verifybyotp',
    RESEND_OTP: '/auth/resend-otp',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgotpassword',
    RESET_PASSWORD: (token: string) => `/auth/resetpassword/${token}`,
    LOGIN_WITH_GOOGLE: '/auth/loginwithgoogle',
    SIGNUP_WITH_GOOGLE: '/auth/signupwithgoogle',
    PROFILE: '/auth/profile',
    ADMIN_PROFILE: '/auth/admin/profile',
  },
};

// Response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
