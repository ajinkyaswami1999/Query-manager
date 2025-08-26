// import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { supabase } from '../lib/supabase';
// import { AuthUser, User, Role, UserRight } from '../types';
// import toast from 'react-hot-toast';

// interface AuthContextType {
//   user: AuthUser | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<boolean>;
//   signOut: () => Promise<void>;
//   checkUserExists: (email: string) => Promise<boolean>;
//   isAdmin: () => boolean;
//   hasRight: (rightName: string) => boolean;
//   isSupabaseConnected: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// // Hardcoded fallback data
// const FALLBACK_USERS = [
//   {
//     id: 'admin-1',
//     role_id: 'role-admin',
//     name: 'System Administrator',
//     email: 'admin@example.com',
//     password_hash: 'Admin123!@#$4567',
//     is_active: true,
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString(),
//     role: {
//       id: 'role-admin',
//       role_name: 'Admin',
//       description: 'System administrator with full access',
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString()
//     }
//   },
//   {
//     id: 'user-1',
//     role_id: 'role-user',
//     name: 'Demo User',
//     email: 'user@example.com',
//     password_hash: 'User123!@#$4567',
//     is_active: true,
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString(),
//     role: {
//       id: 'role-user',
//       role_name: 'User',
//       description: 'Regular user with limited access',
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString()
//     }
//   }
// ];

// const FALLBACK_RIGHTS = [
//   { id: 'right-1', right_name: 'CREATE_QUERY', description: 'Can create new queries', created_at: new Date().toISOString() },
//   { id: 'right-2', right_name: 'UPDATE_QUERY', description: 'Can update existing queries', created_at: new Date().toISOString() },
//   { id: 'right-3', right_name: 'DELETE_QUERY', description: 'Can delete queries', created_at: new Date().toISOString() },
//   { id: 'right-4', right_name: 'SHARE_QUERY', description: 'Can share queries with others', created_at: new Date().toISOString() },
//   { id: 'right-5', right_name: 'CREATE_USER', description: 'Can create new users', created_at: new Date().toISOString() },
//   { id: 'right-6', right_name: 'MANAGE_MASTERS', description: 'Can manage master data', created_at: new Date().toISOString() },
//   { id: 'right-7', right_name: 'VIEW_ADMIN_PANEL', description: 'Can access admin panel', created_at: new Date().toISOString() }
// ];

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<AuthUser | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

//   useEffect(() => {
//     checkSupabaseConnection();
//   }, []);

//   const checkSupabaseConnection = async () => {
//     try {
//       // Try to make a simple query to check if Supabase is connected
//       const { data, error } = await supabase.from('roles').select('id').limit(1);
      
//       if (error && error.message.includes('relation "roles" does not exist')) {
//         // Tables don't exist yet, but connection is working
//         setIsSupabaseConnected(false);
//       } else if (error) {
//         // Connection error
//         setIsSupabaseConnected(false);
//       } else {
//         // Connection successful
//         setIsSupabaseConnected(true);
//         await getSession();
//       }
//     } catch (error) {
//       console.log('Supabase not connected, using fallback data');
//       setIsSupabaseConnected(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getSession = async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session?.user) {
//         await loadUserData(session.user.id);
//       }
//     } catch (error) {
//       console.error('Error getting session:', error);
//     }

//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//       if (event === 'SIGNED_IN' && session?.user) {
//         await loadUserData(session.user.id);
//       } else if (event === 'SIGNED_OUT') {
//         setUser(null);
//       }
//     });

//     return () => subscription.unsubscribe();
//   };

//   const loadUserData = async (userId: string) => {
//     try {
//       // Get user data with role
//       const { data: userData, error: userError } = await supabase
//         .from('users')
//         .select(`
//           *,
//           role:roles(*)
//         `)
//         .eq('id', userId)
//         .single();

//       if (userError) throw userError;

//       // Get user rights
//       const { data: rightsData, error: rightsError } = await supabase
//         .from('user_role_rights')
//         .select(`
//           user_rights(*)
//         `)
//         .eq('user_id', userId);

//       if (rightsError) throw rightsError;

//       const rights = rightsData?.map(r => r.user_rights).filter(Boolean) as UserRight[] || [];

//       setUser({
//         user: userData as User,
//         role: userData.role as Role | null,
//         rights: rights
//       });
//     } catch (error) {
//       console.error('Error loading user data:', error);
//       toast.error('Failed to load user data');
//     }
//   };

//   const signIn = async (email: string, password: string): Promise<boolean> => {
//     try {
//       if (!isSupabaseConnected) {
//         // Use fallback authentication
//         const fallbackUser = FALLBACK_USERS.find(u => u.email === email && u.password_hash === password);
        
