// Auth Store - Zustand state management for authentication
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, SignupData } from '../types';
import { authAPI, profileAPI } from '../api/endpoints';
import apiClient from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setIsAuthenticated: (value: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Login action
  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authAPI.login(credentials);

      if (response.success && response.data.token) {
        const { token, user } = response.data;

        // Save token
        await apiClient.setAuthToken(token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  // Signup action
  signup: async (data: SignupData) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authAPI.signup(data);

      if (response.success && response.data.token) {
        const { token, user } = response.data;

        // Save token and user, but don't set isAuthenticated yet
        // User will complete profile setup first, then become authenticated
        await apiClient.setAuthToken(token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: false, // Keep false to stay in auth flow for profile setup
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.error?.message || 'Signup failed');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Signup failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  // Logout action
  logout: async () => {
    try {
      await apiClient.clearAuthToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Load user from storage on app start
  loadUser: async () => {
    try {
      set({ isLoading: true });

      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);

        // Optionally, verify token is still valid by fetching fresh user data
        try {
          const freshUser = await profileAPI.getMyProfile();
          await AsyncStorage.setItem('user', JSON.stringify(freshUser));

          set({
            user: freshUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid, clear auth
          await apiClient.clearAuthToken();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Load user error:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Set user
  setUser: (user: User | null) => {
    set({ user });
    if (user) {
      AsyncStorage.setItem('user', JSON.stringify(user));
    }
  },

  // Update user in state
  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      set({ user: updatedUser });
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  },

  // Set authentication status
  setIsAuthenticated: (value: boolean) => {
    set({ isAuthenticated: value });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
