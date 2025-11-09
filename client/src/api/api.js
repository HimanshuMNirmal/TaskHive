// src/api/api.js
import axios from 'axios';
import { getToken, removeToken } from '../utils/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  withCredentials: false
});

// attach token
api.interceptors.request.use(cfg => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// basic response interceptor (example: logout if 401)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      removeToken();
      // optional: redirect to login or dispatch logout
    }
    return Promise.reject(err);
  }
);

export default api;
