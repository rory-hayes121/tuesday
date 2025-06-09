import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, testConnection } from '../lib/supabase';
import { User, Workspace, AuthState, UserPermissions } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string, workspaceName: string) => Promise<void>;
  acceptInvitation: (token: string, password: string, name: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  connectionStatus: 'checking' | 'connected' | 'disconnected';
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    workspace: null,
    isAuthenticated: false,
    isLoading: true,
    permissions: getDefaultPermissions()
  });
  
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    // Test database connection first
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Test the connection
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (!isConnected) {
        console.warn('Database connection failed. Authentication features will be limited.');
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check for existing session
      await checkAuthStatus();

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          await loadUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            workspace: null,
            isAuthenticated: false,
            isLoading: false,
            permissions: getDefaultPermissions()
          });
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setConnectionStatus('disconnected');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const checkAuthStatus = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check failed:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      if (session?.user) {
        console.log('Existing session found for:', session.user.email);
        await loadUserData(session.user);
      } else {
        console.log('No existing session found');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadUserData = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading user data for:', supabaseUser.email);
      
      // Try to get user profile - use maybeSingle() instead of single() to handle no rows gracefully
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (userError) {
        console.error('Failed to load user profile:', userError);
        // Sign out the user and clear state
        await supabase.auth.signOut();
        setAuthState({
          user: null,
          workspace: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: getDefaultPermissions()
        });
        return;
      }

      // If no user profile exists, sign out the user
      if (!userProfile) {
        console.warn('User profile not found for authenticated user:', supabaseUser.email);
        console.warn('This user exists in auth but not in the users table. Signing out...');
        await supabase.auth.signOut();
        setAuthState({
          user: null,
          workspace: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: getDefaultPermissions()
        });
        return;
      }

      // Get workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', userProfile.workspace_id)
        .maybeSingle();

      if (workspaceError) {
        console.error('Failed to load workspace:', workspaceError);
        await supabase.auth.signOut();
        setAuthState({
          user: null,
          workspace: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: getDefaultPermissions()
        });
        return;
      }

      if (!workspace) {
        console.error('Workspace not found for user:', userProfile.email);
        await supabase.auth.signOut();
        setAuthState({
          user: null,
          workspace: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: getDefaultPermissions()
        });
        return;
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role as 'admin' | 'employee',
        workspaceId: userProfile.workspace_id,
        avatar: userProfile.avatar_url,
        createdAt: userProfile.created_at,
        lastActive: userProfile.last_active,
        isActive: userProfile.is_active
      };

      const workspaceData: Workspace = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        ownerId: workspace.owner_id,
        plan: workspace.plan as 'free' | 'pro' | 'enterprise',
        createdAt: workspace.created_at,
        settings: workspace.settings || getDefaultWorkspaceSettings()
      };

      console.log('User data loaded successfully:', user.email, workspaceData.name);

      setAuthState({
        user,
        workspace: workspaceData,
        isAuthenticated: true,
        isLoading: false,
        permissions: calculatePermissions(user, workspaceData)
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Clear auth state and sign out on any unexpected error
      await supabase.auth.signOut();
      setAuthState({
        user: null,
        workspace: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: getDefaultPermissions()
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login failed:', error.message);
        throw error;
      }

      if (!data.user) {
        throw new Error('Login failed - no user returned');
      }

      console.log('Login successful for:', email);
      // loadUserData will be called automatically by the auth state change listener
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, workspaceName: string) => {
    try {
      console.log('Starting signup process for:', email, 'workspace:', workspaceName);
      
      // Use the Edge Function to create workspace and user
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-workspace`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          name,
          workspaceName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error('Edge function failed:', errorData);
        throw new Error(errorData.error || 'Failed to create workspace');
      }

      const result = await response.json();
      console.log('Workspace creation successful:', result);

      // Now sign in the user with the credentials they just created
      console.log('Signing in user after account creation...');
      await login(email, password);
      
      console.log('Signup and login completed successfully for:', email);
      
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const acceptInvitation = async (token: string, password: string, name: string) => {
    try {
      console.log('Attempting to accept invitation with token:', token);
      
      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      console.log('Valid invitation found for:', invitation.email);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (authError) {
        console.error('Auth signup failed:', authError.message);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('Auth user created for invitation:', authData.user.id);

      // Create user profile in custom users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: invitation.email,
          name,
          role: invitation.role,
          workspace_id: invitation.workspace_id,
          is_active: true,
          last_active: new Date().toISOString()
        });

      if (profileError) {
        console.error('User profile creation failed:', profileError.message);
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile: ' + profileError.message);
      }

      console.log('User profile created in custom users table for invitation');

      // Update invitation status
      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      console.log('Invitation accepted successfully');
      
      // The auth state change listener will handle loading the user data
    } catch (error) {
      console.error('Accept invitation error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!authState.user) throw new Error('No user logged in');

      console.log('Updating profile for:', authState.user.email);

      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          avatar_url: updates.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', authState.user.id);

      if (error) {
        console.error('Profile update failed:', error.message);
        throw error;
      }

      // Update local state
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null
      }));

      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        signup,
        acceptInvitation,
        updateProfile,
        connectionStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function calculatePermissions(user: User, workspace: Workspace): UserPermissions {
  const isAdmin = user.role === 'admin';
  const isOwner = workspace.ownerId === user.id;

  return {
    canManageWorkspace: isAdmin,
    canManageIntegrations: isAdmin,
    canManageTeam: isAdmin,
    canViewBilling: isAdmin,
    canCreateAgents: true,
    canEditAllAgents: isAdmin,
    canDeleteAgents: isAdmin,
    canManageTemplates: isAdmin
  };
}

function getDefaultPermissions(): UserPermissions {
  return {
    canManageWorkspace: false,
    canManageIntegrations: false,
    canManageTeam: false,
    canViewBilling: false,
    canCreateAgents: false,
    canEditAllAgents: false,
    canDeleteAgents: false,
    canManageTemplates: false
  };
}

function getDefaultWorkspaceSettings() {
  return {
    allowEmployeeInvites: false,
    defaultRole: 'employee',
    integrationPolicy: 'admin_only',
    agentVisibility: 'workspace'
  };
}