// API Client - Connects to Tag-A-Long Backend
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://tag-a-long-backend.vercel.app/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to attach auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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

  // Get the axios instance
  getInstance(): AxiosInstance {
    return this.client;
  }

  // Set auth token
  async setAuthToken(token: string) {
    await AsyncStorage.setItem('auth_token', token);
  }

  // Clear auth token
  async clearAuthToken() {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  }
}

export default new APIClient();
