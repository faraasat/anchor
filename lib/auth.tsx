// Supabase Auth Hooks and Provider
import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, options?: { data?: any }) => Promise<{ emailConfirmationRequired: boolean; email: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children,
  routes = { login: '/auth', afterLogin: '/(tabs)' }
}: { 
  children: React.ReactNode;
  routes?: { login: string; afterLogin: string };
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to login
      router.replace(routes.login as any);
    } else if (user && inAuthGroup) {
      // Redirect to main app
      router.replace(routes.afterLogin as any);
    }
  }, [user, segments, isLoading]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    options?: { data?: any }
  ) => {
    try {
      setError(null);
      setIsLoading(true);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      if (error) throw error;

      // Check if email confirmation is required
      const emailConfirmationRequired = !data.session;
      
      if (!emailConfirmationRequired) {
        setSession(data.session);
        setUser(data.user);
      }

      return {
        emailConfirmationRequired,
        email,
      };
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
      router.replace(routes.login as any);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Callback Page Component
export function AuthCallbackPage({
  onSuccess,
  onError,
  loadingText = 'Loading...',
}: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  loadingText?: string;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data.session) {
          onSuccess?.();
        } else {
          throw new Error('No session found');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>{loadingText}</Text>
      </View>
    );
  }

  return null;
}
