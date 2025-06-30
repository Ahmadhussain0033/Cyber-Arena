import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Use hardcoded values as fallback to prevent URL errors
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lydnztphxbxhzshuokjx.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZG56dHBoeGJ4aHpzaHVva2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExODcxNzIsImV4cCI6MjA2Njc2MzE3Mn0.bAj6mTfp9POYPPw3tktnxIp37AEKwaJEsD6Wm4Dr7Ss';

// Validate URL format
if (!supabaseUrl.startsWith('http')) {
  throw new Error('Invalid Supabase URL format');
}

// Custom storage for web compatibility
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return Promise.resolve(localStorage.getItem(key));
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Disable email confirmation for immediate access
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'cyber-arena-app',
    },
  },
});

export const isDemoMode = false;