//         if (!fallbackUser) {
//           toast.error('Invalid email or password');
//           return false;
//         }

//         if (!fallbackUser.is_active) {
//           toast.error('Your account is deactivated. Please contact administrator.');
//           return false;
//         }

//         // Set user data for fallback mode
//         const rights = fallbackUser.role?.role_name === 'Admin' ? FALLBACK_RIGHTS : 
//           FALLBACK_RIGHTS.filter(r => ['CREATE_QUERY', 'UPDATE_QUERY', 'SHARE_QUERY'].includes(r.right_name));

//         setUser({
//           user: fallbackUser as User,
//           role: fallbackUser.role as Role,
//           rights: rights
//         });

//         toast.success('Signed in successfully (Demo Mode)');
//         return true;
//       }

//       // Supabase authentication
//       const { data: userData, error: userError } = await supabase
//         .from('users')
//         .select('*')
//         .eq('email', email)
//         .single();

//       if (userError || !userData) {
//         toast.error('Invalid email or password');
//         return false;
//       }

//       if (!userData.is_active) {
//         toast.error('Your account is deactivated. Please contact administrator.');
//         return false;
//       }

//       if (userData.password_hash !== password) {
//         toast.error('Invalid email or password');
//         return false;
//       }

//       // Create or sign in with Supabase Auth
//       const { error: authError } = await supabase.auth.signInWithPassword({
//         email: email,
//         password: password
//       });

//       if (authError) {
//         // Try to sign up if user doesn't exist in auth
//         const { error: signUpError } = await supabase.auth.signUp({
//           email: email,
//           password: password
//         });

//         if (signUpError) {
//           toast.error('Authentication failed');
//           return false;
//         }
//       }

//       toast.success('Signed in successfully');
//       return true;
//     } catch (error) {
//       console.error('Sign in error:', error);
//       toast.error('Sign in failed');
//       return false;
//     }
//   };

//   const signOut = async () => {
//     try {
//       if (isSupabaseConnected) {
//         const { error } = await supabase.auth.signOut();
//         if (error) throw error;
//       }
      
//       setUser(null);
//       toast.success('Signed out successfully');
//     } catch (error) {
//       console.error('Sign out error:', error);
//       toast.error('Sign out failed');
//     }
//   };

//   const checkUserExists = async (email: string): Promise<boolean> => {
//     try {
//       if (!isSupabaseConnected) {
//         return FALLBACK_USERS.some(u => u.email === email);
//       }

//       const { data, error } = await supabase
//         .from('users')
//         .select('id')
//         .eq('email', email)
//         .single();

//       return !error && !!data;
//     } catch (error) {
//       return false;
//     }
//   };

//   const isAdmin = (): boolean => {
//     return user?.role?.role_name === 'Admin';
//   };

//   const hasRight = (rightName: string): boolean => {
//     return user?.rights?.some(right => right.right_name === rightName) || false;
//   };

//   const value = {
//     user,
//     loading,
//     signIn,
//     signOut,
//     checkUserExists,
//     isAdmin,
//     hasRight,
//     isSupabaseConnected
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkUserExists: (email: string) => Promise<boolean>;
  isAdmin: () => boolean;
  hasRight: (rightName: string) => boolean;
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);

  const loadUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select(`*, role:roles(*), rights:user_role_rights(right:role_rights(*))`)
      .eq('id', userId)
      .single();

    if (error) {
      toast.error('Failed to load user data');
      return;
    }
    setUser(data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error || !sessionData?.session?.user) {
          setLoading(false);
          return;
        }
        await loadUserData(sessionData.session.user.id);
      } catch (err) {
        setIsSupabaseConnected(false);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Fallback: check against your own `users` table (demo mode)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (fallbackError || !fallbackData || fallbackData.password_hash !== password) {
          toast.error('Invalid email or password');
          return false;
        }

        setUser(fallbackData);
        setIsSupabaseConnected(false);
        toast.success('Signed in (fallback)');
        return true;
      }

      if (data?.user) {
        await loadUserData(data.user.id);
        toast.success('Signed in successfully');
        return true;
      }

      return false;
    } catch (err) {
      toast.error('Sign-in error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const checkUserExists = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    return !!data && !error;
  };

  const isAdmin = () => {
    return user?.role?.role_name === 'Admin';
  };

  const hasRight = (rightName: string) => {
    if (isAdmin()) return true;
    return user?.rights?.some((r: any) => r?.right?.right_name === rightName);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      checkUserExists,
      isAdmin,
      hasRight,
      isSupabaseConnected,
    }),
    [user, loading, isSupabaseConnected]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};