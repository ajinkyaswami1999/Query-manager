import { createClient } from '@supabase/supabase-js';

// Check if environment variables exist
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client if environment variables are missing
let supabase: any;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Create a mock client for fallback mode
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not connected') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not connected') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not connected') }),
          limit: () => Promise.resolve({ data: null, error: new Error('Supabase not connected') }),
          order: () => Promise.resolve({ data: null, error: new Error('Supabase not connected') })
        }),
        order: () => Promise.resolve({ data: null, error: new Error('Supabase not connected') })
      }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase not connected') }),
      update: () => ({
        eq: () => Promise.resolve({ error: new Error('Supabase not connected') })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: new Error('Supabase not connected') })
      })
    })
  };
}

export { supabase };

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          role_name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role_name: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role_name?: string;
          description?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          role_id: string | null;
          name: string;
          email: string;
          password_hash: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role_id?: string | null;
          name: string;
          email: string;
          password_hash: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string | null;
          name?: string;
          email?: string;
          password_hash?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      queries: {
        Row: {
          id: string;
          query_name: string;
          engine_id: string | null;
          category_id: string | null;
          tag_id: string | null;
          query_text: string;
          description: string;
          is_shared: boolean;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          query_name: string;
          engine_id?: string | null;
          category_id?: string | null;
          tag_id?: string | null;
          query_text: string;
          description?: string;
          is_shared?: boolean;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          query_name?: string;
          engine_id?: string | null;
          category_id?: string | null;
          tag_id?: string | null;
          query_text?: string;
          description?: string;
          is_shared?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      database_engine_master: {
        Row: {
          id: string;
          engine_name: string;
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          engine_name: string;
          description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          engine_name?: string;
          description?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      category_master: {
        Row: {
          id: string;
          category_name: string;
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_name: string;
          description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_name?: string;
          description?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      tags_master: {
        Row: {
          id: string;
          tag_name: string;
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tag_name: string;
          description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tag_name?: string;
          description?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
    };
  };
};