import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
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
  isSupabaseConnected: boolean;
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

// Hardcoded fallback data
const FALLBACK_USERS = [
  {
    id: 'admin-1',
    role_id: 'role-admin',
    name: 'System Administrator',
    email: 'admin@example.com',
    password_hash: 'Admin123!@#$4567',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: {
      id: 'role-admin',
      role_name: 'Admin',
      description: 'System administrator with full access',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'user-1',
    role_id: 'role-user',
    name: 'Demo User',
    email: 'user@example.com',
    password_hash: 'User123!@#$4567',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: {
      id: 'role-user',
      role_name: 'User',
      description: 'Regular user with limited access',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
];

const FALLBACK_RIGHTS = [
  { id: 'right-1', right_name: 'CREATE_QUERY', description: 'Can create new queries', created_at: new Date().toISOString() },
  { id: 'right-2', right_name: 'UPDATE_QUERY', description: 'Can update existing queries', created_at: new Date().toISOString() },
  { id: 'right-3', right_name: 'DELETE_QUERY', description: 'Can delete queries', created_at: new Date().toISOString() },
  { id: 'right-4', right_name: 'SHARE_QUERY', description: 'Can share queries with others', created_at: new Date().toISOString() },
  { id: 'right-5', right_name: 'CREATE_USER', description: 'Can create new users', created_at: new Date().toISOString() },
  { id: 'right-6', right_name: 'MANAGE_MASTERS', description: 'Can manage master data', created_at: new Date().toISOString() },
  { id: 'right-7', right_name: 'VIEW_ADMIN_PANEL', description: 'Can access admin panel', created_at: new Date().toISOString() }
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.log('Supabase environment variables not found, using fallback data');
        setIsSupabaseConnected(false);
        setLoading(false);
        return;
      }

      const { error } = await supabaseAdmin.from('roles').select('id').limit(1);

      if (error) {
        console.log('Supabase connection failed:', error.message);
        setIsSupabaseConnected(false);
      } else {
        console.log('Supabase connected successfully');
        setIsSupabaseConnected(true);
        await getSession();
      }
    } catch (error) {
      console.log('Supabase not available, using fallback data');
      setIsSupabaseConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const getSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (session?.user) {
        await loadUserData(session.user.email);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);

          if (event === 'SIGNED_IN' && session?.user) {
            await loadUserData(session.user.email);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }
  };

  const loadUserData = async (email: string) => {
    try {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          role:roles!users_role_id_fkey(*)
        `)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError) {
        console.error('Error loading user data:', userError);
        toast.error('Failed to load user profile');
        return;
      }

      if (!userData) {
        toast.error('User not found or inactive');
        return;
      }

      const { data: rightsData, error: rightsError } = await supabaseAdmin
        .from('user_role_rights')
        .select(`
          user_rights(*)
        `)
        .eq('user_id', userData.id);

      if (rightsError) {
        console.error('Error loading user rights:', rightsError);
        toast.error('Warning: Failed to load user permissions');
      }

      const rights = rightsData?.map(r => r.user_rights).filter(Boolean) as UserRight[] || [];

      const authUser: AuthUser = {
        user: userData as User,
        role: userData.role as Role | null,
        rights: rights
      };

      setUser(authUser);
      console.log('User data loaded successfully:', authUser.user.email);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Network error: Failed to load user profile');
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      if (!isSupabaseConnected) {
        const fallbackUser = FALLBACK_USERS.find(u => u.email === email && u.password_hash === password);

        if (!fallbackUser) {
          toast.error('Invalid email or password');
          return false;
        }

        if (!fallbackUser.is_active) {
          toast.error('Your account is deactivated.');
          return false;
        }

        const rights = fallbackUser.role?.role_name === 'Admin'
          ? FALLBACK_RIGHTS
          : FALLBACK_RIGHTS.filter(r =>
              ['CREATE_QUERY', 'UPDATE_QUERY', 'SHARE_QUERY'].includes(r.right_name)
            );

        setUser({
          user: fallbackUser as User,
          role: fallbackUser.role as Role,
          rights: rights
        });

        toast.success('Signed in successfully (Demo Mode)');
        return true;
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          role:roles!users_role_id_fkey(*)
        `)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        toast.error('Invalid email or password');
        return false;
      }

      if (userData.password_hash !== password) {
        toast.error('Invalid email or password');
        return false;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        toast.error(authError.message);
        return false;
      }

      if (authData.user) {
        const rights = await loadUserRights(userData.id);
        setUser({
          user: userData as User,
          role: userData.role as Role | null,
          rights: rights
        });
        toast.success('Signed in successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Network error: Unable to connect');
      return false;
    }
  };

  const loadUserRights = async (userId: string): Promise<UserRight[]> => {
    try {
      if (!isSupabaseConnected) return [];

      const { data: rightsData, error: rightsError } = await supabaseAdmin
        .from('user_role_rights')
        .select(`user_rights(*)`)
        .eq('user_id', userId);

      if (rightsError) {
        console.error('Error loading user rights:', rightsError);
        return [];
      }

      return rightsData?.map(r => r.user_rights).filter(Boolean) as UserRight[] || [];
    } catch (error) {
      console.error('Error loading user rights:', error);
      return [];
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConnected) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Sign out error:', error);
          toast.error('Sign out failed');
          return;
        }
      }
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Sign out failed');
    }
  };

  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      if (!isSupabaseConnected) {
        return FALLBACK_USERS.some(u => u.email === email && u.is_active);
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user existence:', error);
      }

      return !error && !!data;
    } catch (error) {
      console.error('Error checking user existence:', error);
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
    hasRight,
    isSupabaseConnected
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
