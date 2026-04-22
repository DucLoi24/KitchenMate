import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/authApi';
import axiosInstance from '../api/axiosInstance';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (userData, accessToken, refreshToken) => {
        set({
          user: userData,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        const refreshToken = get().refreshToken;
        try {
          await authApi.logout(refreshToken);
        } catch (e) {
          // Ignore logout API errors, clear local state anyway
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return false;
        }
        try {
          const response = await axiosInstance.post('/auth/refresh/', {
            refresh: refreshToken,
          });
          const { access } = response.data;
          set({ accessToken: access });
          return true;
        } catch (error) {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return false;
        }
      },

      setUser: (userData) => {
        set({ user: userData });
      },

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      setRefreshToken: (refreshToken) => {
        set({ refreshToken });
      },
    }),
    {
      name: 'kitchenmate-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
