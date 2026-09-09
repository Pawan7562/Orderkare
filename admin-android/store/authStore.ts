import { create } from 'zustand';
import api from '../lib/api';
import * as SecureStore from 'expo-secure-store';

export interface Restaurant {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  logo?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  restaurant?: Restaurant;
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
        set({ token, user: JSON.parse(userJson) });
        await get().fetchMe();
      } else {
        set({ isReady: true });
      }
    } catch {
      await SecureStore.deleteItemAsync('admin_token');
      await SecureStore.deleteItemAsync('admin_user');
      set({ token: null, user: null, isReady: true });
    }
    set({ isReady: true });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user;
      if (!token || !user) throw new Error('Invalid login response');

      await SecureStore.setItemAsync('admin_token', token);
      await SecureStore.setItemAsync('admin_user', JSON.stringify(user));
      set({ user, token, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('admin_token');
    await SecureStore.deleteItemAsync('admin_user');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      const user = data.data?.user || data.user;
      if (!user) throw new Error('Invalid session response');
      await SecureStore.setItemAsync('admin_user', JSON.stringify(user));
      set({ user });
    } catch {
      await SecureStore.deleteItemAsync('admin_token');
      await SecureStore.deleteItemAsync('admin_user');
      set({ user: null, token: null });
    }
  },
}));
