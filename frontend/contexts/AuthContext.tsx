"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, ProfileResponse } from '@/lib/api/auth.service';
import { useRouter } from 'next/navigation';

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plan: string;
  isVerified: boolean;
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

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing auth, checking for session...');
        
        // Try to fetch user profile (will use httpOnly cookies automatically)
        try {
          const response = await authService.getProfile();
          
          if (response.success && response.user) {
            console.log('✓ User authenticated:', response.user.email);
            const userData: User = {
              id: response.user.id,
              name: response.user.name,
              email: response.user.email,
              role: response.user.role,
              plan: response.user.plan,
              isVerified: response.user.isVerified,
            };
            setUser(userData);
          } else {
            console.log('✗ No valid session found');
            setUser(null);
          }
        } catch (error: any) {
          console.log('✗ Auth check failed:', error.status || error.message);
          // Token is invalid/expired or not present
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
  }, []);

  // Login function
  const login = (userData: User) => {
    console.log('Setting user in context:', userData.email);
    setUser(userData);
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuth();
      setUser(null);
      router.push('/login');
    }
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
        const userData: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          plan: response.user.plan,
          isVerified: response.user.isVerified,
        };
        setUser(userData);
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
