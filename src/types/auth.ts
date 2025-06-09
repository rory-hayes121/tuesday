export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'employee';
  workspaceId: string;
  createdAt: string;
  lastActive: string;
  isActive: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  allowEmployeeInvites: boolean;
  defaultRole: 'admin' | 'employee';
  integrationPolicy: 'admin_only' | 'shared';
  agentVisibility: 'workspace' | 'creator_only';
}

export interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  workspaceId: string;
  invitedBy: string;
  token: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: UserPermissions;
}

export interface UserPermissions {
  canManageWorkspace: boolean;
  canManageIntegrations: boolean;
  canManageTeam: boolean;
  canViewBilling: boolean;
  canCreateAgents: boolean;
  canEditAllAgents: boolean;
  canDeleteAgents: boolean;
  canManageTemplates: boolean;
}