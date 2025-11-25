"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '@/lib/api/auth.service';
import type { Chatbot } from '@/lib/api/chatbot.service';
import { useRouter } from 'next/navigation';

// Token refresh interval: 13 minutes (before 15 min access token expiry)
const TOKEN_REFRESH_INTERVAL = 13 * 60 * 1000;
// Retry delay for failed refresh attempts
const REFRESH_RETRY_DELAY = 30 * 1000;

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plan: string;
  isVerified: boolean;
  authProvider?: string;
  planPrice?: number;
  billingCycle?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  isActive?: boolean;
  apiKey?: string;
  apiUsage?: number;
  questionLimit?: number;
  questionsUsed?: number;
  chatbotLimit?: number;
  chatbotsCreated?: number;
  teamMembers?: number;
  supportType?: string;
  watermarkType?: string;
  analyticsEnabled?: boolean;
  earlyAccess?: boolean;
  vectorStoreType?: string;
  systemPrompt?: string;
  chatbots?: Chatbot[];
  storageLimitMb?: number;
  storageUsedMb?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map profile response to User
const mapProfileToUser = (profile: NonNullable<Awaited<ReturnType<typeof authService.getProfile>>['user']>): User => ({
  id: profile.id,
  name: profile.name,
  email: profile.email,
  role: profile.role,
  plan: profile.plan,
  isVerified: profile.isVerified,
  authProvider: profile.authProvider,
  planPrice: profile.planPrice,
  billingCycle: profile.billingCycle,
  subscriptionStart: profile.subscriptionStart,
  subscriptionEnd: profile.subscriptionEnd,
  isActive: profile.isActive,
  apiKey: profile.apiKey,
  apiUsage: profile.apiUsage,
  questionLimit: profile.questionLimit,
  questionsUsed: profile.questionsUsed,
  chatbotLimit: profile.chatbotLimit,
  chatbotsCreated: profile.chatbotsCreated,
  teamMembers: profile.teamMembers,
  supportType: profile.supportType,
  watermarkType: profile.watermarkType,
  analyticsEnabled: profile.analyticsEnabled,
  earlyAccess: profile.earlyAccess,
  vectorStoreType: profile.vectorStoreType,
  systemPrompt: profile.systemPrompt,
  chatbots: profile.chatbots,
  storageLimitMb: profile.storageLimitMb,
  storageUsedMb: profile.storageUsedMb,
  stripeCustomerId: profile.stripeCustomerId,
  stripeSubscriptionId: profile.stripeSubscriptionId,
  lastLogin: profile.lastLogin,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const lastRefreshTimeRef = useRef<number>(0);

  // Proactive token refresh function
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      return false;
    }

    // Prevent rapid refresh attempts (minimum 10 seconds between attempts)
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 10000) {
      return false;
    }

    isRefreshingRef.current = true;
    lastRefreshTimeRef.current = now;

    try {
      const response = await authService.refreshToken();
      if (response.success) {
        console.log('✓ Token refreshed successfully');
        return true;
      }
      console.log('✗ Token refresh returned unsuccessful');
      return false;
    } catch (error) {
      console.log('✗ Token refresh failed:', error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Start proactive token refresh interval
  const startTokenRefreshInterval = useCallback(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up proactive token refresh
    refreshIntervalRef.current = setInterval(async () => {
      if (user) {
        const success = await refreshTokens();
        if (!success) {
          // Retry once after delay
          setTimeout(async () => {
            const retrySuccess = await refreshTokens();
            if (!retrySuccess && user) {
              // If still failing, try to get profile to check auth status
              try {
                const profileResponse = await authService.getProfile();
                if (!profileResponse.success) {
                  console.log('Session expired, dispatching unauthorized event');
                  window.dispatchEvent(new Event('auth:unauthorized'));
                }
              } catch {
                console.log('Profile check failed after refresh failure');
                window.dispatchEvent(new Event('auth:unauthorized'));
              }
            }
          }, REFRESH_RETRY_DELAY);
        }
      }
    }, TOKEN_REFRESH_INTERVAL);

    console.log('Token refresh interval started (every 13 minutes)');
  }, [user, refreshTokens]);

  // Stop token refresh interval
  const stopTokenRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log('Token refresh interval stopped');
    }
  }, []);

  const logout = useCallback(async () => {
    stopTokenRefreshInterval();
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuth();
      setUser(null);
      router.push('/');
    }
  }, [router, stopTokenRefreshInterval]);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing auth, checking for session...');
        
        // First, try to refresh tokens (in case access token expired but refresh token is still valid)
        try {
          const refreshResponse = await authService.refreshToken();
          if (refreshResponse.success) {
            console.log('✓ Tokens refreshed on init');
          }
        } catch {
          // Refresh might fail if no valid session, that's okay
          console.log('Token refresh on init skipped (no existing session or expired)');
        }
        
        // Now try to fetch user profile
        try {
          const response = await authService.getProfile();
          
          if (response.success && response.user) {
            console.log('✓ User authenticated:', response.user.email);
            setUser(mapProfileToUser(response.user));
          } else {
            console.log('✗ No valid session found');
            setUser(null);
          }
        } catch (error) {
          if (error instanceof Error) {
            console.log('✗ Auth check failed:', (error as { status?: number }).status || error.message);
          } else {
            console.log('✗ Auth check failed');
          }
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('Auth initialization complete');
      }
    };

    initAuth();

    // Listen for unauthorized events from ApiClient (e.g. failed refresh)
    const handleUnauthorized = () => {
      console.log('Received auth:unauthorized event, logging out...');
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      stopTokenRefreshInterval();
    };
  }, [logout, stopTokenRefreshInterval]);

  // Start/stop refresh interval based on user state
  useEffect(() => {
    if (user) {
      startTokenRefreshInterval();
    } else {
      stopTokenRefreshInterval();
    }
  }, [user, startTokenRefreshInterval, stopTokenRefreshInterval]);

  // Handle visibility change - refresh token when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // User returned to tab, refresh token to ensure session is valid
        const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current;
        // Only refresh if more than 5 minutes since last refresh
        if (timeSinceLastRefresh > 5 * 60 * 1000) {
          console.log('Tab became visible, checking token freshness...');
          await refreshTokens();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshTokens]);

  // Login function
  const login = (userData: User) => {
    console.log('Setting user in context:', userData.email);
    setUser(userData);
  };

  // Update user function
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  // Refresh user data from server
  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.user) {
        setUser(mapProfileToUser(response.user));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
