# User Flows for Workspace-Based RBAC System

## 1. Admin Signup & Workspace Creation

### Flow Steps:
1. **Landing Page** → User clicks "Create workspace"
2. **Signup Form** → User enters:
   - Full name
   - Email address
   - Workspace name
   - Password
3. **Account Creation** → System creates:
   - Workspace with unique slug
   - Admin user account
   - Default workspace settings
4. **Onboarding Flow** → Optional steps:
   - Connect first integration
   - Invite team members
   - Create first agent
5. **Dashboard** → User lands on main dashboard

### Technical Implementation:
```javascript
// POST /api/auth/signup
{
  email: "admin@company.com",
  password: "securepass",
  name: "John Doe",
  workspaceName: "Acme Corp"
}

// Response includes JWT token and user/workspace data
{
  token: "jwt-token",
  user: { id, email, name, role: "admin", workspaceId },
  workspace: { id, name, slug, settings }
}
```

## 2. Employee Invitation & Acceptance

### Admin Invitation Flow:
1. **Team Page** → Admin clicks "Invite Member"
2. **Invitation Modal** → Admin enters:
   - Email address
   - Role (admin/employee)
3. **Email Sent** → System sends invitation email with token
4. **Tracking** → Invitation appears in "Pending Invites"

### Employee Acceptance Flow:
1. **Email Link** → Employee clicks invitation link
2. **Invitation Page** → Shows workspace details and role
3. **Account Setup** → Employee enters:
   - Full name
   - Password
4. **Account Creation** → System creates employee account
5. **Dashboard** → Employee lands on role-appropriate dashboard

### Technical Implementation:
```javascript
// Admin sends invitation
POST /api/workspaces/:id/invitations
{
  email: "employee@company.com",
  role: "employee"
}

// Employee accepts invitation
POST /api/auth/accept-invitation
{
  token: "invitation-token",
  name: "Jane Smith",
  password: "newpassword"
}
```

## 3. Role-Based Navigation & Permissions

### Admin Navigation:
- ✅ Home, Dashboard, Agents, Templates
- ✅ Integrations (full management)
- ✅ Team (member management)
- ✅ Settings (workspace configuration)
- ✅ Billing (subscription management)

### Employee Navigation:
- ✅ Home, Dashboard, Agents, Templates
- ❌ Integrations (hidden)
- ❌ Team (hidden)
- ❌ Settings (hidden)
- ❌ Billing (hidden)

### Permission Enforcement:
```javascript
// Frontend route protection
<ProtectedRoute requiredPermission="canManageIntegrations">
  <Integrations />
</ProtectedRoute>

// Backend middleware
app.use('/api/integrations', requireRole(['admin']));
app.use('/api/team', requireRole(['admin']));
```

## 4. Integration Management (Admin Only)

### Admin Flow:
1. **Integrations Page** → View connected tools
2. **Add Integration** → Click "Connect" on service
3. **Credentials Modal** → Enter API keys/secrets
4. **Test Connection** → Verify credentials work
5. **Save & Encrypt** → Store encrypted credentials
6. **Agent Builder** → Integrations available in tool blocks

### Employee Experience:
- **Agent Builder** → Can use existing integrations
- **Tool Blocks** → Dropdown shows connected services
- **No Management** → Cannot add/edit/remove integrations

## 5. Agent Creation & Sharing

### Workspace-Wide Agents:
1. **Any User** → Creates agent in builder
2. **Save Agent** → Agent visible to all workspace members
3. **Edit Permissions**:
   - **Creator** → Can edit their own agents
   - **Admin** → Can edit any agent
   - **Employee** → Can only edit own agents

### Agent Visibility Settings:
```javascript
// Workspace settings control agent visibility
{
  agentVisibility: "workspace" | "creator_only"
}

// If "workspace" → All members see all agents
// If "creator_only" → Users only see their own agents
```

## 6. User Profile Management

### All Users Can:
- Update name and email
- Change password
- Upload profile photo
- View current role

### Role Changes:
- **Admin** → Can change other users' roles
- **Employee** → Cannot change roles (contact admin)
- **Owner** → Cannot be demoted (transfer ownership first)

## 7. Workspace Settings (Admin Only)

### General Settings:
- Workspace name
- Workspace URL (slug)
- Default member role

### Team Policies:
- Allow employee invitations
- Default role for new members
- Member removal policies

### Security Settings:
- Integration management policy
- Agent visibility settings
- Data retention policies

### Billing & Subscription:
- Plan management
- Usage monitoring
- Payment methods

## 8. Data Isolation & Security

### Workspace Isolation:
- All data scoped to workspace ID
- Users cannot access other workspaces
- API routes validate workspace membership

### Permission Layers:
1. **Authentication** → Valid JWT token
2. **Workspace Access** → User belongs to workspace
3. **Role Permissions** → User has required role
4. **Resource Ownership** → User owns resource (for some actions)

### Example API Security:
```javascript
// Middleware stack for protected routes
app.use('/api/workspaces/:id/*', [
  authenticateToken,
  validateWorkspaceAccess,
  checkRolePermissions
]);

// Resource-level permissions
app.delete('/api/agents/:id', [
  authenticateToken,
  validateWorkspaceAccess,
  requireAgentOwnershipOrAdmin
]);
```

## 9. Error Handling & Edge Cases

### Invalid Invitations:
- Expired tokens → Show error page
- Already accepted → Redirect to login
- Invalid workspace → Show error message

### Permission Denied:
- Clear error messages
- Suggest contacting admin
- Graceful fallbacks

### Workspace Deletion:
- Only owner can delete
- Confirmation required
- All data permanently removed
- Members notified via email

## 10. Mobile & Responsive Considerations

### Mobile Navigation:
- Collapsible sidebar
- Touch-friendly interactions
- Responsive modals

### Role Indicators:
- Clear role badges
- Permission hints
- Contextual help text

This comprehensive user flow system ensures proper role-based access control while maintaining a smooth user experience across all workspace interactions.