/*
  # Complete AgentFlow Database Schema

  1. New Tables
    - `workspaces` - Multi-tenant workspace management
    - `users` - Extended user profiles with roles (admin/employee)  
    - `invitations` - Token-based team invitations
    - `integrations` - Workspace-scoped integrations with encrypted credentials
    - `agents` - AI agent definitions with workflow blocks

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for workspace-based access control
    - Role-based permissions (admin vs employee)

  3. Functions
    - Trigger function for updating timestamps
    - UUID generation for primary keys

  4. Indexes
    - Performance indexes for common queries
    - Unique constraints for data integrity
*/

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  avatar_url text,
  is_active boolean DEFAULT true,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service text NOT NULL,
  credentials jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_used timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  blocks jsonb NOT NULL DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_run timestamptz,
  run_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace_id ON invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace_id ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agents_workspace_id ON agents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agents_created_by ON agents(created_by);

-- Create triggers for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Workspaces policies
CREATE POLICY "Users can create workspaces as owners"
  ON workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own workspace"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Workspace owners can update their workspace"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Users policies
CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Invitations policies
CREATE POLICY "Admins can manage invitations"
  ON invitations
  FOR ALL
  TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Integrations policies
CREATE POLICY "Admins can manage integrations"
  ON integrations
  FOR ALL
  TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Workspace members can view integrations"
  ON integrations
  FOR SELECT
  TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Agents policies
CREATE POLICY "Users can create agents"
  ON agents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Workspace members can view agents"
  ON agents
  FOR SELECT
  TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their own agents"
  ON agents
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all workspace agents"
  ON agents
  FOR ALL
  TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));