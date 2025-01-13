import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For Android Emulator, use 10.0.2.2
// For iOS Simulator, use localhost
// const BASE_URL = __DEV__ 
//   ? Platform.select({
//       // 10.0.2.2 is the special alias for localhost in Android emulator
//       android: 'http://10.0.2.2:8000/api',  // Note: no trailing slash
//       ios: 'http://localhost:8000/api',
//     }) || 'http://127.0.0.1:8000/api'
//   : 'https://your-production-api.com/api';
const BASE_URL = 'https://api.wingsfly.in/api';

// Add this console log to verify the URL being used
console.log('API Base URL:', BASE_URL);

// Add this before creating the axios instance
console.log('Initializing API with URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Update the request interceptor with more details
api.interceptors.request.use(
  (config) => {
    console.log('Full Request Config:', {
      baseURL: config.baseURL,
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      method: config.method,
      data: config.data,
      headers: config.headers,
      timeout: config.timeout
    });
    return config;
  },
  (error) => {
    console.error('Request Configuration Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('Response Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      },
      isAxiosError: error.isAxiosError,
      status: error.response?.status
    });
    return Promise.reject(error);
  }
);

// Add interceptor to add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 