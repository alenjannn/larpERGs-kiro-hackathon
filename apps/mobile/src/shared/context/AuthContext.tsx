import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { DemoRole } from '../config/demo';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: DemoRole | null;
  loading: boolean;
  signInWithPassword: (email: string, pass: string) => Promise<{ error: Error | null; role?: DemoRole }>;
  signUp: (email: string, pass: string, role?: DemoRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setDemoRole: (role: DemoRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractRole(user: User | null): DemoRole | null {
  if (!user) return null;
  const role = user.app_metadata?.role || user.user_metadata?.role;
  if (role === 'admin' || role === 'bhw' || role === 'patient') {
    return role as DemoRole;
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<DemoRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setRole(extractRole(session?.user ?? null));
        setLoading(false);
      })
      // Never an endless spinner (OC-15.4): fall back to "no session".
      .catch((error: unknown) => {
        console.warn('Could not read the auth session:', error);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(extractRole(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email: string, pass: string) => {
    if (!supabase) return { error: new Error('Supabase client not configured') };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { error: new Error(error.message) };
    const userRole = extractRole(data.user);
    if (userRole) setRole(userRole);
    return { error: null, role: userRole ?? undefined };
  };

  const signUp = async (email: string, pass: string, userRole: DemoRole = 'patient') => {
    if (!supabase) return { error: new Error('Supabase client not configured') };
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { role: userRole } }
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setRole(null);
  };

  const setDemoRole = (newRole: DemoRole) => {
    setRole(newRole);
    setUser({
      id: `demo-${newRole}`,
      email: `${newRole}@demo.tuloy.health`,
      app_metadata: { role: newRole },
      user_metadata: { role: newRole, is_demo: true },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signInWithPassword,
        signUp,
        signOut,
        setDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
