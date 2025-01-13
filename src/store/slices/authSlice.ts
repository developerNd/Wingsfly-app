import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '../../services/api';

interface UserData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ValidationErrors {
  message: string;
  errors: Record<string, string[]>;
}

interface UserResponse {
  user: {
    name: string;
    email: string;
  };
  token: string;
}

interface AuthState {
  user: {
    name: string;
    email: string;
  } | null;
  loading: boolean;
  error: null | string;
}

export const register = createAsyncThunk(
  'auth/register',
  async (userData: UserData, { rejectWithValue }) => {
    try {
      const response = await axios.post('https://api.wingsfly.in/api/register', userData);
      console.log('Register Response:', response.data);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 422) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.response?.data || { message: 'Registration failed' });
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await api.post('/login', credentials);
      return response.data;
    } catch (err: any) {
      console.error('Login Error:', err.response?.data || err.message);
      return rejectWithValue(
        err.response?.data || { message: 'Network error. Please check your connection.' }
      );
    }
  }
);

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user || action.payload;
      });
  },
});

export default authSlice.reducer; 