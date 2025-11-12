import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/auth.api';
import { setToken, removeToken } from '../../utils/storage';

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.register(payload);
    const token = data.token;
    if (token) setToken(token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const loginUser = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.login(payload);
    const token = data.token;
    if (token) setToken(token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const forgotPassword = createAsyncThunk('auth/forgot', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.forgotPassword(payload.email);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const resetPassword = createAsyncThunk('auth/reset', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.resetPassword(payload.token, payload.newPassword);
    const token = data.token;
    if (token) setToken(token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});
