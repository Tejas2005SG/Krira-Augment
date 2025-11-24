import { apiClient, ApiError } from './client';
import { API_ENDPOINTS } from './config';
import type { Chatbot } from './chatbot.service';

// Type definitions
export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface ResendOtpData {
  email: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
}

export interface GoogleAuthData {
  idToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    plan: string;
    isVerified: boolean;
  };
  accessToken?: string;
  email?: string;
}

export interface ProfileResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    authProvider: string;
    isVerified: boolean;
    plan: string;
    planPrice: number;
    billingCycle: string;
    subscriptionStart: string;
    subscriptionEnd: string;
    isActive: boolean;
    apiKey: string;
    apiUsage: number;
    questionLimit: number;
    questionsUsed: number;
    chatbotLimit: number;
    chatbotsCreated: number;
    teamMembers: number;
    supportType: string;
    watermarkType: string;
    analyticsEnabled: boolean;
    earlyAccess: boolean;
    vectorStoreType: string;
    systemPrompt: string;
    chatbots: Chatbot[];
    storageLimitMb?: number;
    storageUsedMb?: number;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    lastLogin: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Auth Service class
class AuthService {
  /**
   * Sign up a new user
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, data);
  }

  /**
   * Verify OTP after signup
   */
  async verifyOtp(data: VerifyOtpData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
  }

  /**
   * Resend signup OTP
   */
  async resendOtp(data: ResendOtpData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.RESEND_OTP, data);
  }

  /**
   * Login with email and password
   */
  async login(data: LoginData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGOUT);
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(data: ForgotPasswordData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    data: ResetPasswordData
  ): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD(token),
      data
    );
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(data: GoogleAuthData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN_WITH_GOOGLE,
      data
    );
  }

  /**
   * Signup with Google
   */
  async signupWithGoogle(data: GoogleAuthData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.SIGNUP_WITH_GOOGLE,
      data
    );
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    try {
      return await apiClient.get<ProfileResponse>(API_ENDPOINTS.AUTH.PROFILE);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        return { success: false };
      }
      throw error;
    }
  }

  /**
   * Get admin profile
   */
  async getAdminProfile(): Promise<ProfileResponse> {
    try {
      return await apiClient.get<ProfileResponse>(API_ENDPOINTS.AUTH.ADMIN_PROFILE);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        return { success: false };
      }
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * Note: Since cookies are httpOnly, we can't read them in JavaScript
   * We need to make an API call to verify authentication
   */
  async checkAuth(): Promise<boolean> {
    try {
      const response = await this.getProfile();
      return response.success && !!response.user;
    } catch {
      return false;
    }
  }

  /**
   * Clear authentication (for client-side logout)
   */
  clearAuth(): void {
    if (typeof window === 'undefined') return;
    
    // Determine if we're in production (check if using HTTPS)
    const isProduction = window.location.protocol === 'https:';
    const sameSite = isProduction ? 'None; Secure' : 'Lax';
    
    // Clear cookies by setting them to expire in the past
    document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=${sameSite}`;
    document.cookie = `refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=${sameSite}`;
    
    console.log('Auth cookies cleared');
  }
}

// Create and export auth service instance
export const authService = new AuthService();
