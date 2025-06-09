# API Routes for Workspace-Based RBAC System

## Authentication Routes

### POST /api/auth/signup
Create new workspace and admin user
```json
{
  "email": "admin@company.com",
  "password": "securepassword",
  "name": "John Doe",
  "workspaceName": "Acme Corp"
}
```

### POST /api/auth/login
Authenticate user
```json
{
  "email": "user@company.com",
  "password": "password"
}
```

### GET /api/auth/me
Get current user and workspace info
```json
{
  "user": { "id": "...", "email": "...", "role": "admin" },
  "workspace": { "id": "...", "name": "...", "settings": {...} }
}
```

### POST /api/auth/accept-invitation
Accept team invitation
```json
{
  "token": "invitation-token",
  "password": "newpassword",
  "name": "Jane Smith"
}
```

## Workspace Management

### PATCH /api/workspaces/:id/settings
Update workspace settings (Admin only)
```json
{
  "allowEmployeeInvites": true,
  "defaultRole": "employee",
  "integrationPolicy": "admin_only"
}
```

### DELETE /api/workspaces/:id
Delete workspace (Owner only)

## Team Management

### POST /api/workspaces/:id/invitations
Send team invitation (Admin only)
```json
{
  "email": "newuser@company.com",
  "role": "employee"
}
```

### GET /api/workspaces/:id/members
List workspace members
```json
{
  "members": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "admin",
      "lastActive": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### PATCH /api/workspaces/:id/members/:userId
Update member role (Admin only)
```json
{
  "role": "admin"
}
```

### DELETE /api/workspaces/:id/members/:userId
Remove team member (Admin only)

## Integration Management

### POST /api/workspaces/:id/integrations
Create integration (Admin only)
```json
{
  "service": "slack",
  "credentials": {
    "apiKey": "encrypted-key",
    "apiSecret": "encrypted-secret"
  }
}
```

### GET /api/workspaces/:id/integrations
List workspace integrations
```json
{
  "integrations": [
    {
      "id": "...",
      "service": "slack",
      "connected": true,
      "lastUsed": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Agent Management

### POST /api/workspaces/:id/agents
Create agent
```json
{
  "name": "Customer Support Bot",
  "description": "Handles customer inquiries",
  "blocks": [...]
}
```

### GET /api/workspaces/:id/agents
List workspace agents
```json
{
  "agents": [
    {
      "id": "...",
      "name": "Support Bot",
      "status": "active",
      "createdBy": "user-id",
      "lastRun": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### PUT /api/workspaces/:id/agents/:agentId
Update agent (Creator or Admin)

### DELETE /api/workspaces/:id/agents/:agentId
Delete agent (Creator or Admin)

## Middleware Requirements

### Authentication Middleware
```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};
```

### Role-Based Access Control
```javascript
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const requireWorkspaceAccess = async (req, res, next) => {
  const workspaceId = req.params.workspaceId || req.params.id;
  if (req.user.workspaceId !== workspaceId) {
    return res.status(403).json({ error: 'Workspace access denied' });
  }
  next();
};
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  avatar_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Workspaces Table
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  plan VARCHAR(50) DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Invitations Table
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  invited_by UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Integrations Table
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  service VARCHAR(100) NOT NULL,
  credentials JSONB NOT NULL, -- Encrypted
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Agents Table
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  blocks JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id),
  last_run TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```