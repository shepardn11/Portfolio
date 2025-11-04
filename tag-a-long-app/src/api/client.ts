// API Client - Connects to Tag-A-Long Backend
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use local backend for development, Vercel for production
const BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://tag-a-long-backend.vercel.app/api';

class APIClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize token from storage
    this.initializeToken();

    // Add request interceptor to attach auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear auth and redirect to login
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user');
          // You can emit an event here to trigger navigation to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Initialize token from AsyncStorage on app start
  private async initializeToken() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error('Error initializing auth token:', error);
    }
  }

  // Get the axios instance
  getInstance(): AxiosInstance {
    return this.client;
  }

  // Set auth token (updates both memory and storage)
  async setAuthToken(token: string) {
    this.authToken = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  // Clear auth token (clears both memory and storage)
  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  }
}

export default new APIClient();
