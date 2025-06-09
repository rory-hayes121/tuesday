# AgentFlow - No-Code AI Agent Builder

A modern, production-ready application for building AI agents without code. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Landing Page**: Professional marketing site with conversion optimization
- **Authentication System**: Complete Supabase integration with workspace creation
- **Multi-Tenant Architecture**: Secure, scalable workspace-based system
- **Visual Agent Builder**: Modern drag-and-drop interface for creating AI workflows
- **Team Management**: Role-based permissions and invitation system
- **Integration Management**: Secure credential storage for external services
- **Template System**: Pre-built agent templates for common use cases

## Database Setup

This application requires a Supabase database. Follow these steps to set up your database:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Go to Settings > API to get your project URL and anon key

### 2. Set Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Migrations

The database schema is defined in `supabase/migrations/`. To apply the migrations:

1. Install the Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Apply migrations: `supabase db push`

Alternatively, you can run the SQL migrations manually in your Supabase dashboard:

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/migrations/20250609134718_royal_tree.sql`
3. Run the query
4. Copy and paste the contents of `supabase/migrations/20250609135649_fragrant_jungle.sql`
5. Run the query

### 4. Configure Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Disable "Enable email confirmations" (for development)
3. Set "Site URL" to your application URL
4. Configure any additional auth providers if needed

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Database Schema

The application uses the following main tables:

- **workspaces**: Multi-tenant workspace management
- **users**: Extended user profiles with roles (admin/employee)
- **invitations**: Token-based team invitations
- **integrations**: Workspace-scoped integrations with encrypted credentials
- **agents**: AI agent definitions with workflow blocks

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Permissions**: Admin vs Employee access levels
- **Workspace Isolation**: Multi-tenant data separation
- **Encrypted Credentials**: Secure integration storage

## Authentication Flow

1. **Signup**: Creates workspace + admin user
2. **Login**: Authenticates existing users
3. **Invitations**: Email-based team member invitations
4. **Role Management**: Admin/Employee permission system

## Testing the Database Connection

The application includes built-in connection testing:

1. When you load the login/signup pages, you'll see a connection status indicator
2. Green = Connected successfully
3. Red = Connection failed (check your environment variables)
4. Blue = Checking connection

## Deployment

The application is ready for deployment to any static hosting service:

- **Netlify**: Automatic deployments from Git
- **Vercel**: Zero-config deployments
- **AWS S3 + CloudFront**: Static hosting with CDN

Make sure to set your environment variables in your deployment platform.

## Production Checklist

- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Authentication settings configured
- [ ] RLS policies tested
- [ ] SSL/HTTPS enabled
- [ ] Domain configured

## Support

For issues with database setup or authentication, check:

1. Supabase project is fully initialized
2. Environment variables are correctly set
3. Database migrations have been applied
4. RLS policies are active
5. Authentication is properly configured

The application includes detailed logging to help diagnose connection issues.