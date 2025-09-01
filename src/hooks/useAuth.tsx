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
      // Check if environment variables exist
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.log('Supabase environment variables not found, using fallback data');
        setIsSupabaseConnected(false);
        setLoading(false);
        return;
      }

      // Try to make a simple query to check if Supabase is connected and tables exist
      const { data, error } = await supabaseAdmin.from('roles').select('id').limit(1);
      
      if (error) {
        console.log('Supabase connection failed or tables not created, using fallback data:', error.message);
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

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.email);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }
  };

  const loadUserData = async (email: string) => {
    try {
      // Use service role to bypass RLS for user data loading
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          role:roles(*)
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

      // Get user rights using service role
      const { data: rightsData, error: rightsError } = await supabaseAdmin
        .from('user_role_rights')
        .select(`
          user_rights(*)
        `)
        .eq('user_id', userData.id);

      if (rightsError) {
        console.error('Error loading user rights:', rightsError);
        // Continue without rights if there's an error
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
      toast.error('Failed to load user profile');
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      if (!isSupabaseConnected) {
        // Use fallback authentication
        const fallbackUser = FALLBACK_USERS.find(u => u.email === email && u.password_hash === password);
        
        if (!fallbackUser) {
          toast.error('Invalid email or password');
          return false;
        }

        if (!fallbackUser.is_active) {
          toast.error('Your account is deactivated. Please contact administrator.');
          return false;
        }

        // Set user data for fallback mode
        const rights = fallbackUser.role?.role_name === 'Admin' ? FALLBACK_RIGHTS : 
          FALLBACK_RIGHTS.filter(r => ['CREATE_QUERY', 'UPDATE_QUERY', 'SHARE_QUERY'].includes(r.right_name));

        setUser({
          user: fallbackUser as User,
          role: fallbackUser.role as Role,
          rights: rights
        });

        toast.success('Signed in successfully (Demo Mode)');
        return true;
      }

      // First, verify user exists and password is correct using service role
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          toast.error('Invalid email or password');
        } else {
          console.error('Database error:', userError);
          toast.error('Authentication failed. Please try again.');
        }
        return false;
      }

      if (!userData) {
        toast.error('Invalid email or password');
        return false;
      }

      if (!userData.is_active) {
        toast.error('Your account is deactivated. Please contact administrator.');
        return false;
      }

      if (userData.password_hash !== password) {
        toast.error('Invalid email or password');
        return false;
      }

      // Try to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        // If user doesn't exist in auth, create them
        if (authError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              emailRedirectTo: undefined // Disable email confirmation
            }
          });

          if (signUpError) {
            console.error('Sign up error:', signUpError);
            toast.error('Authentication setup failed. Please try again.');
            return false;
          }

          // If sign up was successful, load user data immediately
          if (signUpData.user) {
            await loadUserData(email);
            toast.success('Signed in successfully');
            return true;
          }
        } else {
          console.error('Auth error:', authError);
          toast.error('Authentication failed. Please try again.');
          return false;
        }
      }

      // If sign in was successful, user data will be loaded via auth state change
      if (authData.user) {
        toast.success('Signed in successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred. Please try again.');
      return false;
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
        return FALLBACK_USERS.some(u => u.email === email);
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
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