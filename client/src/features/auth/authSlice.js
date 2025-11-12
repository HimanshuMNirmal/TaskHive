import { createSlice } from '@reduxjs/toolkit';
import { loginUser, registerUser, forgotPassword, resetPassword } from './authThunks';
import { getToken, getUser, setUser as setStorageUser, removeUser, removeToken } from '../../utils/storage';

const storedUser = getUser();

const initialState = {
  user: storedUser,
  token: getToken(),
  organization: storedUser?.organization || null,
  permissions: storedUser?.permissions || [],
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
      state.organization = null;
      state.permissions = [];
      state.status = 'idle';
      state.error = null;
      removeUser();
      removeToken();
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    setPermissions(state, action) {
      state.permissions = action.payload || [];
    }
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => { state.status = 'loading'; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.organization = action.payload.organization;
        state.token = action.payload.token;
        state.permissions = action.payload.permissions || [];
        state.error = null;
        setStorageUser({ 
          ...action.payload.user, 
          organization: action.payload.organization,
          permissions: action.payload.permissions
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.organization = action.payload.organization;
        state.token = action.payload.token;
        state.permissions = action.payload.permissions || [];
        setStorageUser({ 
          ...action.payload.user, 
          organization: action.payload.organization,
          permissions: action.payload.permissions
        });
      })
      .addCase(forgotPassword.fulfilled, (state) => { state.status = 'idle'; })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.user = action.payload.user || state.user;
        state.token = action.payload.token || state.token;
      });
  }
});

export const { logout, setUser, setPermissions } = authSlice.actions;
export default authSlice.reducer;
