import axios from 'axios';
import { getToken, removeToken } from '../utils/storage';
import apiQueue from '../utils/apiQueue';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
console.log('API Base URL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  withCredentials: false
});

api.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  res => {
    if (!res.data.success) {
      return Promise.reject({
        response: {
          status: res.status,
          data: {
            message: res.data.message || 'Operation failed'
          }
        }
      });
    }
    return res.data;
  },
  err => {
    console.error(err)
    if (err.response && err.response.status === 401) {
      removeToken();
    
    }
    return Promise.reject({
      response: {
        status: err.response?.status || 500,
        data: {
          message: err.response?.data?.message || 'Something went wrong!'
        }
      }
    });
  }
);

const originalGet = api.get.bind(api);
const originalPost = api.post.bind(api);
const originalPut = api.put.bind(api);
const originalDelete = api.delete.bind(api);

api.get = function (...args) {
  return apiQueue.add(() => originalGet(...args));
};

api.post = function (...args) {
  return apiQueue.add(() => originalPost(...args));
};

api.put = function (...args) {
  return apiQueue.add(() => originalPut(...args));
};

api.delete = function (...args) {
  return apiQueue.add(() => originalDelete(...args));
};

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      removeToken();
    }
    return Promise.reject(err);
  }
);

export default api;
