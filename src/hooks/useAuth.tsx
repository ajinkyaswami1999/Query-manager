import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser, User, Role, UserRight } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkUserExists: (email: string) => Promise<boolean>;
  isAdmin: () => boolean;
  hasRight: (rightName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Get user data with role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get user rights
      const { data: rightsData, error: rightsError } = await supabase
        .from('user_role_rights')
        .select(`
          user_rights(*)
        `)
        .eq('user_id', userId);

      if (rightsError) throw rightsError;

      const rights = rightsData?.map(r => r.user_rights).filter(Boolean) as UserRight[] || [];

      setUser({
        user: userData as User,
        role: userData.role as Role | null,
        rights: rights
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // First check if user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (userError || !userData) {
        toast.error('Invalid email or password');
        return false;
      }

      if (!userData.is_active) {
        toast.error('Your account is deactivated. Please contact administrator.');
        return false;
      }

      // For demo purposes, we'll use a simple password comparison
      // In production, you should use proper password hashing
      if (userData.password_hash !== password) {
        toast.error('Invalid password');
        return false;
      }

      // Sign in with Supabase Auth (create session)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        // If auth fails, try to sign up first (for demo purposes)
        const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password
        });

        if (signUpError) {
          toast.error('Authentication failed');
          return false;
        }
      }

      toast.success('Signed in successfully');
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Sign in failed');
      return false;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Sign out failed');
    }
  };

  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  };

  const isAdmin = (): boolean => {
    return user?.role?.role_name === 'Admin';
  };

  const hasRight = (rightName: string): boolean => {
    return user?.rights?.some(right => right.right_name === rightName) || false;
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    checkUserExists,
    isAdmin,
    hasRight
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};