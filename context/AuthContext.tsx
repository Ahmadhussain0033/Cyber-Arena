import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Platform } from 'react-native';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isLocalMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInAsGuest: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  upgradeGuestAccount: (email: string, password: string) => Promise<void>;
  switchToLocalMode: () => void;
  switchToSupabaseMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Storage helper for cross-platform compatibility
const storage = {
  getItem: (key: string): string | null => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return (global as any)[key] || null;
  },
  setItem: (key: string, value: string): void => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      (global as any)[key] = value;
    }
  },
  removeItem: (key: string): void => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      delete (global as any)[key];
    }
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // Check if user prefers local mode
    const localModePreference = storage.getItem('local_mode_enabled');
    if (localModePreference === 'true') {
      setIsLocalMode(true);
    }

    // Check for guest session first
    const guestData = storage.getItem('guest_user');
    if (guestData) {
      try {
        const guestUser = JSON.parse(guestData);
        setUser(guestUser);
        setIsGuest(true);
        setLoading(false);
        return;
      } catch (error) {
        storage.removeItem('guest_user');
      }
    }

    // Check for local user session
    const localUserData = storage.getItem('local_user');
    if (localUserData && isLocalMode) {
      try {
        const localUser = JSON.parse(localUserData);
        setUser(localUser);
        setLoading(false);
        return;
      } catch (error) {
        storage.removeItem('local_user');
      }
    }

    // Only try Supabase if not in local mode
    if (!isLocalMode) {
      initializeSupabaseAuth();
    } else {
      setLoading(false);
    }
  }, [isLocalMode]);

  const initializeSupabaseAuth = async () => {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Supabase session error:', error.message);
        // Switch to local mode if Supabase fails
        setIsLocalMode(true);
        storage.setItem('local_mode_enabled', 'true');
        setLoading(false);
        return;
      }

      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          setSession(session);
          setIsGuest(false);
          storage.removeItem('guest_user');
          
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setUser(null);
            setLoading(false);
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.warn('Failed to initialize Supabase auth, switching to local mode:', error);
      setIsLocalMode(true);
      storage.setItem('local_mode_enabled', 'true');
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User profile doesn't exist, get auth user data
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser.user) {
            await createDefaultUser(authUser.user);
            return;
          }
        }
        throw error;
      }

      if (data) {
        const userProfile: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          balance: data.balance,
          debt: data.debt,
          rank: data.rank,
          level: data.level,
          totalWins: data.total_wins,
          totalLosses: data.total_losses,
          winStreak: data.win_streak,
          miningPower: data.mining_power,
          isLocked: data.is_locked,
          xp: data.xp,
          achievements: data.achievements,
          lastActive: new Date(data.last_active),
        };
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultUser = async (authUser: any) => {
    try {
      const username = authUser.email?.split('@')[0] || 'player';
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          username: username,
          balance: 5.00,
          debt: 0,
          rank: 999999,
          level: 1,
          total_wins: 0,
          total_losses: 0,
          win_streak: 0,
          mining_power: 500,
          is_locked: false,
          xp: 0,
          achievements: [],
          last_active: new Date().toISOString(),
        });

      if (error) throw error;
      
      await fetchUserProfile(authUser.id);
    } catch (error) {
      console.error('Error creating default user:', error);
      setLoading(false);
    }
  };

  const createLocalUser = (email: string, username: string): User => {
    return {
      id: `local_${Date.now()}`,
      username: username.trim(),
      email: email.trim(),
      balance: 5.00,
      debt: 0,
      rank: 999999,
      level: 1,
      totalWins: 0,
      totalLosses: 0,
      winStreak: 0,
      miningPower: 500,
      isLocked: false,
      xp: 0,
      achievements: [],
      lastActive: new Date(),
    };
  };

  const signIn = async (email: string, password: string) => {
    if (isLocalMode) {
      // Local mode sign in
      const localUsers = storage.getItem('local_users');
      const users = localUsers ? JSON.parse(localUsers) : {};
      
      const userKey = email.toLowerCase().trim();
      const userData = users[userKey];
      
      if (!userData || userData.password !== password) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      
      const user = createLocalUser(userData.email, userData.username);
      user.id = userData.id;
      user.balance = userData.balance || 5.00;
      user.totalWins = userData.totalWins || 0;
      user.totalLosses = userData.totalLosses || 0;
      user.winStreak = userData.winStreak || 0;
      user.miningPower = userData.miningPower || 500;
      user.level = userData.level || 1;
      user.xp = userData.xp || 0;
      
      storage.setItem('local_user', JSON.stringify(user));
      setUser(user);
      console.log('Local sign in successful for:', email);
      return;
    }

    // Supabase sign in
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.');
        } else {
          throw new Error(error.message);
        }
      }

      console.log('Supabase sign in successful for:', email);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    if (isLocalMode) {
      // Local mode sign up
      const localUsers = storage.getItem('local_users');
      const users = localUsers ? JSON.parse(localUsers) : {};
      
      const userKey = email.toLowerCase().trim();
      
      if (users[userKey]) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      
      // Check if username is taken
      const existingUsername = Object.values(users).find((u: any) => 
        u.username.toLowerCase() === username.toLowerCase().trim()
      );
      
      if (existingUsername) {
        throw new Error('Username is already taken. Please choose a different username.');
      }
      
      const newUser = createLocalUser(email, username);
      
      users[userKey] = {
        id: newUser.id,
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        password: password,
        balance: 5.00,
        totalWins: 0,
        totalLosses: 0,
        winStreak: 0,
        miningPower: 500,
        level: 1,
        xp: 0,
        createdAt: new Date().toISOString(),
      };
      
      storage.setItem('local_users', JSON.stringify(users));
      storage.setItem('local_user', JSON.stringify(newUser));
      setUser(newUser);
      console.log('Local sign up successful for:', email);
      return;
    }

    // Supabase sign up
    try {
      // First check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase().trim())
        .single();

      if (existingUser) {
        throw new Error('Username is already taken. Please choose a different username.');
      }

      // Sign up with email confirmation disabled
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long.');
        } else {
          throw new Error(error.message);
        }
      }

      if (data.user) {
        // Create user profile immediately
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email.toLowerCase().trim(),
            username: username.toLowerCase().trim(),
            balance: 5.00,
            debt: 0,
            rank: 999999,
            level: 1,
            total_wins: 0,
            total_losses: 0,
            win_streak: 0,
            mining_power: 500,
            is_locked: false,
            xp: 0,
            achievements: [],
            last_active: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        console.log('Supabase sign up successful for:', email);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInAsGuest = async (username: string) => {
    try {
      const guestUser: User = {
        id: `guest_${Date.now()}`,
        username: username.trim(),
        email: '',
        balance: 5.00,
        debt: 0,
        rank: 999999,
        level: 1,
        totalWins: 0,
        totalLosses: 0,
        winStreak: 0,
        miningPower: 500,
        isLocked: false,
        xp: 0,
        achievements: [],
        lastActive: new Date(),
      };

      storage.setItem('guest_user', JSON.stringify(guestUser));
      setUser(guestUser);
      setIsGuest(true);
      console.log('Guest sign in successful for:', username);
    } catch (error: any) {
      console.error('Guest sign in error:', error);
      throw new Error('Failed to create guest account. Please try again.');
    }
  };

  const upgradeGuestAccount = async (email: string, password: string) => {
    if (!isGuest || !user) {
      throw new Error('Not a guest account');
    }

    if (isLocalMode) {
      // Local mode upgrade
      const localUsers = storage.getItem('local_users');
      const users = localUsers ? JSON.parse(localUsers) : {};
      
      const userKey = email.toLowerCase().trim();
      
      if (users[userKey]) {
        throw new Error('An account with this email already exists.');
      }
      
      const upgradedUser = createLocalUser(email, user.username);
      upgradedUser.balance = user.balance;
      upgradedUser.totalWins = user.totalWins;
      upgradedUser.totalLosses = user.totalLosses;
      upgradedUser.winStreak = user.winStreak;
      upgradedUser.miningPower = user.miningPower;
      upgradedUser.level = user.level;
      upgradedUser.xp = user.xp;
      
      users[userKey] = {
        id: upgradedUser.id,
        email: email.toLowerCase().trim(),
        username: user.username,
        password: password,
        balance: user.balance,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        winStreak: user.winStreak,
        miningPower: user.miningPower,
        level: user.level,
        xp: user.xp,
        createdAt: new Date().toISOString(),
      };
      
      storage.setItem('local_users', JSON.stringify(users));
      storage.setItem('local_user', JSON.stringify(upgradedUser));
      storage.removeItem('guest_user');
      
      setUser(upgradedUser);
      setIsGuest(false);
      console.log('Local guest account upgraded successfully');
      return;
    }

    // Supabase upgrade (existing code)
    try {
      const { data: existingAuth } = await supabase.auth.admin.getUserByEmail(email);
      if (existingAuth.user) {
        throw new Error('An account with this email already exists.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: undefined,
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email.toLowerCase().trim(),
            username: user.username,
            balance: user.balance,
            debt: user.debt,
            rank: user.rank,
            level: user.level,
            total_wins: user.totalWins,
            total_losses: user.totalLosses,
            win_streak: user.winStreak,
            mining_power: user.miningPower,
            is_locked: user.isLocked,
            xp: user.xp,
            achievements: user.achievements,
            last_active: new Date().toISOString(),
          });

        if (profileError) throw profileError;

        storage.removeItem('guest_user');
        setIsGuest(false);
        console.log('Supabase guest account upgraded successfully');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (isGuest) {
        storage.removeItem('guest_user');
        setUser(null);
        setIsGuest(false);
        console.log('Guest signed out');
      } else if (isLocalMode) {
        storage.removeItem('local_user');
        setUser(null);
        console.log('Local user signed out');
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        console.log('Supabase user signed out');
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (isGuest) {
      if (user) {
        storage.setItem('guest_user', JSON.stringify(user));
      }
    } else if (isLocalMode) {
      if (user) {
        storage.setItem('local_user', JSON.stringify(user));
        
        // Also update in users database
        const localUsers = storage.getItem('local_users');
        if (localUsers) {
          const users = JSON.parse(localUsers);
          const userKey = user.email.toLowerCase();
          if (users[userKey]) {
            users[userKey] = {
              ...users[userKey],
              balance: user.balance,
              totalWins: user.totalWins,
              totalLosses: user.totalLosses,
              winStreak: user.winStreak,
              miningPower: user.miningPower,
              level: user.level,
              xp: user.xp,
            };
            storage.setItem('local_users', JSON.stringify(users));
          }
        }
      }
    } else if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  };

  const switchToLocalMode = () => {
    setIsLocalMode(true);
    storage.setItem('local_mode_enabled', 'true');
    // Sign out current user
    signOut();
  };

  const switchToSupabaseMode = () => {
    setIsLocalMode(false);
    storage.removeItem('local_mode_enabled');
    // Sign out current user and reinitialize Supabase
    signOut().then(() => {
      initializeSupabaseAuth();
    });
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    isGuest,
    isLocalMode,
    signIn,
    signUp,
    signInAsGuest,
    signOut,
    refreshUser,
    upgradeGuestAccount,
    switchToLocalMode,
    switchToSupabaseMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}