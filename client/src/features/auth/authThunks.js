// src/features/auth/authThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';
import { setToken, removeToken } from '../../utils/storage';

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', payload);
    const token = res.data.token;
    if (token) setToken(token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const loginUser = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', payload);
    const token = res.data.token;
    if (token) setToken(token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const forgotPassword = createAsyncThunk('auth/forgot', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/forgot-password', payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const resetPassword = createAsyncThunk('auth/reset', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/reset-password', payload);
    const token = res.data.token;
    if (token) setToken(token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});
