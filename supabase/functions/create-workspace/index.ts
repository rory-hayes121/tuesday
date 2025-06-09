import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateWorkspaceRequest {
  email: string;
  password: string;
  name: string;
  workspaceName: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { email, password, name, workspaceName }: CreateWorkspaceRequest = await req.json();

    // Validate required fields
    if (!email || !password || !name || !workspaceName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting workspace creation for:', email);

    // Step 1: Create auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name,
        workspace_name: workspaceName
      }
    });

    if (authError) {
      console.error('Auth user creation failed:', authError.message);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Step 2: Create workspace using service role (bypasses RLS)
    const workspaceSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name: workspaceName,
        slug: workspaceSlug,
        owner_id: authData.user.id,
        plan: 'free',
        settings: {
          allowEmployeeInvites: false,
          defaultRole: 'employee',
          integrationPolicy: 'admin_only',
          agentVisibility: 'workspace'
        }
      })
      .select()
      .single();

    if (workspaceError) {
      console.error('Workspace creation failed:', workspaceError.message);
      
      // Clean up auth user if workspace creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create workspace: ' + workspaceError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Workspace created:', workspace.id);

    // Step 3: Create user profile using service role (bypasses RLS)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        name: name,
        role: 'admin',
        workspace_id: workspace.id,
        is_active: true,
        last_active: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('User profile creation failed:', profileError.message);
      
      // Clean up: delete workspace and auth user
      try {
        await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup after profile creation error:', cleanupError);
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile: ' + profileError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User profile created successfully');

    // Step 4: Generate session for the user to auto-login
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard`
      }
    });

    if (sessionError) {
      console.error('Session generation failed:', sessionError.message);
      // Don't fail the entire process, just log the error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userProfile,
        workspace: workspace,
        message: 'Account created successfully. You can now sign in.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});