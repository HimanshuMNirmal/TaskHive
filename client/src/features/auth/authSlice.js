// src/features/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { loginUser, registerUser, forgotPassword, resetPassword } from './authThunks';
import { getToken, getUser, setUser as setStorageUser, removeUser, removeToken } from '../../utils/storage';

const initialState = {
  user: getUser(),
  token: getToken(),
  status: 'idle',
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      removeUser();
      removeToken();
    },
    setUser(state, action) {
      state.user = action.payload;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => { state.status = 'loading'; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        setStorageUser(action.payload.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error;
      })
      // register cases
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        setStorageUser(action.payload.user);
      })
      // forgot/reset flows
      .addCase(forgotPassword.fulfilled, (state) => { state.status = 'idle'; })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.user = action.payload.user || state.user;
        state.token = action.payload.token || state.token;
      });
  }
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
