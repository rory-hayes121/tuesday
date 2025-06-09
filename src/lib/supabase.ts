import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  console.warn('Using placeholder values for development. This will not work in production.');
}

// Use environment variables or fallback to placeholder values for development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Test the connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('workspaces').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          plan: string;
          settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          plan?: string;
          settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          plan?: string;
          settings?: any;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          workspace_id: string;
          avatar_url: string | null;
          is_active: boolean;
          last_active: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: string;
          workspace_id: string;
          avatar_url?: string | null;
          is_active?: boolean;
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          workspace_id?: string;
          avatar_url?: string | null;
          is_active?: boolean;
          last_active?: string;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          role: string;
          workspace_id: string;
          invited_by: string;
          token: string;
          status: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: string;
          workspace_id: string;
          invited_by: string;
          token: string;
          status?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          workspace_id?: string;
          invited_by?: string;
          token?: string;
          status?: string;
          expires_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          workspace_id: string;
          service: string;
          credentials: any;
          is_active: boolean;
          created_by: string;
          last_used: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          service: string;
          credentials: any;
          is_active?: boolean;
          created_by: string;
          last_used?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          service?: string;
          credentials?: any;
          is_active?: boolean;
          created_by?: string;
          last_used?: string | null;
        };
      };
      agents: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          blocks: any;
          status: string;
          created_by: string;
          last_run: string | null;
          run_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          blocks: any;
          status?: string;
          created_by: string;
          last_run?: string | null;
          run_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          blocks?: any;
          status?: string;
          created_by?: string;
          last_run?: string | null;
          run_count?: number;
          updated_at?: string;
        };
      };
    };
  };
};