import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import CryptoJS from 'crypto-js';
import api from '../api';

const encrypt = (data, key) => CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
const decrypt = (data, key) => {
  const bytes = CryptoJS.AES.decrypt(data, key);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

const SECRET_KEY = process.env.REACT_APP_STORAGE_SECRET || 'default-secret-key';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: true,
      error: null,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setToken: (token) => set({ token }),

      login: async (email, password, deviceToken, role) => {
        try {
          set({ error: null });
          const res = await axios.post(
            `${process.env.REACT_APP_API_BASE_URL}/api/auth/login`,
            { email, password, deviceToken, role }
          );
          set({ token: res.data.token });
          // Initialize auth immediately after login
          get().initializeAuth();
          return res.data;
        } catch (err) {
          set({ error: err.response?.data?.msg || 'Login failed' });
          throw err;
        }
      },

      register: async (userData) => {
        try {
          set({ error: null });
          const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/register`, userData);
          set({ token: res.data.token });
          // Initialize auth immediately after registration
          get().initializeAuth();
          return res.data;
        } catch (err) {
          set({ error: err.response?.data?.msg || 'Registration failed' });
          throw err;
        }
      },

      logout: () => {
        set({ token: null, user: null });
        delete axios.defaults.headers.common['x-auth-token'];
      },

      loadUser: async () => {
        const { token, user } = get();
        if (!token) return;
        
        try {
          set({ error: null });
          const res = await api.get('/api/auth/me');
          set({ 
            user: {
              ...user,
              ...res.data
            }
          });
          return res.data;
        } catch (err) {
          set({ error: err.response?.data?.msg || 'Failed to load user data' });
          if (err.response?.status === 401) {
            get().logout();
          }
          throw err;
        }
      },

      updateProfile: async (userId, userData) => {
        try {
          set({ error: null });
          const res = await api.put(`${process.env.REACT_APP_API_BASE_URL}/api/users/${userId}`, userData);
          const { user } = get();
          
          if (user && userId === user.id) {
            set({
              user: {
                ...user,
                ...res.data
              }
            });
          }
          return res.data;
        } catch (err) {
          set({ error: err.response?.data?.msg || 'Failed to update profile' });
          throw err;
        }
      },

      forgotPassword: async (email) => {
        try {
          set({ error: null });
          const res = await api.post('/api/auth/forgot-password', { email });
          return res.data;
        } catch (err) {
          set({ error: err.response?.data?.msg || 'Failed to process password reset request' });
          throw err;
        }
      },

      resetPassword: async (resetToken, password) => {
        try {
          set({ error: null });
          const res = await api.put(`/api/auth/reset-password/${resetToken}`, { password });
          return res.data;
        } catch (err) {
          set({ error: err.response?.data?.msg || 'Failed to reset password' });
          throw err;
        }
      },

      updateDeviceToken: async (deviceToken) => {
        try {
          set({ error: null });
          const res = await api.put(`${process.env.REACT_APP_API_BASE_URL}/api/users/device-token`, { deviceToken });
          return res.data;
        } catch (err) {
          set({ error: err.response?.data?.msg || 'Failed to update device token' });
          throw err;
        }
      },

      initializeAuth: () => {
        const { token } = get();
        if (token) {
          try {
            const decoded = jwt_decode(token);
            const currentTime = Date.now() / 1000;
            
            if (decoded.exp < currentTime) {
              get().logout();
            } else {
              axios.defaults.headers.common['x-auth-token'] = token;
              set({ user: decoded, loading: false });
            }
          } catch (err) {
            console.error('Invalid token:', err);
            get().logout();
          }
        } else {
          set({ loading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      serialize: (state) => encrypt(state, SECRET_KEY),
      deserialize: (str) => decrypt(str, SECRET_KEY),
      partialize: (state) => ({ token: state.token })
    }
  )
);

export default useAuthStore;