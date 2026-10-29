import { create } from 'zustand';
import api from '../lib/api';
import * as SecureStore from 'expo-secure-store';

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  address?: string;
  phone?: string;
  logo?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurant?: Restaurant;
  restaurantId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isReady: false,
  error: null,

  init: async () => {
    try {
      const token = await SecureStore.getItemAsync('admin_token');
      const userJson = await SecureStore.getItemAsync('admin_user');

      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          // Restore authenticated session immediately so user enters app instantly
          set({ token, user, isReady: true });

          // Refresh profile in background without blocking or wiping the session on network lag
          get().fetchMe().catch(() => {});
          return;
        } catch {
          // JSON parse failed on corrupt storage
        }
      }
    } catch (err) {
      console.warn('SecureStore init error:', err);
    }

    set({ token: null, user: null, isReady: true });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user;

      if (!token || !user) {
        throw new Error('Invalid login response from server');
      }

      // Persist session securely on device
      await SecureStore.setItemAsync('admin_token', token);
      await SecureStore.setItemAsync('admin_user', JSON.stringify(user));

      set({ user, token, isLoading: false, error: null });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('admin_token');
      await SecureStore.deleteItemAsync('admin_user');
    } catch {}
    set({ user: null, token: null, isReady: true });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      const user = data.data?.user || data.user;
      if (user) {
        await SecureStore.setItemAsync('admin_user', JSON.stringify(user));
        set({ user });
      }
    } catch (err: any) {
      // ONLY clear session if server explicitly returns 401 Unauthorized (token invalid/expired)
      if (err.response?.status === 401) {
        console.warn('Server returned 401 Unauthorized. Clearing expired session.');
        try {
          await SecureStore.deleteItemAsync('admin_token');
          await SecureStore.deleteItemAsync('admin_user');
        } catch {}
        set({ user: null, token: null });
      } else {
        // Network timeout, slow internet, or offline: retain local authenticated session!
        console.log('Background session validation notice: retaining offline session.');
      }
    }
  },
}));
